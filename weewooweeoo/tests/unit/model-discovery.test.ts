/**
 * Tests for model discovery — API fetch with fallback.
 */
import { fetchModels } from '../../src/lib/model-discovery';

const mockFetch = jest.fn();
const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof global.fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchModels', () => {
  test('falls back to preset models when API returns empty', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const models = await fetchModels(
      'https://api.openai.com/v1',
      'sk-test',
      'openai',
    );

    expect(models.length).toBeGreaterThan(0);
    expect(models[0].id).toBe('gpt-4o-mini');
  });

  test('falls back to preset when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const models = await fetchModels(
      'https://api.openai.com/v1',
      'sk-test',
      'openai',
    );

    expect(models.length).toBeGreaterThan(0);
  });

  test('parses real API response correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'gpt-4o-mini', owned_by: 'openai' },
          { id: 'gpt-4o', owned_by: 'openai' },
          { id: 'custom-model', owned_by: 'org' },
        ],
      }),
    });

    const models = await fetchModels(
      'https://api.openai.com/v1',
      'sk-test',
      'openai',
    );

    expect(models.length).toBe(3);
    expect(models[0].id).toBe('gpt-4o-mini');
    const gpt4o = models.find((m) => m.id === 'gpt-4o');
    expect(gpt4o?.contextLength).toBeGreaterThan(0);
  });

  test('returns empty array for unknown preset with no API', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));

    const models = await fetchModels(
      'https://unknown.com/v1',
      '',
      '',
    );

    expect(models).toEqual([]);
  });
});
