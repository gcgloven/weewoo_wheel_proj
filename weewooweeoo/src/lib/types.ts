export type CardType = 'knowledge' | 'task' | 'search';

export interface Card {
  id: string;
  type: CardType;
  title: string;
  body: string;
  tags: string[];
  folder: string;
  sourceUrl: string;
  sourceTitle: string;
  originalText: string;
  createdAt: number;
  updatedAt: number;
}

export type NewCard = Omit<Card, 'id' | 'createdAt' | 'updatedAt'>;

/** Web search mode: agentic = real web search (tier A→B), knowledge = LLM training data only. */
export type SearchMode = 'agentic' | 'knowledge';

/** Cached capability probe result. `null` = not yet probed. */
export interface WebSearchCapability {
  /** Whether the LLM provider supports tool/function calling (required for Tier A). */
  toolCalling: boolean;
  /** The provider baseUrl + model used when probing — re-probe if these change. */
  probedAt: number;
  probedBaseUrl: string;
  probedModel: string;
}

export interface SearchSettings {
  /** Custom system prompt override for the search action (empty = use default). */
  searchPrompt: string;
  /** Number of search results / depth hint for the LLM (e.g. "top 3" or "comprehensive"). */
  searchDepth: string;
}

export interface Settings {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  slots: [string, string, string]; // action ids per wheel slot
  search: SearchSettings;
  /** Web search mode — defaults to 'knowledge' (no real search). */
  searchMode: SearchMode;
  /** Cached LLM capability probe result. */
  webSearchCapability: WebSearchCapability | null;
  /** Selected provider preset ID. Empty string = custom/manual. */
  presetId: string;
  /** UI + response language. */
  language: 'en' | 'zh';
  /** UI theme. */
  theme: 'dark' | 'light';
  /** Wheel button skin pack. */
  wheelSkin: 'emoji' | 'doodle';
  /** How the wheel is triggered: on text highlight (default) or right-click only. */
  wheelTrigger: 'highlight' | 'rightclick';
  /** Saved prompt templates (prompt bank). */
  promptTemplates: PromptTemplate[];
  /** Active prompt template per action. actionId → templateId. */
  activePromptId: Record<string, string>;
}

/** A user-saved prompt template in the prompt bank. */
export interface PromptTemplate {
  id: string;
  /** User-given name for this prompt variant. */
  name: string;
  /** Which action this prompt is for. */
  actionId: string;
  /** The system prompt text. */
  systemPrompt: string;
  /** Built-in defaults cannot be deleted or renamed. */
  isDefault: boolean;
}

/** LLM provider preset for quick configuration. */
export interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  /** Recommended default model. */
  defaultModel: string;
  /** Default max tokens for this provider. */
  defaultMaxTokens: number;
  /** All known models for this provider (for smart discovery fallback). */
  models: string[];
  websiteUrl: string;
  /** Emoji icon for UI display. */
  icon: string;
}
