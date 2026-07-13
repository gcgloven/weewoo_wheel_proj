/**
 * Generates context-aware task suggestions for the sidepanel.
 * Based on the active tab's URL and title — no LLM call needed.
 */
export interface TaskSuggestion {
  /** Display label for the suggestion chip. */
  label: string;
  /** Action to run when clicked. */
  actionId: 'explain' | 'summary' | 'search' | 'task';
  /** Pre-filled search/task text if applicable. */
  prefilledText?: string;
}

/**
 * Analyze the current page context and return 2-3 relevant suggestions.
 */
export function generateSuggestions(
  url: string,
  title: string,
): TaskSuggestion[] {
  const suggestions: TaskSuggestion[] = [];

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // GitHub issues / PRs
    if (hostname === 'github.com' && (url.includes('/issues/') || url.includes('/pull/'))) {
      suggestions.push({
        label: '🐛 Create task from this issue',
        actionId: 'task',
        prefilledText: title,
      });
      suggestions.push({
        label: '📝 Summarize this issue',
        actionId: 'summary',
        prefilledText: title,
      });
    }

    // GitHub repos
    else if (hostname === 'github.com') {
      suggestions.push({
        label: '📝 Summarize this repo',
        actionId: 'summary',
      });
    }

    // Stack Overflow / Q&A sites
    else if (hostname.includes('stackoverflow') || hostname.includes('stackexchange')) {
      suggestions.push({
        label: '🔍 Search: solution for this question',
        actionId: 'search',
        prefilledText: title.replace(' - Stack Overflow', ''),
      });
    }

    // Documentation sites
    else if (hostname.includes('docs.') || hostname.includes('developer.') || hostname.includes('reference.')) {
      suggestions.push({
        label: '📝 Summarize this documentation',
        actionId: 'summary',
      });
      suggestions.push({
        label: '💡 Explain this concept',
        actionId: 'explain',
        prefilledText: title,
      });
    }

    // PDF detector
    else if (url.endsWith('.pdf')) {
      suggestions.push({
        label: '📄 PDF detected — right-click to use context menu',
        actionId: 'summary',
      });
    }

    // News / articles
    else if (hostname.includes('news.') || hostname.includes('blog.') || hostname.includes('medium.com') || hostname.includes('substack.com')) {
      suggestions.push({
        label: '📰 Summarize this article',
        actionId: 'summary',
      });
    }
  } catch {
    // Invalid URL — skip pattern matching
  }

  // Always add fallback suggestions if we have fewer than 2
  if (suggestions.length < 2) {
    if (!suggestions.some((s) => s.actionId === 'summary')) {
      suggestions.push({ label: '📝 Summarize this page', actionId: 'summary' });
    }
    if (!suggestions.some((s) => s.actionId === 'search')) {
      const keywords = title.slice(0, 60).replace(/[|•\-–—]/g, '').trim();
      suggestions.push({
        label: `🔍 Search: ${keywords || 'this topic'}`,
        actionId: 'search',
        prefilledText: keywords,
      });
    }
  }

  return suggestions.slice(0, 3);
}
