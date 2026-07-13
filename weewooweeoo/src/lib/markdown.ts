/**
 * Lightweight Markdown → HTML renderer.
 * Handles the subset of Markdown commonly output by LLMs:
 * headings, bold/italic, code (inline + fenced), lists, links, blockquotes, rules.
 *
 * No dependencies. ~80 lines. Returns safe HTML string.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(text: string): string {
  // Split on inline code markers, process code/non-code segments separately
  const parts = text.split(/(`[^`]+`)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        // Inline code segment: `...`
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      }
      // Regular text: escape HTML first, then apply markdown
      let html = escapeHtml(part);

      // Bold + Italic: ***text***
      html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
      // Bold: **text**
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic: *text*
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

      // Links: [text](url) — text/url are already HTML-escaped by this point
      html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>',
      );

      return html;
    })
    .join('');
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';
  let inList: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (inList) {
      output.push(`</${inList}>`);
      inList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line.trim())) {
      if (!inCodeBlock) {
        flushList();
        codeLang = line.trim().slice(3).trim();
        inCodeBlock = true;
        codeContent = '';
        continue;
      } else {
        const escaped = escapeHtml(codeContent.trimEnd());
        const langAttr = codeLang ? ` data-lang="${escapeHtml(codeLang)}"` : '';
        output.push(`<pre${langAttr}><code>${escaped || ' '}</code></pre>`);
        inCodeBlock = false;
        codeLang = '';
        continue;
      }
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line;
      continue;
    }

    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushList();
      output.push('<hr/>');
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      output.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (/^>/.test(trimmed)) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      output.push(`<blockquote><p>${renderInline(quoteText)}</p></blockquote>`);
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (inList !== 'ul') {
        flushList();
        output.push('<ul>');
        inList = 'ul';
      }
      output.push(`<li>${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (olMatch) {
      if (inList !== 'ol') {
        flushList();
        output.push('<ol>');
        inList = 'ol';
      }
      output.push(`<li>${renderInline(olMatch[2])}</li>`);
      continue;
    }

    // Regular paragraph line
    flushList();
    // Group consecutive non-blank lines into a single paragraph
    let para = trimmed;
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,6}\s|```|>|[-*]\s|\d+\.\s|^(-{3,}|\*{3,})$)/.test(lines[i + 1].trim())) {
      i++;
      para += '\n' + lines[i].trim();
    }
    output.push(`<p>${renderInline(para)}</p>`);
  }

  flushList();

  // Unclosed code block
  if (inCodeBlock) {
    const escaped = escapeHtml(codeContent.trimEnd());
    output.push(`<pre><code>${escaped || ' '}</code></pre>`);
  }

  return output.join('\n');
}
