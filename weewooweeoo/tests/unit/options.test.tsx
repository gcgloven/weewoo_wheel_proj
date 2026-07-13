import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OptionsForm } from '../../entrypoints/options/App';

// Mock chrome.storage.local so settings load works without throwing
beforeAll(() => {
  (chrome.storage.local.get as jest.Mock).mockResolvedValue({
    settings: {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      maxTokens: 2048,
      slots: ['explain', 'summary', 'search'],
    },
  });
});

test('saves model change', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);

  render(
    <OptionsForm
      initial={{
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o-mini',
        maxTokens: 2048,
        presetId: '',
        slots: ['explain', 'summary', 'search'],
        search: { searchPrompt: '', searchDepth: 'top 3 most relevant results' },
        searchMode: 'knowledge' as const,
        webSearchCapability: null,
        language: 'en' as const,
        theme: 'dark' as const,
        wheelSkin: 'doodle' as const,
        wheelTrigger: 'highlight' as const,
        promptTemplates: [],
        activePromptId: {},
      }}
      onSave={onSave}
    />,
  );

  const modelInput = screen.getByLabelText(/model/i);
  fireEvent.change(modelInput, { target: { value: 'gpt-4o' } });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o' }),
    );
  });
});
