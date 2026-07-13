import { renderMarkdown } from '../../src/lib/markdown';

// ── Headings ──

test('renders h1–h6 headings', () => {
  const html = renderMarkdown('# Title\n## Section\n### Sub');
  expect(html).toContain('<h1>Title</h1>');
  expect(html).toContain('<h2>Section</h2>');
  expect(html).toContain('<h3>Sub</h3>');
});

// ── Bold / Italic ──

test('renders bold and italic', () => {
  const html = renderMarkdown('**bold** and *italic* and ***both***');
  expect(html).toContain('<strong>bold</strong>');
  expect(html).toContain('<em>italic</em>');
  expect(html).toContain('<strong><em>both</em></strong>');
});

// ── Inline code ──

test('renders inline code with HTML escaping', () => {
  const html = renderMarkdown('Use `const x = 1;` here');
  expect(html).toContain('<code>const x = 1;</code>');
  // Angle brackets inside code should be escaped
  const html2 = renderMarkdown('Type `<div>` carefully');
  expect(html2).toContain('<code>&lt;div&gt;</code>');
});

// ── Fenced code blocks ──

test('renders fenced code blocks', () => {
  const md = '```ts\nconst x = 1;\nconsole.log(x);\n```';
  const html = renderMarkdown(md);
  expect(html).toContain('<pre');
  expect(html).toContain('data-lang="ts"');
  expect(html).toContain('const x = 1;');
  expect(html).toContain('console.log(x);');
});

test('handles code block without language', () => {
  const md = '```\nplain text\n```';
  const html = renderMarkdown(md);
  expect(html).toContain('<pre><code>');
  expect(html).toContain('plain text');
  expect(html).not.toContain('data-lang');
});

// ── Lists ──

test('renders unordered lists', () => {
  const md = '- Item A\n- Item B\n* Item C';
  const html = renderMarkdown(md);
  expect(html).toContain('<ul>');
  expect(html).toContain('<li>Item A</li>');
  expect(html).toContain('<li>Item B</li>');
  expect(html).toContain('<li>Item C</li>');
  expect(html).toContain('</ul>');
});

test('renders ordered lists', () => {
  const md = '1. First\n2. Second\n3. Third';
  const html = renderMarkdown(md);
  expect(html).toContain('<ol>');
  expect(html).toContain('<li>First</li>');
  expect(html).toContain('<li>Second</li>');
  expect(html).toContain('</ol>');
});

// ── Links ──

test('renders links with target and rel attributes', () => {
  const html = renderMarkdown('See [docs](https://example.com) for more');
  expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener">docs</a>');
});

// ── Blockquotes ──

test('renders blockquotes', () => {
  const html = renderMarkdown('> This is a quote');
  expect(html).toContain('<blockquote>');
  expect(html).toContain('This is a quote');
  expect(html).toContain('</blockquote>');
});

// ── Horizontal rules ──

test('renders horizontal rules', () => {
  expect(renderMarkdown('---')).toContain('<hr/>');
  expect(renderMarkdown('***')).toContain('<hr/>');
  expect(renderMarkdown('----------')).toContain('<hr/>');
});

// ── Paragraphs ──

test('wraps plain text in paragraphs', () => {
  const html = renderMarkdown('Hello world');
  expect(html).toContain('<p>Hello world</p>');
});

test('joins consecutive lines into one paragraph', () => {
  const md = 'Line one\nLine two\nLine three';
  const html = renderMarkdown(md);
  // Three consecutive non-blank non-special lines → one paragraph
  expect(html).toMatch(/<p>Line one\nLine two\nLine three<\/p>/);
});

// ── Mixed content ──

test('handles real LLM-style markdown', () => {
  const md = `## Search Query
\`what is retrieval augmented generation\`

## Synthesized Answer
RAG combines **retrieval** and *generation*.

### Key Points
- Fetches relevant docs
- Grounds LLM in facts

> RAG is widely used in enterprise AI.

For more, see [OpenAI docs](https://platform.openai.com).

\`\`\`python
print("hello")
\`\`\``;

  const html = renderMarkdown(md);
  // Headings
  expect(html).toContain('<h2>Search Query</h2>');
  expect(html).toContain('<h2>Synthesized Answer</h2>');
  expect(html).toContain('<h3>Key Points</h3>');
  // Inline formatting
  expect(html).toContain('<strong>retrieval</strong>');
  expect(html).toContain('<em>generation</em>');
  // Code
  expect(html).toContain('<code>what is retrieval augmented generation</code>');
  expect(html).toContain('print(&quot;hello&quot;)');
  // List
  expect(html).toContain('<li>Fetches relevant docs</li>');
  expect(html).toContain('<li>Grounds LLM in facts</li>');
  // Blockquote
  expect(html).toContain('<blockquote>');
  // Link
  expect(html).toContain('href="https://platform.openai.com"');
});

// ── Edge cases ──

test('returns empty string for empty input', () => {
  expect(renderMarkdown('')).toBe('');
});

test('handles only whitespace', () => {
  expect(renderMarkdown('   \n  \n  ')).toBe('');
});

test('does not inject raw HTML from input', () => {
  const html = renderMarkdown('<script>alert(1)</script>');
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
});
