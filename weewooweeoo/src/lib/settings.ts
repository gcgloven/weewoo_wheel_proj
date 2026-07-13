import type { Settings } from './types';
import { DEFAULT_PROMPTS } from './prompt-bank';

const STORAGE_KEY = 'settings';

const DEFAULTS: Settings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  maxTokens: 2048,
  slots: ['explain', 'summary', 'search'],
  search: {
    searchPrompt: '',
    searchDepth: 'top 3 most relevant results',
  },
  searchMode: 'knowledge',
  webSearchCapability: null,
  presetId: '',
  language: 'en',
  theme: 'light',
  wheelSkin: 'doodle',
  wheelTrigger: 'highlight',
  promptTemplates: DEFAULT_PROMPTS,
  activePromptId: {
    explain: 'explain-default',
    summary: 'summary-default',
    search: '',
    task: 'task-default',
  },
};

let cached: Settings | null = null;

// Invalidate cache whenever storage changes (e.g. user saves key in options page)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    cached = null;
  }
});

export async function getSettings(): Promise<Settings> {
  if (cached) return { ...cached };
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result?.[STORAGE_KEY];
  cached = { ...DEFAULTS, ...(stored ?? {}) };
  return { ...cached };
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  cached = next;
}
