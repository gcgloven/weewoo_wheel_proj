import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardList } from '../../entrypoints/sidepanel/App';
import { DARK } from '../../src/lib/theme';

test('renders cards grouped by date', () => {
  const now = Date.now();
  const yesterday = now - 86400000;

  render(
    <CardList
      theme={DARK}
      language="en"
      cards={[
        {
          id: '1',
          type: 'task' as const,
          title: 'Do X',
          body: 'Task body',
          tags: ['todo'],
          folder: 'no_folder',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Example Page',
          originalText: 'do this',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          type: 'knowledge' as const,
          title: 'RAG Basics',
          body: 'Retrieval augmented generation',
          tags: ['ai'],
          folder: 'no_folder',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Example Page',
          originalText: 'RAG',
          createdAt: yesterday,
          updatedAt: yesterday,
        },
      ]}
    />,
  );

  expect(screen.getByText('Do X')).toBeInTheDocument();
  expect(screen.getByText('RAG Basics')).toBeInTheDocument();
});
