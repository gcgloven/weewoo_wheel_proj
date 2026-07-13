/**
 * Browser-side web scraping via DuckDuckGo HTML endpoint.
 * No API key required. Runs entirely in the service worker via fetch().
 *
 * Used by:
 * - Tier A: to execute the LLM-generated search query
 * - Tier B: standalone scraping when tool calling not available
 */

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Search DuckDuckGo HTML and return top results.
 * Returns up to `count` results (default 5).
 */
export async function scrapeSearch(
  query: string,
  count = 5,
): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  const res = await fetch(url, {
    headers: new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    }),
  });

  if (!res.ok) {
    throw new Error(`Search request failed: ${res.status}`);
  }

  const html = await res.text();
  return parseDuckDuckGoHtml(html, count);
}

/**
 * Parse DuckDuckGo HTML results page.
 * Extracts title, snippet, and URL from result blocks.
 */
function parseDuckDuckGoHtml(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  // DuckDuckGo HTML results are in <a class="result__a"> for title+url
  // and <a class="result__snippet"> for snippet text
  const resultBlockRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = resultBlockRegex.exec(html)) !== null && results.length < maxResults) {
    const rawUrl = match[1];
    const rawTitle = match[2].replace(/<[^>]*>/g, '').trim();
    const rawSnippet = match[3].replace(/<[^>]*>/g, '').trim();

    if (rawTitle && rawUrl) {
      results.push({
        title: decodeHtmlEntities(rawTitle),
        snippet: decodeHtmlEntities(rawSnippet),
        url: resolveDdgUrl(decodeHtmlEntities(rawUrl)),
      });
    }
  }

  // Fallback: simpler regex if the main one didn't match (DDG sometimes changes markup)
  if (results.length === 0) {
    const simpleRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = simpleRegex.exec(html)) !== null && results.length < maxResults) {
      const rawUrl = match[1];
      const rawTitle = match[2].replace(/<[^>]*>/g, '').trim();
      if (rawTitle && rawUrl) {
        results.push({
          title: decodeHtmlEntities(rawTitle),
          snippet: '',
          url: resolveDdgUrl(decodeHtmlEntities(rawUrl)),
        });
      }
    }
  }

  return results;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

/**
 * Resolve a DuckDuckGo redirect URL to the real destination.
 * DDG HTML results wrap real URLs in redirect links like:
 *   //duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com&rut=...
 * This extracts and decodes the `uddg` parameter.
 */
function resolveDdgUrl(raw: string): string {
  let url = raw.replace(/^chrome-extension:\/\//, 'https://');
  if (url.startsWith('//')) url = 'https:' + url;
  try {
    const parsed = new URL(url);
    const uddg = parsed.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);
    return raw;
  } catch {
    return raw;
  }
}

/**
 * Derive a search query from selected text when Tier B needs to run without
 * LLM-generated queries (simple keyword extraction).
 */
export function deriveSearchQuery(selectedText: string): string {
  // Take the first sentence (up to ~200 chars) as the search query
  const firstSentence = selectedText.split(/[.!?]\s+/)[0];
  return firstSentence.slice(0, 200).trim() || selectedText.slice(0, 200).trim();
}
