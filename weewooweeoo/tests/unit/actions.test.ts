import { buildPrompt } from '../../src/lib/actions/registry';
import '../../src/lib/actions/explain';
import '../../src/lib/actions/summary';
import '../../src/lib/actions/search';
import '../../src/lib/actions/task';

test('summary prompt includes selection text', () => {
  const msgs = buildPrompt('summary', 'The quick brown fox');
  expect(JSON.stringify(msgs)).toContain('The quick brown fox');
  expect(msgs[0].role).toBe('system');
});

test('explain prompt includes selection text', () => {
  const msgs = buildPrompt('explain', 'Quantum entanglement');
  expect(JSON.stringify(msgs)).toContain('Quantum entanglement');
  expect(msgs[0].role).toBe('system');
});

test('search prompt asks for search query', () => {
  const msgs = buildPrompt('search', 'best Rust web frameworks');
  expect(msgs[0].role).toBe('system');
  expect(JSON.stringify(msgs)).toContain('best Rust web frameworks');
});

test('task prompt asks for structured task', () => {
  const msgs = buildPrompt('task', 'We need to add rate limiting');
  expect(msgs[0].role).toBe('system');
  expect(JSON.stringify(msgs)).toContain('We need to add rate limiting');
});

test('unknown action id throws', () => {
  expect(() => buildPrompt('nonexistent' as any, 'text')).toThrow(
    'Unknown action',
  );
});
