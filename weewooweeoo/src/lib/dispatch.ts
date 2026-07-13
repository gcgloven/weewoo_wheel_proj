import { getSettings, saveSettings } from './settings';
import { chat } from './provider';
import { addCard, updateCard } from './db';
import { buildPrompt, REGISTRY } from './actions/registry';
import { runSearch, refreshCapability } from './search/index';
import type { ActionRequest, ActionResult } from './messages';
import type { NewCard, WebSearchCapability } from './types';

/**
 * Strip heading prefixes and formatting cruft from an extracted title line.
 * LLMs sometimes output "Title: ..." or "## Title\n..." even when told not to.
 */
function cleanTitle(raw: string): string {
  return raw
    .replace(/^#+\s*/g, '')            // markdown headings: ##, ###, etc.
    .replace(/^Title\s*:\s*/i, '')     // "Title: ..." prefix
    .replace(/^["'""'']|["'""'']$/g, '') // surrounding quotes
    .replace(/^\*\*|\*\*$/g, '')       // surrounding bold **
    .trim();
}

/**
 * Smart title extraction from LLM output.
 * - Short selection (≤80 chars): use the selection itself as title
 * - Search: uses the actual search query from orchestrator
 * - Others: first meaningful sentence from LLM response, capped at 100 chars
 */
function extractTitle(raw: string, actionId: string, searchQuery?: string, selectedText?: string): string {
  // If the user selected very short text, use it directly
  if (selectedText && selectedText.length <= 80) {
    return cleanTitle(selectedText.trim().slice(0, 120));
  }

  const lines = raw.split('\n');

  // ── First line: the prompt now puts the title on the very first line, no heading ──
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length > 3 && firstLine.length < 120 && !firstLine.startsWith('#')) {
    const cleaned = cleanTitle(firstLine);
    if (cleaned.length > 3) {
      // If it's too long (>12 words), it's content, not a title — trim it
      const words = cleaned.split(/\s+/);
      if (words.length > 12) {
        return words.slice(0, 10).join(' ') + '…';
      }
      return cleaned.slice(0, 100);
    }
  }

  // ── Try to extract from a dedicated ## Title section (legacy support) ──
  let inTitleSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s*Title/i.test(trimmed)) {
      inTitleSection = true;
      continue;
    }
    if (inTitleSection && trimmed.startsWith('##')) break;
    if (inTitleSection && trimmed.length > 3 && trimmed.length < 150) {
      return cleanTitle(trimmed).slice(0, 120);
    }
  }

  // Task prompt uses "## Task" heading for the title line
  let inTaskSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s*Task$/i.test(trimmed)) {
      inTaskSection = true;
      continue;
    }
    if (inTaskSection && trimmed.startsWith('##')) break;
    if (inTaskSection && trimmed.length > 3 && trimmed.length < 150) {
      return cleanTitle(trimmed).slice(0, 120);
    }
  }

  if (actionId === 'search') {
    // Best: use the actual search query that was executed
    if (searchQuery && searchQuery.length > 3) {
      return cleanTitle(searchQuery).slice(0, 120);
    }
    let inSearchSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^##\s*Search\s*Query/i.test(trimmed)) {
        inSearchSection = true;
        continue;
      }
      if (inSearchSection && trimmed.startsWith('##')) break;
      if (inSearchSection) {
        const match = trimmed.match(/`([^`]+)`/);
        if (match) return cleanTitle(match[1]).slice(0, 120);
        if (trimmed.length > 3) return cleanTitle(trimmed).slice(0, 120);
      }
    }
    for (const line of lines) {
      const cleaned = line.replace(/^#+\s*/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 150 && !cleaned.startsWith('[') && !cleaned.startsWith('*')) {
        return cleanTitle(cleaned).slice(0, 120);
      }
    }
  }

  // For explain/summary/task: extract first meaningful sentence (stop at . or ! or ?)
  for (const line of lines) {
    const cleaned = line.replace(/^#+\s*/, '').trim();
    if (cleaned.length > 0 && !/^(Search Query|Summary|Task|Context|Key (Points|Terms)|Checklist|Acceptance Criteria|Synthesized Answer|Caveats|Tags|Simple Explanation|Why It Matters)$/i.test(cleaned)) {
      const firstSentence = cleaned.split(/[.!?]\s/)[0];
      const raw = firstSentence || cleaned;
      const words = raw.split(/\s+/);
      if (words.length > 12) {
        return cleanTitle(words.slice(0, 10).join(' ') + '…');
      }
      return cleanTitle(raw).slice(0, 100);
    }
  }

  // Last resort: first non-empty line
  for (const line of lines) {
    const cleaned = line.replace(/^#+\s*/, '').trim();
    if (cleaned) return cleanTitle(cleaned).slice(0, 100);
  }

  return 'Untitled';
}

export async function runAction(req: ActionRequest): Promise<ActionResult> {
  console.log('🔧 [dispatch] runAction called:', { actionId: req.actionId, selLen: req.selection.length });
  const registry = REGISTRY[req.actionId];
  if (!registry) {
    console.error('❌ [dispatch] unknown action:', req.actionId);
    return {
      ok: false,
      cardType: 'knowledge' as const,
      title: '',
      body: '',
      error: `Unknown action: ${req.actionId}`,
    };
  }

  try {
    const settings = await getSettings();
    console.log('⚙️ [dispatch] settings loaded:', { baseUrl: settings.baseUrl, model: settings.model, hasKey: !!settings.apiKey, keyLen: settings.apiKey?.length });

    // ---- Search action: use progressive fallback orchestrator ----
    if (req.actionId === 'search') {
      return await runSearchAction(req.selection, settings);
    }

    // ---- Other actions: create placeholder card → LLM → update card ----
    const { draftId, animInterval } = await createLoadingCard(req.actionId, req.selection);

    try {
      const messages = buildPrompt(req.actionId, req.selection, settings.search, settings.language, settings.promptTemplates, settings.activePromptId);
      console.log('💬 [dispatch] calling chat() with', messages.length, 'messages');
      const raw = await chat(messages, {
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        maxTokens: settings.maxTokens,
      });
      console.log('✅ [dispatch] chat() returned', raw.length, 'chars:', raw.slice(0, 80));

      // Smart title extraction — different strategies per action type
      const title = extractTitle(raw, req.actionId, undefined, req.selection);

      clearInterval(animInterval);
      await updateCard(draftId, { title, body: raw, updatedAt: Date.now() });
      notifySidepanel();

      return {
        ok: true,
        cardType: registry.cardType,
        title,
        body: raw,
        saved: true,
      };
    } catch (err: any) {
      console.error('💥 [dispatch] action failed:', err?.message);
      clearInterval(animInterval);
      const label = LOADING_LABELS[req.actionId]?.verb ?? req.actionId;
      await updateCard(draftId, {
        title: `❌ ${label} failed`,
        body: `**Error:** ${err?.message ?? 'Unknown error'}\n\n_Original selection:_\n> ${req.selection.slice(0, 300)}`,
        updatedAt: Date.now(),
      });
      notifySidepanel();
      return {
        ok: false,
        cardType: registry.cardType,
        title: '',
        body: '',
        error: err?.message ?? 'Unknown error',
        saved: true,
      };
    }
  } catch (err: any) {
    console.error('💥 [dispatch] setup failed:', err?.message);
    return {
      ok: false,
      cardType: registry.cardType,
      title: '',
      body: '',
      error: err?.message ?? 'Unknown error',
    };
  }
}

/**
 * Execute the search action through the A→B→C progressive fallback orchestrator.
 * Creates a placeholder card immediately (loading state) then updates it.
 * Animates the placeholder title while searching.
 * Handles capability caching and mode gating.
 */

const LOADING_MESSAGES = [
  'Agent is searching',
  'Fishing for answers',
  'Hunting the web',
  'Potty training the AI',
  'Flowing through the tubes',
  'Caffeinating the hamsters',
  'Asking the internet nicely',
  'Wee-wooing across the web',
  'Tickling the servers',
  'Negotiating with routers',
];

/** Emoji prefix + gerund label for each action type's loading card. */
const LOADING_LABELS: Record<string, { emoji: string; verb: string }> = {
  explain: { emoji: '💡', verb: 'Explaining' },
  summary: { emoji: '📝', verb: 'Summarizing' },
  search:  { emoji: '🔍', verb: 'Searching' },
  task:    { emoji: '✅', verb: 'Planning task' },
};

/** Safely notify the sidepanel that cards have changed. Non-critical — fails silently. */
function notifySidepanel() {
  try {
    chrome?.runtime?.sendMessage?.({ kind: 'CARDS_UPDATED' })?.catch?.(() => {});
  } catch { /* sidepanel may not be open */ }
}

/**
 * Create a placeholder card for any action type so the sidepanel shows
 * a loading card immediately while the LLM processes.
 * Returns [draftId, animInterval] — caller MUST clearInterval and updateCard.
 */
async function createLoadingCard(
  actionId: string,
  selectedText: string,
): Promise<{ draftId: string; animInterval: ReturnType<typeof setInterval> }> {
  const label = LOADING_LABELS[actionId] ?? { emoji: '⚡', verb: 'Processing' };
  const draftId = await addCard({
    type: actionId === 'search' ? 'search' : 'knowledge',
    title: `${label.emoji} ${label.verb}…`,
    body: `_Working on your selection..._`,
    tags: [],
    folder: 'no_folder',
    sourceUrl: '',
    sourceTitle: '',
    originalText: selectedText,
  });

  let tick = 0;
  const animInterval = setInterval(() => {
    tick++;
    const msg = LOADING_MESSAGES[tick % LOADING_MESSAGES.length];
    const dots = '.'.repeat((tick % 3) + 1);
    updateCard(draftId, { title: `${label.emoji} ${msg}${dots}`, updatedAt: Date.now() }).catch(() => {});
  }, 800);

  notifySidepanel();

  return { draftId, animInterval };
}

async function runSearchAction(
  selectedText: string,
  settings: Awaited<ReturnType<typeof getSettings>>,
): Promise<ActionResult> {
  const cardType = 'search' as const;
  const chatOpts = {
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
    maxTokens: settings.maxTokens,
  };

  // ---- Create placeholder card immediately (loading state) ----
  const { draftId, animInterval } = await createLoadingCard('search', selectedText);

  try {
    // Gate: if searchMode is 'knowledge', skip straight to Tier C
    if (settings.searchMode === 'knowledge') {
      console.log('🔍 [dispatch] search mode: knowledge-only (Tier C)');
      const { runSearch } = await import('./search/index');
      const result = await runSearch(selectedText, settings.search, chatOpts, null, false, settings.language);
      const title = extractTitle(result.body, 'search', result.query, selectedText);
      clearInterval(animInterval);
      await updateCard(draftId, { title, body: result.body, updatedAt: Date.now() });
      notifySidepanel();
      console.log(`🔍 [dispatch] search completed via Tier ${result.tier}, title:`, title);
      return { ok: true, cardType, title, body: result.body, saved: true, searchTier: result.tier };
    }

    // Agentic mode: run progressive fallback A → B → C
    console.log('🔍 [dispatch] search mode: agentic, capability cache:', settings.webSearchCapability);
    const result = await runSearch(
      selectedText,
      settings.search,
      chatOpts,
      settings.webSearchCapability,
      false,
      settings.language,
    );

    // If capability was just probed (was null before), persist the new cache
    if (!settings.webSearchCapability) {
      const updated = await refreshCapability(chatOpts);
      await saveSettings({ webSearchCapability: updated });
    }

    const title = extractTitle(result.body, 'search', result.query, selectedText);
    clearInterval(animInterval);
    await updateCard(draftId, { title, body: result.body, updatedAt: Date.now() });
    notifySidepanel();
    console.log(`🔍 [dispatch] search completed via Tier ${result.tier}, title:`, title);
    return { ok: true, cardType, title, body: result.body, saved: true, searchTier: result.tier };
  } catch (err: any) {
    console.error('💥 [dispatch] search failed:', err?.message);
    clearInterval(animInterval);
    await updateCard(draftId, {
      title: '❌ Search failed',
      body: `**Error:** ${err?.message ?? 'Unknown error'}\n\n_Original selection:_\n> ${selectedText.slice(0, 300)}`,
      updatedAt: Date.now(),
    });
    notifySidepanel();
    return {
      ok: false,
      cardType,
      title: '',
      body: '',
      error: err?.message ?? 'Unknown error',
      saved: true,
    };
  }
}

export async function enrichAndSave(card: NewCard): Promise<string> {
  // Heuristic: if the title looks like a full sentence (has a period or > 12 words),
  // it was probably copy-pasted from the response body. Re-generate it via LLM.
  const titleWords = card.title.trim().split(/\s+/);
  const titleLooksLikeSentence =
    titleWords.length > 12 || card.title.includes('.') || card.title.length > 100;

  // Auto-enrich: generate a proper short title + tags from the LLM
  if (titleLooksLikeSentence || card.tags.length === 0) {
    try {
      const settings = await getSettings();
      const enrichPrompt = `Given this card content, generate a short title (max 80 chars) and 2-5 relevant tags (lowercase, single words or short phrases).

Body:
${card.body.slice(0, 2000)}

Respond with exactly this JSON format, nothing else:
{"title": "...", "tags": ["tag1", "tag2"]}`;

      const raw = await chat(
        [
          {
            role: 'system',
            content:
              'You are a precise metadata generator. Output only valid JSON.',
          },
          { role: 'user', content: enrichPrompt },
        ],
        {
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          model: settings.model,
          maxTokens: 256, // small response for metadata enrichment
        },
      );

      const parsed = JSON.parse(raw.trim());
      // Always use the LLM-generated title — it's better than extractTitle's guess
      if (parsed.title) {
        card = { ...card, title: parsed.title };
      }
      if (card.tags.length === 0 && Array.isArray(parsed.tags)) {
        card = { ...card, tags: parsed.tags };
      }
    } catch {
      // Enrichment failed — keep the original extracted title, or fall back
      if (!card.title.trim()) {
        card = { ...card, title: 'Untitled' };
      }
    }
  }

  // Ensure folder is always set
  if (!card.folder) {
    card = { ...card, folder: 'no_folder' };
  }

  return addCard(card);
}
