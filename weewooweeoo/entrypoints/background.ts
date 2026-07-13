import { runAction, enrichAndSave } from '../src/lib/dispatch';
import { REGISTRY } from '../src/lib/actions/registry';
import type { ActionRequest, SaveCardRequest } from '../src/lib/messages';
import type { NewCard } from '../src/lib/types';

const CONTEXT_MENU_ACTIONS = ['explain', 'summary', 'search', 'task'] as const;

export default defineBackground(() => {
  console.log('WeeWoo² Wheel background worker ready.', {
    id: browser.runtime.id,
  });

  // ---- Open side panel on toolbar icon click ----
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  // ---- Create right-click context menu items ----
  for (const actionId of CONTEXT_MENU_ACTIONS) {
    const action = REGISTRY[actionId];
    chrome.contextMenus.create({
      id: `weewoo-${actionId}`,
      title: `WeeWoo² — ${action.label}`,
      contexts: ['selection'],
    });
  }

  // ---- Context menu click handler ----
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const selection = info.selectionText;
    if (!selection || !tab?.id) return;

    // Extract action ID from menu item ID
    const actionId = info.menuItemId.toString().replace('weewoo-', '');
    if (!CONTEXT_MENU_ACTIONS.includes(actionId as any)) return;

    const action = REGISTRY[actionId];
    const sourceUrl = tab.url || '';
    const sourceTitle = tab.title || '';

    console.log('🖱️ [contextMenu]', actionId, '| selLen:', selection.length, '| url:', sourceUrl);

    const req: ActionRequest = {
      kind: 'RUN_ACTION',
      actionId,
      selection,
      sourceUrl,
      sourceTitle,
    };

    runAction(req)
      .then(async (result) => {
        console.log('📦 [contextMenu] result:', { ok: result.ok, title: result.title?.slice(0, 40) });

        // For search actions, the card is already saved by the loading-state flow
        if (result.ok && !result.saved) {
          // Save non-search actions manually
          const card: NewCard = {
            type: action.cardType,
            title: result.title,
            body: result.body,
            tags: [],
            folder: 'no_folder',
            sourceUrl,
            sourceTitle,
            originalText: selection,
          };
          await enrichAndSave(card);
        }

        // Notify the user
        if (result.ok) {
          chrome.notifications?.create?.(`weewoo-${Date.now()}`, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon/48.png'),
            title: `WeeWoo² — ${action.label}`,
            message: result.title.slice(0, 120) || 'Card saved!',
          });
          // Also notify sidepanel to refresh
          chrome.runtime.sendMessage({ kind: 'CARDS_UPDATED' }).catch(() => {});
        } else {
          chrome.notifications?.create?.(`weewoo-${Date.now()}`, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon/48.png'),
            title: `WeeWoo² — ${action.label} failed`,
            message: result.error?.slice(0, 120) || 'Unknown error',
          });
        }
      })
      .catch((err) => {
        console.error('💥 [contextMenu] error:', err);
      });
  });

  // ---- Message router ----
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const msg = message as { kind: string };
    console.log('📥 [background] received message kind:', msg.kind);

    if (msg.kind === 'RUN_ACTION') {
      const req = msg as unknown as ActionRequest;
      console.log('🏃 [background] RUN_ACTION:', { actionId: req.actionId, selLen: req.selection?.length });
      runAction(req)
        .then((result) => {
          console.log('📦 [background] runAction result:', { ok: result.ok, cardType: result.cardType, title: result.title?.slice(0, 40), error: result.error });
          // Send result back to content script wrapped with kind
          chrome.tabs
            .query({ active: true, currentWindow: true })
            .then(([tab]) => {
              console.log('📑 [background] active tab:', tab?.id, tab?.url);
              if (tab?.id) {
                const payload = { kind: 'ACTION_RESULT', ...result };
                console.log('📤 [background] sending ACTION_RESULT to tab', tab.id, JSON.stringify(payload).slice(0, 200));
                chrome.tabs.sendMessage(tab.id, payload);
              } else {
                console.error('❌ [background] no active tab found!');
              }
            });
          sendResponse({ ack: true });
        })
        .catch((err) => {
          console.error('💥 [background] runAction exception:', err);
          sendResponse({ ack: false, error: err?.message });
        });
      return true;
    }

    if (msg.kind === 'SAVE_CARD') {
      const req = msg as unknown as SaveCardRequest;
      enrichAndSave(req.card)
        .then((id) => {
          chrome.tabs
            .query({ active: true, currentWindow: true })
            .then(([tab]) => {
              if (tab?.id) {
                chrome.tabs.sendMessage(tab.id, {
                  kind: 'CARD_SAVED',
                  id,
                  title: req.card.title,
                });
              }
            });
          sendResponse({ ack: true, id });
        })
        .catch((err) => {
          sendResponse({ ack: false, error: err?.message });
        });
      return true;
    }

    return false;
  });
});
