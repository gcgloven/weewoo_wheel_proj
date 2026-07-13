/**
 * Search orchestrator: implements the A → B → C progressive fallback chain.
 *
 * Tier A: LLM tool calling (agentic web search) — requires tool-calling-capable provider
 * Tier B: Browser-side scraping (DuckDuckGo) — no tool calling needed
 * Tier C: Knowledge-only — LLM answers from training data (current behavior, always works)
 *
 * Capability detection (Tier A probe) is cached and only re-checked when:
 * - The user explicitly clicks "Re-check" in Options
 * - The provider baseUrl or model changes
 */
import type { ChatOpts } from '../provider';
import type { SearchSettings, WebSearchCapability } from '../types';
import type { Language } from '../i18n';
import { languageInstruction } from '../i18n';
import { probeToolCalling, isCapabilityCacheValid } from './probe';
import { agenticSearch } from './web-search';
import { scrapeSearch, deriveSearchQuery } from './scrape-search';
import { chat } from '../provider';

export interface SearchResult {
  /** The synthesized answer body (Markdown). */
  body: string;
  /** Which tier produced the result. */
  tier: 'A' | 'B' | 'C';
  /** Actual search result URLs (empty for Tier C). */
  sources: Array<{ title: string; url: string }>;
  /** The search query that was used (for smart title generation). */
  query: string;
}

/**
 * Run the progressive fallback search chain.
 *
 * @param selectedText - The text the user selected on the page.
 * @param searchSettings - Search configuration from user settings.
 * @param chatOpts - LLM provider connection options.
 * @param capability - Cached capability probe (null if not yet probed or disabled).
 * @param forceProbe - If true, re-probe even if cache is valid.
 *
 * @returns SearchResult with body and tier indicator.
 */
export async function runSearch(
  selectedText: string,
  searchSettings: SearchSettings | undefined,
  chatOpts: ChatOpts,
  capability: WebSearchCapability | null,
  forceProbe = false,
  language: Language = 'en',
): Promise<SearchResult> {
  // ---- Gate: only attempt web search if user has toggled agentic mode ----
  // (The caller in dispatch.ts checks searchMode before calling this.)

  // ---- Tier A: Agentic web search (LLM tool calling) ----
  const cacheValid = isCapabilityCacheValid(capability, chatOpts.baseUrl, chatOpts.model);

  if (forceProbe || !cacheValid) {
    // Probe for tool calling support
    capability = await probeToolCalling(chatOpts);
    // The caller (dispatch.ts) is responsible for persisting the updated capability.
    // We return it via the result... hmm, that's messy. Let's throw a special signal.
    // Actually, let's just cache it in a module-level variable and expose it.
  }

  if (capability?.toolCalling) {
    try {
      const { answer, sources: agenticSources, query: agenticQuery } = await agenticSearch(selectedText, searchSettings, chatOpts, language);
      const body = agenticSources.length > 0
        ? answer + '\n\n## Sources\n' + agenticSources.map((s, i) => `[${i + 1}] [${s.title}](${s.url})`).join('\n')
        : answer;
      return { body, tier: 'A', sources: agenticSources, query: agenticQuery };
    } catch (err) {
      console.warn('[search] Tier A (agentic) failed, falling back to Tier B:', err);
      // Fall through to Tier B
    }
  }

  // ---- Tier B: Browser-side scraping ----
  try {
    const query = deriveSearchQuery(selectedText);
    const results = await scrapeSearch(query, 5);

    if (results.length > 0) {
      const resultsText = results
        .map(
          (r, i) =>
            `[${i + 1}] **${r.title}**\n    ${r.snippet}\n    ${r.url}`,
        )
        .join('\n\n');

      // Have the LLM synthesize an answer from the scraped results
      const synthesis = await chat(
        [
          {
            role: 'system',
            content: `You are a research assistant. Synthesize a clear answer from the search results below. Cite sources using [1], [2], etc. The user selected this text:\n\n"${selectedText.slice(0, 500)}"${languageInstruction(language)}`,
          },
          {
            role: 'user',
            content: `Search results for "${query}":\n\n${resultsText}\n\nSynthesize a comprehensive answer.`,
          },
        ],
        chatOpts,
      );
      const tierBSources = results.map(r => ({ title: r.title, url: r.url }));
      const body = synthesis + '\n\n## Sources\n' + tierBSources.map((s, i) => `[${i + 1}] [${s.title}](${s.url})`).join('\n');
      return { body, tier: 'B', sources: tierBSources, query };
    }
    // No results — fall through to Tier C
  } catch (err) {
    console.warn('[search] Tier B (scrape) failed, falling back to Tier C:', err);
    // Fall through to Tier C
  }

  // ---- Tier C: Knowledge-only (always works) ----
  const knowledgePrompt = buildKnowledgeOnlyPrompt(searchSettings) + languageInstruction(language);
  const body = await chat(
    [
      { role: 'system', content: knowledgePrompt },
      { role: 'user', content: selectedText },
    ],
    chatOpts,
  );
  const tierCQuery = deriveSearchQuery(selectedText);
  return { body, tier: 'C', sources: [], query: tierCQuery };
}

/**
 * Re-probe tool calling capability. Returns the updated capability.
 * The caller should persist this to settings.
 */
export async function refreshCapability(
  chatOpts: ChatOpts,
): Promise<WebSearchCapability> {
  return probeToolCalling(chatOpts);
}

/**
 * The knowledge-only prompt (Tier C) — same as the original search prompt.
 */
function buildKnowledgeOnlyPrompt(search?: SearchSettings): string {
  const depth = search?.searchDepth || 'top 3 most relevant results';

  if (search?.searchPrompt?.trim()) {
    return search.searchPrompt.trim();
  }

  return `You are a research assistant with broad knowledge. When given selected text from a webpage, you:
1. Derive the best web search query to find more information on this topic.
2. Synthesize an answer from your knowledge — what would a thorough search reveal? Aim for ${depth}.
3. Note any limitations (your knowledge cutoff, areas where live search would help).

IMPORTANT: Do NOT fabricate or cite sources, URLs, or references. You are answering from training knowledge only — do not invent links or pretend you searched the web.

Format as:

## Search Query
\`...\`

## Synthesized Answer
...

## Caveats
...`;
}
