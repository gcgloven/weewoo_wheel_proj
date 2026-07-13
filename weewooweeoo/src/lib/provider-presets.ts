/**
 * Curated LLM provider presets for quick configuration.
 * Each preset pre-fills base URL, default model, and max tokens.
 */
import type { ProviderPreset } from './types';

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    defaultMaxTokens: 2048,
    models: [
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4.5-preview',
      'gpt-4.1',
      'o4-mini',
      'o3-mini',
    ],
    websiteUrl: 'https://platform.openai.com',
    icon: '🤖',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    defaultMaxTokens: 8192,
    models: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    websiteUrl: 'https://aistudio.google.com',
    icon: '🌐',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    defaultMaxTokens: 4096,
    models: [
      'deepseek-chat',
      'deepseek-reasoner',
    ],
    websiteUrl: 'https://platform.deepseek.com',
    icon: '🐋',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultMaxTokens: 4096,
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    websiteUrl: 'https://console.groq.com',
    icon: '⚡',
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    defaultMaxTokens: 4096,
    models: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
    ],
    websiteUrl: 'https://api.together.xyz',
    icon: '🔗',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    defaultMaxTokens: 2048,
    models: [
      'llama3.2',
      'llama3.1',
      'mistral',
      'gemma2',
      'qwen2.5',
    ],
    websiteUrl: 'https://ollama.com',
    icon: '🦙',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    defaultMaxTokens: 4096,
    models: [
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
      'anthropic/claude-3.5-sonnet',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
    ],
    websiteUrl: 'https://openrouter.ai',
    icon: '🔀',
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-1212',
    defaultMaxTokens: 4096,
    models: [
      'grok-2-1212',
      'grok-2-vision-1212',
      'grok-beta',
    ],
    websiteUrl: 'https://x.ai',
    icon: '🚀',
  },
];

/**
 * Find a preset by ID.
 */
export function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

/**
 * Find a preset by matching base URL.
 */
export function findPresetByUrl(baseUrl: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.baseUrl === baseUrl);
}
