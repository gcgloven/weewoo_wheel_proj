/**
 * Tier A: Agentic web search using LLM tool calling.
 *
 * Flow:
 * 1. Send selected text + system prompt + web_search tool definition to LLM
 * 2. LLM returns a tool_call with a search query
 * 3. Execute the search via DuckDuckGo scraping
 * 4. Feed results back to LLM for synthesis
 * 5. Return synthesized answer with citations
 */
import { chatWithTools, type ChatMessage, type ToolDef, type ChatOpts } from '../provider';
import { scrapeSearch, type SearchResult } from './scrape-search';
import type { SearchSettings } from '../types';
import type { Language } from '../i18n';
import { languageInstruction } from '../i18n';

const WEB_SEARCH_TOOL: ToolDef = {
  type: 'function',
  function: {
    name: 'web_search',
    description:
      'Search the web for current information. Returns top results with titles, snippets, and URLs.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to look up on the web.',
        },
      },
      required: ['query'],
    },
  },
};

/**
 * Format search results into a context string for the LLM.
 */
function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '(No search results found.)';
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Snippet: ${r.snippet || '(no snippet)'}`,
    )
    .join('\n\n');
}

/**
 * Execute the Tier A agentic search flow.
 * Returns the synthesized answer and the raw search results used.
 */
export async function agenticSearch(
  selectedText: string,
  searchSettings: SearchSettings | undefined,
  chatOpts: ChatOpts,
  language: Language = 'en',
): Promise<{ answer: string; sources: SearchResult[]; query: string }> {
  const depth = searchSettings?.searchDepth || 'top 5 most relevant results';

  // ---- Step 1: LLM generates search query via tool call ----
  const systemPrompt = buildAgenticSystemPrompt(searchSettings) + languageInstruction(language);

  const step1Messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: selectedText },
  ];

  const step1 = await chatWithTools(step1Messages, [WEB_SEARCH_TOOL], chatOpts);

  // Extract the search query from tool calls
  const searchCall = step1.toolCalls.find(
    (tc) => tc.function.name === 'web_search',
  );

  let query: string;
  if (searchCall) {
    try {
      const args = JSON.parse(searchCall.function.arguments);
      query = args.query || deriveQueryFromText(selectedText);
    } catch {
      query = deriveQueryFromText(selectedText);
    }
  } else {
    // LLM didn't call the tool — use a fallback query from the content
    query = deriveQueryFromText(selectedText);
  }

  // ---- Step 2: Execute the web search ----
  const searchResults = await scrapeSearch(query, 5);

  // ---- Step 3: Feed results back to LLM for synthesis ----
  const resultsFormatted = formatSearchResults(searchResults);

  // Build the conversation for step 2: include the assistant's tool_call and our tool response
  const step2Messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: selectedText },
  ];

  // If the LLM made a tool call, include it + our response
  if (step1.toolCalls.length > 0) {
    step2Messages.push({
      role: 'assistant',
      content: step1.content || '',
      tool_calls: step1.toolCalls,
    });
    for (const tc of step1.toolCalls) {
      step2Messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content:
          tc.function.name === 'web_search'
            ? resultsFormatted
            : '(Tool not supported)',
      });
    }
  } else {
    // No tool call — just inject the search results directly
    step2Messages.push({
      role: 'user',
      content: `Search results for "${query}":\n\n${resultsFormatted}\n\nPlease synthesize an answer based on these results and the original text.`,
    });
  }

  step2Messages.push({
    role: 'user',
    content: `Synthesize a comprehensive answer based on the search results above. Aim for ${depth}. Include citations with [1], [2], etc. referencing the numbered results.`,
  });

  const step2 = await chatWithTools(step2Messages, [], {
    ...chatOpts,
    maxTokens: chatOpts.maxTokens || 2048,
  });

  return {
    answer: step2.content || '(No answer generated.)',
    sources: searchResults,
    query,
  };
}

/**
 * Build the system prompt for the agentic search flow.
 */
function buildAgenticSystemPrompt(search?: SearchSettings): string {
  if (search?.searchPrompt?.trim()) {
    // Ensure the custom prompt mentions the web_search tool
    if (!search.searchPrompt.includes('web_search')) {
      return `${search.searchPrompt.trim()}\n\nYou have access to a web_search tool. Use it to find current information before answering.`;
    }
    return search.searchPrompt.trim();
  }

  return `You are a research assistant with web search capability. When given selected text from a webpage:

1. Use the \`web_search\` tool to search for current, relevant information about the topic.
2. After receiving search results, synthesize a comprehensive answer.
3. Cite sources using [1], [2], etc. referencing the numbered search results.
4. If search results are insufficient, note what additional searches would help.

IMPORTANT: Always use the web_search tool before answering. Do not rely on training data alone.`;
}

/**
 * Fallback: derive a search query from the selected text when the LLM
 * doesn't produce a tool call.
 */
function deriveQueryFromText(text: string): string {
  const firstSentence = text.split(/[.!?]\s+/)[0];
  return firstSentence.slice(0, 200).trim() || text.slice(0, 200).trim();
}
