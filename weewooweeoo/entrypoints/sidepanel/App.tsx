import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  listCards,
  searchCards,
  deleteCard,
  exportAllCards,
  importCards,
  listCardsBySource,
  exportCardsByFolder,
  getAllTags,
  updateCard,
} from '../../src/lib/db';
import { renderMarkdown } from '../../src/lib/markdown';
import type { Card } from '../../src/lib/types';
import { getSettings } from '../../src/lib/settings';
import { t as tokens, type ThemeTokens } from '../../src/lib/theme';
import { t, type Language } from '../../src/lib/i18n';

// ── helpers ──────────────────────────────────────────────────────

function fmtDate(ts: number, lang: Language): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);

  if (d.toDateString() === today.toDateString()) return t('sidepanel.today', lang);
  if (d.toDateString() === yesterday.toDateString()) return t('sidepanel.yesterday', lang);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function groupByDate(cards: Card[], lang: Language): Record<string, Card[]> {
  const groups: Record<string, Card[]> = {};
  for (const c of cards) {
    const label = fmtDate(c.createdAt, lang);
    (groups[label] ??= []).push(c);
  }
  return groups;
}

function groupByHour(cards: Card[], lang: Language): Record<string, Card[]> {
  const now = Date.now();
  const hourAgo = now - 3600000;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - 86400000;

  const groups: Record<string, Card[]> = {
    [t('sidepanel.today', lang)]: [],
    [t('sidepanel.yesterday', lang)]: [],
    ['Older']: [],
  };
  // Insert "Past Hour" at the top
  const hourLabel = t('sidepanel.pastHour', lang) || 'Past Hour';
  const ordered: Record<string, Card[]> = { [hourLabel]: [] };
  Object.assign(ordered, groups);

  for (const c of cards) {
    if (c.createdAt >= hourAgo) {
      (ordered[hourLabel] ??= []).push(c);
    } else if (c.createdAt >= todayStart) {
      (ordered[t('sidepanel.today', lang)] ??= []).push(c);
    } else if (c.createdAt >= yesterdayStart) {
      (ordered[t('sidepanel.yesterday', lang)] ??= []).push(c);
    } else {
      (ordered['Older'] ??= []).push(c);
    }
  }
  // Remove empty groups
  return Object.fromEntries(
    Object.entries(ordered).filter(([, cards]) => cards.length > 0),
  );
}

function groupBySource(cards: Card[]): Record<string, Card[]> {
  const groups: Record<string, Card[]> = {};
  for (const c of cards) {
    let source: string;
    try {
      source = new URL(c.sourceUrl).hostname;
    } catch {
      source = c.sourceUrl || 'Unknown Source';
    }
    if (!source) source = 'Unknown Source';
    (groups[source] ??= []).push(c);
  }
  return groups;
}

function groupByFolder(cards: Card[], knownFolders: string[]): Record<string, Card[]> {
  const groups: Record<string, Card[]> = {};
  // Seed with known folders (even empty ones) so they're visible
  for (const f of knownFolders) {
    groups[f] = [];
  }
  for (const c of cards) {
    const f = c.folder || 'no_folder';
    (groups[f] ??= []).push(c);
  }
  // Sort: no_folder first, then alphabetical
  const ordered: Record<string, Card[]> = {};
  const keys = Object.keys(groups).sort((a, b) => {
    if (a === 'no_folder') return -1;
    if (b === 'no_folder') return 1;
    return a.localeCompare(b);
  });
  for (const k of keys) ordered[k] = groups[k];
  return ordered;
}

// ── CardList (exported for testing) ──────────────────────────────

