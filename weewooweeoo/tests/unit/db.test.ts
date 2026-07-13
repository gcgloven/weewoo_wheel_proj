import { addCard, getCard, searchCards, exportAllCards, importCards } from '@/lib/db';
import type { Card } from '@/lib/types';

test('addCard then searchCards by title', async () => {
  const id = await addCard({
    type: 'knowledge',
    title: 'RAG basics',
    body: 'Retrieval augmented generation',
    tags: ['ai'],
    folder: 'no_folder',
    sourceUrl: 'https://x',
    sourceTitle: 'X',
    originalText: 'RAG',
  });
  expect(id).toBeTruthy();
  const found = await searchCards('RAG');
  expect(found.map((c: Card) => c.id)).toContain(id);
});

test('getCard returns undefined for missing id', async () => {
  const card = await getCard('nonexistent');
  expect(card).toBeUndefined();
});

test('exportAllCards returns all cards sorted by createdAt', async () => {
  const id1 = await addCard({
    type: 'knowledge',
    title: 'Card A',
    body: 'First',
    tags: [],
    folder: 'no_folder',
    sourceUrl: '',
    sourceTitle: '',
    originalText: '',
  });
  const id2 = await addCard({
    type: 'task',
    title: 'Card B',
    body: 'Second',
    tags: [],
    folder: 'no_folder',
    sourceUrl: '',
    sourceTitle: '',
    originalText: '',
  });
  const exported = await exportAllCards();
  expect(exported.length).toBeGreaterThanOrEqual(2);
  const ids = exported.map((c: Card) => c.id);
  expect(ids).toContain(id1);
  expect(ids).toContain(id2);
  // Should be ordered by createdAt ascending
  const idx1 = ids.indexOf(id1);
  const idx2 = ids.indexOf(id2);
  expect(idx1).toBeLessThan(idx2);
});

test('importCards adds new cards and skips duplicates', async () => {
  const existingId = await addCard({
    type: 'knowledge',
    title: 'Existing',
    body: 'Already here',
    tags: [],
    folder: 'no_folder',
    sourceUrl: '',
    sourceTitle: '',
    originalText: '',
  });

  const newCards: Card[] = [
    {
      id: existingId, // duplicate — should be skipped
      type: 'knowledge',
      title: 'Existing Overwrite Attempt',
      body: 'Should not overwrite',
      tags: [],
      folder: 'no_folder',
      sourceUrl: '',
      sourceTitle: '',
      originalText: '',
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001', // new — should be imported
      type: 'task',
      title: 'New Imported Card',
      body: 'Fresh import',
      tags: ['imported'],
      folder: 'no_folder',
      sourceUrl: '',
      sourceTitle: '',
      originalText: '',
      createdAt: 2000,
      updatedAt: 2000,
    },
  ];

  const count = await importCards(newCards);
  expect(count).toBe(1);

  // Existing card should NOT have been overwritten
  const existing = await getCard(existingId);
  expect(existing?.title).toBe('Existing');

  // New card should exist
  const imported = await getCard('550e8400-e29b-41d4-a716-446655440001');
  expect(imported?.title).toBe('New Imported Card');
  expect(imported?.tags).toEqual(['imported']);
});

test('importCards rejects non-array input', async () => {
  await expect(importCards(null as any)).rejects.toThrow('Invalid import format');
  await expect(importCards('string' as any)).rejects.toThrow('Invalid import format');
  await expect(importCards({} as any)).rejects.toThrow('Invalid import format');
});
