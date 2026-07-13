import { chat } from '@/lib/provider';

test('posts to /chat/completions and returns content', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: 'hi' } }] }),
  }) as any;
  const out = await chat(
    [{ role: 'user', content: 'x' }],
    { baseUrl: 'https://api.test/v1', apiKey: 'k', model: 'm', maxTokens: 2048 },
  );
  expect(out).toBe('hi');
  expect((fetch as jest.Mock).mock.calls[0][0]).toBe(
    'https://api.test/v1/chat/completions',
  );
});

test('throws on missing API key', async () => {
  await expect(
    chat([{ role: 'user', content: 'x' }], {
      baseUrl: 'https://x',
      apiKey: '',
      model: 'm',
      maxTokens: 2048,
    }),
  ).rejects.toThrow('Missing API key');
});
