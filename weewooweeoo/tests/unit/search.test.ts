/**
 * Unit tests for the web search progressive fallback system.
 *
 * Tests cover:
 * - Capability probe & cache validation
 * - Search query derivation
 * - Orchestrator tier selection (A → B → C)
 */
import '@testing-library/jest-dom';

// ---- Mock fetch globally for all tests in this file ----
const originalFetch = global.fetch;
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof global.fetch;

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  mockFetch.mockReset();
});

// ---- Capability cache validation ----
import { isCapabilityCacheValid } from '../../src/lib/search/probe';

describe('isCapabilityCacheValid', () => {
  const cached = {
    toolCalling: true,
    probedAt: Date.now(),
    probedBaseUrl: 'https://api.openai.com/v1',
    probedModel: 'gpt-4o-mini',
  };

  test('returns true when baseUrl and model match', () => {
    expect(
      isCapabilityCacheValid(cached, 'https://api.openai.com/v1', 'gpt-4o-mini'),
    ).toBe(true);
  });

  test('returns false when baseUrl differs', () => {
    expect(
      isCapabilityCacheValid(cached, 'https://api.anthropic.com/v1', 'gpt-4o-mini'),
    ).toBe(false);
  });

  test('returns false when model differs', () => {
    expect(
      isCapabilityCacheValid(cached, 'https://api.openai.com/v1', 'gpt-4o'),
    ).toBe(false);
  });

  test('returns false for null cache', () => {
    expect(
      isCapabilityCacheValid(null, 'https://api.openai.com/v1', 'gpt-4o-mini'),
    ).toBe(false);
  });
});

// ---- Search query derivation ----
import { deriveSearchQuery } from '../../src/lib/search/scrape-search';

describe('deriveSearchQuery', () => {
  test('extracts first sentence up to 200 chars', () => {
    const text =
      'React is a JavaScript library for building user interfaces. It is maintained by Meta. It can be used to develop single-page applications.';
    const query = deriveSearchQuery(text);
    expect(query).toBe(
      'React is a JavaScript library for building user interfaces',
    );
  });

  test('returns full text if no sentence break within 200 chars', () => {
    const text = 'short-text-without-punctuation';
    expect(deriveSearchQuery(text)).toBe('short-text-without-punctuation');
  });

  test('trims whitespace', () => {
    expect(deriveSearchQuery('   hello world.   more text')).toBe('hello world');
  });
});

// ---- Orchestrator: Tier C (knowledge-only) fallback ----
import { runSearch } from '../../src/lib/search/index';

describe('runSearch orchestrator', () => {
  const chatOpts = {
    baseUrl: 'https://api.test.com/v1',
    apiKey: 'test-key',
    model: 'test-model',
    maxTokens: 256,
  };

  test('Tier C: knowledge-only when capability says tool calling unsupported', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Answer from knowledge.' } }],
      }),
    });

    const result = await runSearch(
      'What is TypeScript?',
      undefined,
      chatOpts,
      {
        toolCalling: false,
        probedAt: Date.now(),
        probedBaseUrl: 'https://api.test.com/v1',
        probedModel: 'test-model',
      },
    );

    expect(result.tier).toBe('C');
    expect(result.body).toBe('Answer from knowledge.');
  });

  test('Tier C falls back when all web search tiers fail', async () => {
    // Mock: LLM fails, scraping fails → falls through to Tier C
    // First call: scrapeSearch fails (mock doesn't have .text())
    // Second call: Tier C chat succeeds
    mockFetch
      .mockRejectedValueOnce(new Error('Network error')) // scrape attempt
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Fallback knowledge answer.' } }],
        }),
      });

    const result = await runSearch(
      'What is React?',
      undefined,
      chatOpts,
      {
        toolCalling: false,
        probedAt: Date.now(),
        probedBaseUrl: 'https://api.test.com/v1',
        probedModel: 'test-model',
      },
    );

    expect(result.tier).toBe('C');
    expect(result.body).toBe('Fallback knowledge answer.');
  });
});

// ---- DuckDuckGo HTML parsing (with sample HTML) ----
import { scrapeSearch } from '../../src/lib/search/scrape-search';

describe('scrapeSearch', () => {
  test('parses DuckDuckGo HTML results', async () => {
    const mockHtml = `
      <html>
      <body>
        <div class="results">
          <a class="result__a" href="https://react.dev">React Official Site</a>
          <a class="result__snippet">React is a JavaScript library for building user interfaces.</a>
          <a class="result__a" href="https://en.wikipedia.org/wiki/React_(JavaScript_library)">React (JavaScript library) - Wikipedia</a>
          <a class="result__snippet">React is a free and open-source front-end JavaScript library.</a>
        </div>
      </body>
      </html>
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const results = await scrapeSearch('React', 3);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toContain('React');
    expect(results[0].url).toBeTruthy();
  });

  test('handles empty results gracefully', async () => {
    const mockHtml = '<html><body>No results.</body></html>';

    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const results = await scrapeSearch('xyznonexistent12345', 5);
    expect(results).toEqual([]);
  });

  test('throws on HTTP error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
    });

    await expect(scrapeSearch('test')).rejects.toThrow('Search request failed: 429');
  });
});

// ---- Probe (mock fetch) ----
import { probeToolCalling } from '../../src/lib/search/probe';

describe('probeToolCalling', () => {
  test('returns toolCalling=true when API accepts tools parameter', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok', tool_calls: [] } }],
      }),
    });

    const result = await probeToolCalling({
      baseUrl: 'https://api.test.com/v1',
      apiKey: 'key',
      model: 'test',
      maxTokens: 10,
    });

    expect(result.toolCalling).toBe(true);
    expect(result.probedBaseUrl).toBe('https://api.test.com/v1');
    expect(result.probedModel).toBe('test');
    expect(result.probedAt).toBeGreaterThan(0);
  });

  test('returns toolCalling=false when API rejects tools parameter', async () => {
    mockFetch.mockRejectedValue(new Error('400 Bad Request'));

    const result = await probeToolCalling({
      baseUrl: 'https://api.test.com/v1',
      apiKey: 'key',
      model: 'test',
      maxTokens: 10,
    });

    expect(result.toolCalling).toBe(false);
  });
});
