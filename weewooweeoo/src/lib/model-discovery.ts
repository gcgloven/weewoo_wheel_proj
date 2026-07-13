/**
 * Smart model discovery — fetches available models from an OpenAI-compatible endpoint.
 * Works with any provider that exposes a /v1/models (or /models) endpoint.
 */
import type { ProviderPreset } from './types';
import { getPreset } from './provider-presets';

export interface ModelInfo {
  id: string;
  /** The model owner (e.g. "openai", "meta-llama"). */
  ownedBy?: string;
  /** Approximate context window (0 = unknown). */
  contextLength: number;
}

/**
 * Known context window sizes for common models.
 * Used as a fallback when the API doesn't report context length.
 */
const KNOWN_CONTEXTS: Record<string, number> = {
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4.5-preview': 128000,
  'gpt-4.1': 1000000,
  'gpt-4': 8192,
  'o4-mini': 200000,
  'o3-mini': 200000,
  'gemini-2.0-flash': 1048576,
  'gemini-2.0-flash-lite': 1048576,
  'gemini-2.5-pro': 1048576,
  'gemini-2.5-flash': 1048576,
  'gemini-1.5-pro': 2097152,
  'gemini-1.5-flash': 1048576,
  'deepseek-chat': 65536,
  'deepseek-reasoner': 65536,
  'llama-3.3-70b': 128000,
  'llama-3.1-8b': 128000,
  'mixtral-8x7b': 32768,
  'gemma2-9b': 8192,
  'claude-3.5-sonnet': 200000,
  'grok-2': 131072,
};

function guessContextLength(modelId: string): number {
  const lower = modelId.toLowerCase();
  for (const [key, ctx] of Object.entries(KNOWN_CONTEXTS)) {
    if (lower.includes(key)) return ctx;
  }
  // Default based on model family hints
  if (lower.includes('gpt-4')) return 128000;
  if (lower.includes('gemini')) return 1048576;
  if (lower.includes('claude')) return 200000;
  if (lower.includes('llama')) return 128000;
  return 0;
}

/**
 * Fetch available models from an OpenAI-compatible /v1/models endpoint.
 * Falls back to the preset's hardcoded model list if the API call fails.
 *
 * @returns Sorted list: recommended/default model first, then by context length descending.
 */
export async function fetchModels(
  baseUrl: string,
  apiKey: string,
  presetId: string,
): Promise<ModelInfo[]> {
  const preset = getPreset(presetId);

  // Try multiple URL patterns
  const urls = [
    `${baseUrl.replace(/\/$/, '')}/models`,
    `${baseUrl.replace(/\/$/, '')}/v1/models`,
  ];

  let models: ModelInfo[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) continue;

      const data = await res.json();
      const rawModels: Array<{ id: string; owned_by?: string }> =
        data.data ?? data.models ?? [];

      if (rawModels.length > 0) {
        models = rawModels
          .filter((m) => m.id && typeof m.id === 'string')
          .map((m) => ({
            id: m.id,
            ownedBy: m.owned_by,
            contextLength: guessContextLength(m.id),
          }))
          .sort((a, b) => {
            // Put the default model first
            if (preset && a.id === preset.defaultModel) return -1;
            if (preset && b.id === preset.defaultModel) return 1;
            // Then sort by context length descending
            return b.contextLength - a.contextLength;
          });
        break;
      }
    } catch {
      // Try next URL pattern
    }
  }

  // Fallback: use preset's hardcoded model list
  if (models.length === 0 && preset) {
    models = preset.models.map((id) => ({
      id,
      contextLength: guessContextLength(id),
    }));
    // Sort: default first
    models.sort((a, b) => {
      if (a.id === preset.defaultModel) return -1;
      if (b.id === preset.defaultModel) return 1;
      return b.contextLength - a.contextLength;
    });
  }

  return models;
}
