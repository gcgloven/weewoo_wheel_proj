/**
 * Tests for provider presets integrity and lookup functions.
 */
import {
  PROVIDER_PRESETS,
  getPreset,
  findPresetByUrl,
} from '../../src/lib/provider-presets';

describe('PROVIDER_PRESETS', () => {
  test('contains expected providers', () => {
    const ids = PROVIDER_PRESETS.map((p) => p.id);
    expect(ids).toContain('openai');
    expect(ids).toContain('google');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('groq');
    expect(ids).toContain('ollama');
    expect(ids).toContain('openrouter');
    expect(ids.length).toBeGreaterThanOrEqual(6);
  });

  test('every preset has required fields', () => {
    for (const preset of PROVIDER_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.baseUrl).toBeTruthy();
      expect(preset.baseUrl).toMatch(/^https?:\/\//);
      expect(preset.defaultModel).toBeTruthy();
      expect(preset.defaultMaxTokens).toBeGreaterThan(0);
      expect(preset.models.length).toBeGreaterThan(0);
      expect(preset.icon).toBeTruthy();
    }
  });

  test('no duplicate preset IDs', () => {
    const ids = PROVIDER_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all base URLs are unique', () => {
    const urls = PROVIDER_PRESETS.map((p) => p.baseUrl);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe('getPreset', () => {
  test('finds preset by ID', () => {
    const preset = getPreset('openai');
    expect(preset).toBeDefined();
    expect(preset!.name).toBe('OpenAI');
  });

  test('returns undefined for unknown ID', () => {
    expect(getPreset('nonexistent')).toBeUndefined();
  });
});

describe('findPresetByUrl', () => {
  test('finds preset by base URL', () => {
    const preset = findPresetByUrl('https://api.openai.com/v1');
    expect(preset).toBeDefined();
    expect(preset!.id).toBe('openai');
  });

  test('returns undefined for unmatched URL', () => {
    expect(findPresetByUrl('https://unknown.example.com')).toBeUndefined();
  });
});
