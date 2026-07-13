import { render, screen, fireEvent } from '@testing-library/react';
import { ResultPanel } from '../../entrypoints/content/ResultPanel';

test('edits body and saves card', () => {
  const onSave = jest.fn();
  render(
    <ResultPanel
      result={{
        ok: true,
        cardType: 'knowledge',
        title: 'Test Title',
        body: 'Test Body',
      }}
      source={{
        url: 'https://example.com',
        title: 'Example Page',
        originalText: 'selected text',
      }}
      onSave={onSave}
      onClose={() => {}}
    />,
  );

  fireEvent.change(screen.getByRole('textbox', { name: /body/i }), {
    target: { value: 'Edited body' },
  });
  fireEvent.click(screen.getByText(/save/i));

  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      body: 'Edited body',
      type: 'knowledge',
      sourceUrl: 'https://example.com',
    }),
  );
});
