import Dexie, { Table } from 'dexie';
import type { Card, NewCard } from './types';

class WeeWooDB extends Dexie {
  cards!: Table<Card, string>;

  constructor() {
    super('weewoo');
    this.version(1).stores({ cards: 'id, type, createdAt, *tags' });
    this.version(2).stores({ cards: 'id, type, createdAt, *tags, folder' });
  }
}

const db = new WeeWooDB();

export async function addCard(input: NewCard): Promise<string> {
  const now = Date.now();
  const id = crypto.randomUUID();
  await db.cards.add({ ...input, id, createdAt: now, updatedAt: now });
  return id;
}

export const getCard = (id: string) => db.cards.get(id);

export const updateCard = (id: string, patch: Partial<Card>) =>
  db.cards.update(id, { ...patch, updatedAt: Date.now() });

export const deleteCard = (id: string) => db.cards.delete(id);

export const listCards = (type?: Card['type']) =>
  type
    ? db.cards.where('type').equals(type).reverse().sortBy('createdAt')
    : db.cards.orderBy('createdAt').reverse().toArray();

export async function searchCards(q: string): Promise<Card[]> {
  const needle = q.toLowerCase();
  const all = await db.cards.toArray();
  return all.filter(
    (c) =>
      c.title.toLowerCase().includes(needle) ||
      c.body.toLowerCase().includes(needle) ||
      c.tags.some((t) => t.toLowerCase().includes(needle)) ||
      c.sourceTitle.toLowerCase().includes(needle),
  );
}

/** Export all cards as a JSON-serializable array. */
export async function exportAllCards(): Promise<Card[]> {
  return db.cards.orderBy('createdAt').toArray();
}

/** Group card counts by source domain for the "By Source" view. */
export async function listCardsBySource(): Promise<Record<string, Card[]>> {
  const all = await db.cards.orderBy('createdAt').reverse().toArray();
  const groups: Record<string, Card[]> = {};
  for (const card of all) {
    let source: string;
    try {
      const u = new URL(card.sourceUrl);
      source = u.hostname || 'Unknown Source';
    } catch {
      source = card.sourceUrl || 'Unknown Source';
    }
    (groups[source] ??= []).push(card);
  }
  return groups;
}

/** Return all distinct folder names (excluding empty/undefined). */
export async function listFolders(): Promise<string[]> {
  const all = await db.cards.orderBy('folder').toArray();
  const seen = new Set<string>();
  for (const c of all) {
    const f = c.folder || 'no_folder';
    seen.add(f);
  }
  return [...seen].sort();
}

/** Return cards in a specific folder, newest first. */
export async function listCardsByFolder(folder: string): Promise<Card[]> {
  const all = await db.cards.orderBy('createdAt').reverse().toArray();
  return all.filter((c) => (c.folder || 'no_folder') === folder);
}

/** Export only cards from a specific folder. */
export async function exportCardsByFolder(folder: string): Promise<Card[]> {
  return listCardsByFolder(folder);
}

/** Import cards from a JSON array. Skips cards whose IDs already exist. Returns count of newly imported cards. */
export async function importCards(cards: Card[]): Promise<number> {
  if (!Array.isArray(cards)) throw new Error('Invalid import format: expected an array');
  let imported = 0;
  await db.transaction('rw', db.cards, async () => {
    for (const card of cards) {
      const exists = await db.cards.get(card.id);
      if (!exists) {
        // Backward-compat: imported cards without folder get 'no_folder'
        await db.cards.add({
          ...card,
          folder: card.folder || 'no_folder',
        });
        imported++;
      }
    }
  });
  return imported;
}

/** Return all unique tags across all cards, sorted alphabetically. */
export async function getAllTags(): Promise<string[]> {
  const all = await db.cards.toArray();
  const seen = new Set<string>();
  for (const c of all) {
    for (const t of c.tags) {
      seen.add(t.toLowerCase());
    }
  }
  return [...seen].sort();
}
