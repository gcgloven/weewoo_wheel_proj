import type { CardType, NewCard } from './types';

export interface ActionRequest {
  kind: 'RUN_ACTION';
  actionId: string;
  selection: string;
  sourceUrl: string;
  sourceTitle: string;
}

export interface ActionResult {
  ok: boolean;
  cardType: CardType;
  title: string;
  body: string;
  error?: string;
  /** If true, the card was already saved by the background. Content script MUST skip SAVE_CARD. */
  saved?: boolean;
  /** Search tier (A=agentic, B=scrape, C=knowledge). Undefined for non-search actions. */
  searchTier?: 'A' | 'B' | 'C';
}

export interface SaveCardRequest {
  kind: 'SAVE_CARD';
  card: NewCard;
}
