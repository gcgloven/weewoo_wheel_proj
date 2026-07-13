import type { SearchSettings } from '../types';

export function buildSearchPrompt(search?: SearchSettings): string {
  const depth = search?.searchDepth || 'top 3 most relevant results';

  if (search?.searchPrompt?.trim()) {
    // User provided a fully custom system prompt
    return search.searchPrompt.trim();
  }

  return `You are a research assistant with broad knowledge. When given selected text from a webpage, you:
1. Derive the best web search query to find more information on this topic.
2. Synthesize an answer from your knowledge — what would a thorough search reveal? Aim for ${depth}.
3. Note any limitations (your knowledge cutoff, areas where live search would help).

Format as:

## Search Query
\`...\`

## Synthesized Answer
...

## Caveats
...`;
}
