/**
 * LLM tool-calling capability probe.
 * Sends a minimal request with a dummy tool to check if the provider supports
 * function calling. Result is cached in settings to avoid repeated probes.
 */
import { chatWithTools, type ChatOpts } from '../provider';
import type { WebSearchCapability } from '../types';

const PROBE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'ping',
    description: 'A no-op probe to detect tool calling support.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

/**
 * Probe whether the configured LLM provider supports tool/function calling.
 * Returns a WebSearchCapability object to cache in settings.
 */
export async function probeToolCalling(opts: ChatOpts): Promise<WebSearchCapability> {
  try {
    const res = await chatWithTools(
      [{ role: 'user', content: 'Say "ok" if you receive this.' }],
      [PROBE_TOOL],
      { ...opts, maxTokens: 10 },
    );
    // If we got here without error, tool calling is supported (even if the model
    // chose not to call the tool — the API accepted the `tools` parameter).
    // Some providers that don't support tools return a 400 error for unknown params.
    return {
      toolCalling: true,
      probedAt: Date.now(),
      probedBaseUrl: opts.baseUrl,
      probedModel: opts.model,
    };
  } catch {
    // Provider rejected the `tools` parameter — tool calling not supported.
    return {
      toolCalling: false,
      probedAt: Date.now(),
      probedBaseUrl: opts.baseUrl,
      probedModel: opts.model,
    };
  }
}

/**
 * Check if a cached capability is still valid for the current provider.
 * Invalid if baseUrl or model changed since the probe.
 */
export function isCapabilityCacheValid(
  cached: WebSearchCapability | null,
  baseUrl: string,
  model: string,
): cached is WebSearchCapability {
  if (!cached) return false;
  return cached.probedBaseUrl === baseUrl && cached.probedModel === model;
}
