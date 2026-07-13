import type { CardType, SearchSettings, PromptTemplate } from '../types';
import type { ChatMessage } from '../provider';
import type { Language } from '../i18n';
import { languageInstruction } from '../i18n';
import { buildExplainPrompt } from './explain';
import { buildSummaryPrompt } from './summary';
import { buildSearchPrompt } from './search';
import { buildTaskPrompt } from './task';

export interface WheelAction {
  id: string;
  label: string;
  cardType: CardType;
}

export const REGISTRY: Record<string, WheelAction> = {
  explain: { id: 'explain', label: 'Explain', cardType: 'knowledge' },
  summary: { id: 'summary', label: 'Summary', cardType: 'knowledge' },
  search:  { id: 'search',  label: 'Agent Browser Search', cardType: 'search' },
  task:    { id: 'task',    label: 'Create Task', cardType: 'task' },
};

type PromptBuilder = (search?: SearchSettings) => string;

const PROMPT_BUILDERS: Record<string, PromptBuilder> = {
  explain: () => buildExplainPrompt(),
  summary: () => buildSummaryPrompt(),
  search:  (s) => buildSearchPrompt(s),
  task:    () => buildTaskPrompt(),
};

/**
 * Get the system prompt for an action, considering prompt bank overrides.
 * Returns the custom prompt if one is active, otherwise the built-in default.
 */
export function getSystemPrompt(
  actionId: string,
  searchSettings?: SearchSettings,
  promptTemplates?: PromptTemplate[],
  activePromptId?: Record<string, string>,
): string {
  // Check if there's an active custom prompt for this action
  const activeId = activePromptId?.[actionId];
  if (activeId && promptTemplates) {
    const custom = promptTemplates.find((p) => p.id === activeId && !p.isDefault);
    if (custom) return custom.systemPrompt;
    const def = promptTemplates.find((p) => p.id === activeId && p.isDefault);
    if (def) return def.systemPrompt;
  }
  // Fall back to built-in
  return PROMPT_BUILDERS[actionId]?.(searchSettings) ?? '';
}

/**
 * Build the messages array for a given action.
 * Returns [systemPrompt, userMessageContainingSelection].
 */
export function buildPrompt(
  actionId: string,
  selection: string,
  searchSettings?: SearchSettings,
  language?: Language,
  promptTemplates?: PromptTemplate[],
  activePromptId?: Record<string, string>,
): ChatMessage[] {
  if (!PROMPT_BUILDERS[actionId]) throw new Error(`Unknown action: ${actionId}`);
  const systemContent = getSystemPrompt(actionId, searchSettings, promptTemplates, activePromptId) + languageInstruction(language ?? 'en');
  return [
    { role: 'system', content: systemContent },
    { role: 'user',   content: selection },
  ];
}
