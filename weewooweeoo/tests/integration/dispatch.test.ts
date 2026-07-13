describe('dispatch', () => {
  let runAction: typeof import('../../src/lib/dispatch').runAction;

  beforeAll(async () => {
    // Import fresh before the describe block to get the real function
    const mod = await import('../../src/lib/dispatch');
    runAction = mod.runAction;
  });

  beforeEach(() => {
    jest.resetModules();
    (chrome.storage.local.get as jest.Mock).mockReset();
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      settings: {
        baseUrl: 'https://api.test/v1',
        apiKey: 'sk-test',
        model: 'test-model',
        slots: ['explain', 'summary', 'search'],
      },
    });
  });

  test('returns ok with cardType and body for summary', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Summary of the text' } }],
      }),
    }) as any;

    const r = await runAction({
      kind: 'RUN_ACTION',
      actionId: 'summary',
      selection: 'some selected text',
      sourceUrl: 'https://example.com',
      sourceTitle: 'Example Page',
    });

    expect(r.ok).toBe(true);
    expect(r.cardType).toBe('knowledge');
    expect(r.body).toBe('Summary of the text');
  });

  test('returns error for unknown action id', async () => {
    const r = await runAction({
      kind: 'RUN_ACTION',
      actionId: 'nonexistent' as any,
      selection: 'text',
      sourceUrl: 'https://example.com',
      sourceTitle: 'Example',
    });

    expect(r.ok).toBe(false);
    expect(r.error).toContain('Unknown action');
  });

  test('handles network failure gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;

    const r = await runAction({
      kind: 'RUN_ACTION',
      actionId: 'summary',
      selection: 'text',
      sourceUrl: 'https://example.com',
      sourceTitle: 'Example',
    });

    expect(r.ok).toBe(false);
    expect(r.error).toContain('Network error');
  });
});