export function CardList({ cards, groupMode = 'date', theme: tk, language: lang, onMoveCard, onExportFolder, knownFolders }: { cards: Card[]; groupMode?: 'date' | 'source' | 'hour' | 'folder'; theme: ThemeTokens; language: Language; onMoveCard?: (cardId: string, folder: string) => void; onExportFolder?: (folder: string) => void; knownFolders?: string[] }) {
  const groups = useMemo(
    () => groupMode === 'source' ? groupBySource(cards) : groupMode === 'hour' ? groupByHour(cards, lang) : groupMode === 'folder' ? groupByFolder(cards, knownFolders ?? []) : groupByDate(cards, lang),
    [cards, groupMode, lang, knownFolders],
  );
  const labels = Object.keys(groups);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const lastDropTime = useRef(0);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const toggleCollapse = (label: string) => {
    // Click fires after drop — skip if a drop just happened (within 300ms)
    if (Date.now() - lastDropTime.current < 300) return;
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const collapseAll = () => { setCollapsed(new Set(labels)); };

  const handleCardDragStart = () => {};
  const handleCardDragEnd = () => { lastDropTime.current = Date.now(); setDragOverFolder(null); };

  const handleDragOver = (e: React.DragEvent, folder: string) => {
    e.preventDefault();
    setDragOverFolder(folder);
  };
  const handleDragLeave = () => { setDragOverFolder(null); };
  const handleDrop = (folder: string) => (e: React.DragEvent) => {
    e.preventDefault();
    lastDropTime.current = Date.now();
    setDragOverFolder(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId && onMoveCard) onMoveCard(cardId, folder);
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {labels.length === 0 && (
        <p style={{ color: tk.textMuted, fontSize: 13, textAlign: 'center', marginTop: 40 }}>
          {t('sidepanel.noCards', lang)}
        </p>
      )}
      {/* Collapse all button — available for all group views */}
      {labels.length > 0 && (
        <div style={{ padding: '0 12px 6px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); collapseAll(); }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: tk.textMuted,
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 10px',
            }}
          >
            ▼ Collapse all
          </button>
        </div>
      )}
      {labels.map((label) => (
        <div key={label} style={{ marginBottom: 16 }}>
          <div
            onDragOver={(e) => handleDragOver(e, label)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(label)}
            onClick={() => toggleCollapse(label)}
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: tk.textMuted,
              padding: '4px 12px',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              userSelect: 'none',
              background: dragOverFolder === label ? 'rgba(100,140,255,0.15)' : 'transparent',
              borderRadius: 4,
              outline: dragOverFolder === label ? '1px dashed rgba(100,140,255,0.4)' : 'none',
            }}
          >
            <span style={{ fontSize: 10, width: 14, flexShrink: 0 }}>{collapsed.has(label) ? '▶' : '▼'}</span>
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ fontSize: 10, color: tk.textMuted, fontWeight: 400 }}>
              ({groups[label].length})
            </span>
            {groupMode === 'folder' && onExportFolder && (
              <button
                onClick={(e) => { e.stopPropagation(); onExportFolder(label); }}
                title="Export this folder"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tk.textMuted,
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 3,
                }}
              >
                📤
              </button>
            )}
          </div>
          {!collapsed.has(label) && groups[label].map((card) => (
            <CardRow key={card.id} card={card} theme={tk} language={lang} draggable={groupMode === 'folder'} onDragStart={handleCardDragStart} onDragEnd={handleCardDragEnd} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── CardRow ──────────────────────────────────────────────────────

/** Detect placeholder cards that are still being generated by the LLM.
 *  Loading cards have animated emoji-prefixed titles like "💡 Explaining…" or "🔍 Agent is searching..." */
function isLoadingCard(card: Card): boolean {
  // Match any emoji-prefixed loading card (explain/summary/search/task)
  const loadingEmojis = ['💡', '📝', '🔍', '✅', '⚡'];
  if (loadingEmojis.some(e => card.title.startsWith(e))) {
    // Quick check: if the title is a known loading message or very short
    if (card.title.length < 50) return true;
    // Or contains loading keywords
    if (/searching|Explaining|Summarizing|Planning|Processing|Agent is|Fishing|Hunting|Potty|Flowing|Caffeinating|Asking|Wee-wooing|Tickling|Negotiating/i.test(card.title)) return true;
  }
  // Match error placeholder cards too
  if (card.title.startsWith('❌')) return true;
  return false;
}

function CardRow({ card, theme: tk, language: lang, draggable, onDragStart, onDragEnd }: { card: Card; theme: ThemeTokens; language: Language; draggable?: boolean; onDragStart?: () => void; onDragEnd?: () => void; }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editBody, setEditBody] = useState(card.body);
  const [editTagsStr, setEditTagsStr] = useState(card.tags.join(', '));
  const loading = isLoadingCard(card);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(card.title);
    setEditBody(card.body);
    setEditTagsStr(card.tags.join(', '));
    setIsEditing(true);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const saveEditing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const tags = editTagsStr
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    await updateCard(card.id, {
      title: editTitle.trim() || 'Untitled',
      body: editBody,
      tags,
      updatedAt: Date.now(),
    });
    setIsEditing(false);
    window.dispatchEvent(new Event('weewoo-cards-changed'));
  };

  const getBadgeColor = (): string => {
    if (card.type === 'search') return '#8a4ad9';  // purple
    if (card.type === 'task') return '#d98a4a';    // orange
    // knowledge: distinguish explain vs summary from body content
    if (card.body.includes('## Simple Explanation')) return '#7b5ea7'; // explain = purple
    if (card.body.includes('## Summary')) return '#4a90d9';            // summary = blue
    return '#5a7fb5'; // fallback knowledge = teal-blue
  };

  const typeLabel = (): string => {
    if (card.type === 'search') return t('type.search', lang);
    if (card.type === 'task') return t('type.task', lang);
    if (card.body.includes('## Simple Explanation')) return 'Explain';
    if (card.body.includes('## Summary')) return 'Summary';
    return t('type.knowledge', lang);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={draggable}
      onDragStart={draggable ? (e) => { e.dataTransfer.setData('text/plain', card.id); onDragStart?.(); } : undefined}
      onDragEnd={onDragEnd}
      style={{
        background: hovered ? tk.surfaceHover : tk.surface,
        borderRadius: tk.radius,
        margin: '0 8px 6px',
        border: `1px solid ${hovered ? 'rgba(122,175,255,0.15)' : tk.border}`,
        overflow: 'hidden',
        transition: 'background 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: hovered ? `0 0 0 1px rgba(122,175,255,0.1), ${tk.shadow}` : 'none',
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: loading ? 'transparent' : getBadgeColor(),
            border: loading ? `2px solid ${getBadgeColor()}` : 'none',
            borderTopColor: loading ? 'transparent' : undefined,
            flexShrink: 0,
            animation: loading ? 'weewoo-card-spin 0.8s linear infinite' : undefined,
          }}
        />
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: tk.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {card.title || t('sidepanel.untitled', lang)}
        </span>
        <span
          style={{
            fontSize: 10,
            color: tk.textMuted,
            flexShrink: 0,
          }}
        >
          {typeLabel()}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{
          padding: '0 12px 10px',
          animation: 'weewoo-expand 200ms ease-out',
          maxHeight: isEditing ? 600 : 400,
          overflow: 'hidden',
        }}>
          {isEditing ? (
            <>
              <input
                aria-label="Edit title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={editInputStyle(tk)}
                placeholder="Title"
              />
              <textarea
                aria-label="Edit body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={8}
                style={{ ...editInputStyle(tk), resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Body (Markdown)"
              />
              <input
                aria-label="Edit tags (comma-separated)"
                value={editTagsStr}
                onChange={(e) => setEditTagsStr(e.target.value)}
                style={editInputStyle(tk)}
                placeholder="Tags: tag1, tag2, tag3"
              />
              {/* Source (read-only) */}
              <div style={{ fontSize: 10, color: tk.textMuted, marginBottom: 8 }}>
                🔗 {card.sourceTitle || 'Unknown source'}
                {card.sourceUrl && <span> · {card.sourceUrl}</span>}
              </div>
              <div style={{ fontSize: 9, color: tk.textMuted, marginBottom: 8 }}>
                Created: {new Date(card.createdAt).toLocaleString()} ·
                Updated: {new Date(card.updatedAt).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={saveEditing} style={{ ...tinyBtn(tk), background: '#2a5a2a', color: '#8f8', border: '1px solid #3a7a3a' }}>Save</button>
                <button onClick={cancelEditing} style={tinyBtn(tk)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div
                className="weewoo-card-body"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(card.body.slice(0, 2000)),
                }}
                style={{
                  fontSize: 12,
                  color: tk.textSecondary,
                  lineHeight: 1.6,
                  marginBottom: 8,
                  maxHeight: 300,
                  overflowY: 'auto',
                }}
              />

              {/* Tags */}
              {card.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {card.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10,
                        background: tk.accentBg,
                        color: tk.textMuted,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Source */}
              <div style={{ fontSize: 10, color: tk.textMuted, marginBottom: 8 }}>
                {card.sourceTitle}
                {card.sourceUrl && (
                  <>
                    {' · '}
                    <a
                      href={card.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#4a90d9' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('sidepanel.open', lang)}
                    </a>
                  </>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await navigator.clipboard.writeText(card.body);
                  }}
                  style={tinyBtn(tk)}
                >
                  {t('sidepanel.copy', lang)}
                </button>
                 <button onClick={startEditing} style={tinyBtn(tk)}>
                  Edit
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await deleteCard(card.id);
                    window.dispatchEvent(new Event('weewoo-cards-changed'));
                  }}
                  style={{ ...tinyBtn(tk), color: tk.danger }}
                >
                  {t('sidepanel.delete', lang)}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function tinyBtn(tk: ThemeTokens): React.CSSProperties {
  return {
    background: tk.accentBg,
    color: tk.textSecondary,
    border: `1px solid ${tk.border}`,
    borderRadius: 4,
    padding: '3px 10px',
    cursor: 'pointer',
    fontSize: 11,
  };
}

function editInputStyle(tk: ThemeTokens): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    background: tk.bg,
    color: tk.text,
    border: `1px solid ${tk.border}`,
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 12,
    marginBottom: 6,
  };
}

// ── App ──────────────────────────────────────────────────────────

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [groupMode, setGroupMode] = useState<'date' | 'source' | 'hour' | 'folder'>('date');
  const [newFolderName, setNewFolderName] = useState('');
  const [knownFolders, setKnownFolders] = useState<string[]>(['no_folder']);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [wheelSkin, setWheelSkin] = useState('emoji');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load theme + language when sidepanel opens
  useEffect(() => {
    getSettings().then((s) => {
      setTheme(s.theme ?? 'dark');
      setLanguage(s.language ?? 'en');
      setWheelSkin(s.wheelSkin ?? 'doodle');
    });

    // Listen for settings changes so theme/language update immediately
    const settingsListener = (changes: Record<string, chrome.storage.StorageChange>) => {
      const settingsChange = changes['settings'];
      if (!settingsChange?.newValue) return;
      const s = settingsChange.newValue as any;
      if (s.theme) setTheme(s.theme as 'dark' | 'light');
      if (s.language) setLanguage(s.language as Language);
      if (s.wheelSkin) setWheelSkin(s.wheelSkin);
    };
    chrome.storage.onChanged.addListener(settingsListener);
    return () => {
      chrome.storage.onChanged.removeListener(settingsListener);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = async () => {
    try {
      const all = await exportAllCards();
      if (all.length === 0) {
        showToast(t('sidepanel.noCardsToExport', language));
        return;
      }
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weewoo-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const cardWord = all.length === 1 ? t('sidepanel.newCard', language) : t('sidepanel.newCards', language);
      showToast(`${t('sidepanel.exportedToast', language)} ${all.length} ${cardWord}.`);
    } catch (err: any) {
      showToast(t('sidepanel.exportFailed', language) + err.message);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const count = await importCards(data);
      const cardWord = count === 1 ? t('sidepanel.newCard', language) : t('sidepanel.newCards', language);
      const skipped = data.length - count;
      showToast(`${t('sidepanel.importedToast', language)} ${count} ${cardWord} (${skipped} ${t('sidepanel.skippedDup', language)}).`);
      window.dispatchEvent(new Event('weewoo-cards-changed'));
    } catch (err: any) {
      showToast(t('sidepanel.importFailed', language) + err.message);
    }
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMoveCard = async (cardId: string, folder: string) => {
    await updateCard(cardId, { folder });
    showToast(`Moved to "${folder}"`);
    window.dispatchEvent(new Event('weewoo-cards-changed'));
  };

  const handleExportFolder = async (folder: string) => {
    try {
      const cards = await exportCardsByFolder(folder);
      if (cards.length === 0) {
        showToast(t('sidepanel.noCardsToExport', language));
        return;
      }
      const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weewoo-${folder}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${cards.length} card(s) from "${folder}".`);
    } catch (err: any) {
      showToast(t('sidepanel.exportFailed', language) + err.message);
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setNewFolderName('');
    setKnownFolders((prev) => prev.includes(name) ? prev : [...prev, name]);
    showToast(`Folder "${name}" created. Move cards into it via drag & drop.`);
  };

  const load = async (searchQ?: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      let results: Card[];
      if (searchQ) {
        // Parse #tag patterns for exact tag matching
        const tagMatches = searchQ.match(/#([^\s#]+)/g);
        const hashtags = tagMatches ? tagMatches.map((t) => t.slice(1).toLowerCase()) : [];
        // Remaining text after stripping #tags = keyword search
        const keywordText = searchQ.replace(/#[^\s#]+/g, '').trim();

        if (hashtags.length > 0 && !keywordText) {
          // Pure tag search: filter by exact tag match (any of the specified tags)
          const all = await listCards();
          results = all.filter((c) =>
            hashtags.some((ht) => c.tags.some((t) => t.toLowerCase() === ht)),
          );
        } else if (hashtags.length > 0 && keywordText) {
          // Combined: keyword search + narrow by tags
          const keywordResults = await searchCards(keywordText);
          results = keywordResults.filter((c) =>
            hashtags.some((ht) => c.tags.some((t) => t.toLowerCase() === ht)),
          );
        } else {
          // Pure keyword search (existing behavior)
          results = await searchCards(searchQ);
        }
      } else {
        results = await listCards();
      }
      setCards(
        typeFilter === 'all'
          ? results
          : results.filter((c) => c.type === typeFilter),
      );
    } catch {
      setCards([]);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    load(query || undefined);
    // Silent refreshes: don't flip `loading` (which would unmount CardList and
    // reset its collapsed-folder state). Keeps folder collapse state after drag-drop.
    const onChanged = () => load(query || undefined, true);
    window.addEventListener('weewoo-cards-changed', onChanged);
    // Listen for background notifications when search updates a card
    const msgListener = (message: any) => {
      if (message?.kind === 'CARDS_UPDATED') {
        load(query || undefined, true);
      }
    };
    chrome.runtime.onMessage.addListener(msgListener);
    return () => {
      window.removeEventListener('weewoo-cards-changed', onChanged);
      chrome.runtime.onMessage.removeListener(msgListener);
    };
  }, [typeFilter]);

  const handleSearch = (value: string) => {
    setQuery(value);
    // Tag autocomplete: show suggestions when user types # followed by partial tag
    const hashIdx = value.lastIndexOf('#');
    if (hashIdx >= 0) {
      const partial = value.slice(hashIdx + 1).toLowerCase();
      if (partial.length >= 0) {
        const matches = allTags
          .filter((t) => t.startsWith(partial) && !value.includes('#' + t))
          .slice(0, 8);
        setTagSuggestions(matches);
        setShowTagSuggestions(matches.length > 0);
      } else {
        setShowTagSuggestions(false);
      }
    } else {
      setShowTagSuggestions(false);
    }
    load(value || undefined);
  };

  const handleTagSuggestionClick = (tag: string) => {
    // Replace the partial #tag with the completed one
    const hashIdx = query.lastIndexOf('#');
    const before = query.slice(0, hashIdx);
    const after = query.slice(hashIdx + 1).replace(/^\S*/, '');
    const newQuery = `${before}#${tag} ${after}`.trim();
    setQuery(newQuery);
    setShowTagSuggestions(false);
    load(newQuery || undefined);
    searchInputRef.current?.focus();
  };

  // Load all tags on mount + refresh on card changes
  useEffect(() => {
    getAllTags().then(setAllTags);
    const onChanged = () => getAllTags().then(setAllTags);
    window.addEventListener('weewoo-cards-changed', onChanged);
    return () => window.removeEventListener('weewoo-cards-changed', onChanged);
  }, []);

  const tk = tokens(theme === 'dark');

  /** Get toolbar icon URL, falling back to sidepanel SVG for non-emoji skins. */
  const toolbarIconUrl = (name: string) => chrome.runtime.getURL(`skins/sidepanel/icon-${name}.svg`);
  /** Invert SVG icons in dark mode so dark strokes become light. */
  const iconStyle = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: size,
    height: size,
    ...(theme === 'dark' ? { filter: 'brightness(0) invert(1)' } : {}),
    ...extra,
  });

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: tk.bg,
        color: tk.text,
        fontFamily: tk.fontFamily,
      }}
    >
      {/* Markdown card body styles */}
      <style>{`
        .weewoo-card-body h1, .weewoo-card-body h2, .weewoo-card-body h3,
        .weewoo-card-body h4, .weewoo-card-body h5, .weewoo-card-body h6 {
          margin: 8px 0 4px;
          color: ${tk.accent};
          font-weight: 600;
        }
        .weewoo-card-body h1 { font-size: 18px; }
        .weewoo-card-body h2 { font-size: 15px; }
        .weewoo-card-body h3 { font-size: 13px; }
        .weewoo-card-body p { margin: 4px 0; }
        .weewoo-card-body a { word-break: break-all; }
        .weewoo-card-body { overflow-wrap: anywhere; word-break: break-word; }
        .weewoo-card-body ul, .weewoo-card-body ol { margin: 4px 0; padding-left: 18px; }
        .weewoo-card-body li { margin: 2px 0; }
        .weewoo-card-body code {
          background: ${tk.accentBg};
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 11px;
          font-family: 'SF Mono', 'Fira Code', monospace;
          color: ${tk.text};
        }
        .weewoo-card-body pre {
          background: ${tk.bg};
          border: 1px solid ${tk.border};
          border-radius: 6px;
          padding: 8px 10px;
          overflow-x: auto;
          margin: 6px 0;
        }
        .weewoo-card-body pre code {
          background: none;
          padding: 0;
          font-size: 11px;
        }
        .weewoo-card-body blockquote {
          border-left: 3px solid ${tk.accent}66;
          margin: 6px 0;
          padding: 2px 0 2px 10px;
          color: ${tk.textSecondary};
        }
        .weewoo-card-body a {
          color: ${tk.accent};
          text-decoration: none;
        }
        @keyframes weewoo-expand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 400px; }
        }
        @keyframes weewoo-card-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
        :focus-visible {
          outline: 2px solid ${tk.accent} !important;
          outline-offset: 2px !important;
        }        }
        .weewoo-card-body a:hover { text-decoration: underline; }
        .weewoo-card-body hr {
          border: none;
          border-top: 1px solid ${tk.border};
          margin: 8px 0;
        }
        .weewoo-card-body strong { color: ${tk.text}; }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: '12px 12px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: '#b0c8ff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <img
              src={chrome.runtime.getURL('skins/icon-wheel.svg')}
              alt=""
              style={iconStyle(18)}
            />
            {t('sidepanel.title', language)}
          </h2>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              title="Export all cards as JSON"
              aria-label="Export cards"
              onClick={handleExport}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#888',
                cursor: 'pointer',
                fontSize: 14,
                minWidth: 36,
                minHeight: 36,
                padding: '6px 10px',
                lineHeight: 1,
              }}
            >
              <img src={toolbarIconUrl('export')} alt="Export" style={iconStyle(16, { opacity: 0.7 })} />
            </button>
            <button
              title="Import cards from JSON file"
              aria-label="Import cards"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#888',
                cursor: 'pointer',
                fontSize: 14,
                minWidth: 36,
                minHeight: 36,
                padding: '6px 10px',
                lineHeight: 1,
              }}
            >
              <img src={toolbarIconUrl('import')} alt="Import" style={iconStyle(16, { opacity: 0.7 })} />
            </button>
            <button
              title="Open Settings"
              aria-label="Open Settings"
              onClick={() => chrome.runtime.openOptionsPage()}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#888',
                cursor: 'pointer',
                fontSize: 14,
                minWidth: 36,
                minHeight: 36,
                padding: '6px 10px',
                lineHeight: 1,
              }}
            >
              <img src={toolbarIconUrl('settings')} alt="Settings" style={iconStyle(16, { opacity: 0.7 })} />
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          ref={searchInputRef}
          aria-label="Search cards"
          placeholder={t('sidepanel.search', language) + ' — use # for tag search'}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: tk.surface,
            color: tk.text,
            border: `1px solid ${tk.border}`,
            borderRadius: showTagSuggestions ? '6px 6px 0 0' : 6,
            padding: '6px 10px',
            fontSize: 13,
            marginBottom: showTagSuggestions ? 0 : 8,
          }}
        />

        {/* Tag autocomplete dropdown */}
        {showTagSuggestions && (
          <div style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            marginBottom: 8,
            maxHeight: 160,
            overflowY: 'auto',
          }}>
            {tagSuggestions.map((tag) => (
              <div
                key={tag}
                onClick={() => handleTagSuggestionClick(tag)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  color: tk.text,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${tk.border}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = tk.surfaceHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                #{tag}
              </div>
            ))}
          </div>
        )}

        {/* Type filter + Group mode */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {['all', 'knowledge', 'search', 'task'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                background:
                  typeFilter === type
                    ? 'rgba(100,140,255,0.15)'
                    : 'rgba(255,255,255,0.04)',
                color: typeFilter === type ? '#b0c8ff' : '#888',
                border:
                  typeFilter === type
                    ? '1px solid rgba(100,140,255,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {t('type.' + type, language)}
            </button>
          ))}
          <span style={{ color: '#444', fontSize: 11 }}>|</span>
          <select
            aria-label={t('sidepanel.groupBy', language)}
            value={groupMode}
            onChange={(e) => setGroupMode(e.target.value as 'date' | 'source' | 'hour' | 'folder')}
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: '#888',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6,
              padding: '3px 8px',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <option value="date">{t('sidepanel.byDate', language)}</option>
            <option value="source">{t('sidepanel.bySource', language)}</option>
            <option value="hour">{t('sidepanel.byHour', language)}</option>
            <option value="folder">📁 By Folder</option>
          </select>
        </div>

        {/* Folder creation (visible when folder mode is active) */}
        {groupMode === 'folder' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              aria-label="New folder name"
              placeholder="New folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
              style={{
                flex: 1,
                background: tk.surface,
                color: tk.text,
                border: `1px solid ${tk.border}`,
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
              }}
            />
            <button
              onClick={handleCreateFolder}
              style={{
                background: 'rgba(100,140,255,0.12)',
                color: '#b0c8ff',
                border: '1px solid rgba(100,140,255,0.2)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              + Create
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
        aria-label="Import cards JSON file"
      />

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            margin: '0 12px',
            padding: '6px 10px',
            fontSize: 12,
            color: '#b0c8ff',
            background: 'rgba(100,140,255,0.12)',
            borderRadius: 6,
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}

      {/* Card list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: 40 }}>
            {t('sidepanel.loading', language)}
          </p>
        ) : (
          <CardList cards={cards} groupMode={groupMode} theme={tk} language={language} onMoveCard={handleMoveCard} onExportFolder={handleExportFolder} knownFolders={knownFolders} />
        )}
      </div>
    </div>
  );
}
