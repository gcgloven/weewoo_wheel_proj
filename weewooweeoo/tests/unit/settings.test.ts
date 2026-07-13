import { getSettings, saveSettings } from '@/lib/settings';

test('defaults then override', async () => {
  const d = await getSettings();
  expect(d.slots).toEqual(['explain', 'summary', 'search']);
  await saveSettings({ model: 'gpt-4o-mini' });
  expect((await getSettings()).model).toBe('gpt-4o-mini');
});
