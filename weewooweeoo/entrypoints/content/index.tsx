import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Wheel } from './Wheel';
import { ResultPanel } from './ResultPanel';
import { getSettings } from '../../src/lib/settings';
import type { ActionResult } from '../../src/lib/messages';
import type { NewCard } from '../../src/lib/types';
import type { WheelButtonStyle, WheelSkinConfig } from './Wheel';

// ── Skin config (doodle — the default) ─

function doodleUrl(name: string): string {
  return chrome.runtime.getURL(`skins/doodle/${name}.png`);
}

/** Build a glass skin config that adapts to light/dark mode. */
function makeGlassConfig(isDark: boolean): WheelSkinConfig {
  // Dark mode: dark tinted glass.  Light mode: bright frosted glass.
  const containerBg = isDark
    ? 'rgba(24,24,34,0.1)'
    : 'rgba(255,255,255,0.1)';
  const containerBorder = isDark
    ? '1px solid rgba(255,255,255,0.1)'
    : '1px solid rgba(255,255,255,0.35)';
  const glowColor = isDark
    ? 'rgba(255,255,255,0.07)'
    : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#e0dcd6' : '#3a3834';
  const centerBg = isDark
    ? 'rgba(38,38,52,0.1)'
    : 'rgba(255,255,255,0.1)';
  const centerBorder = isDark
    ? '1px solid rgba(255,255,255,0.14)'
    : '1px solid rgba(255,255,255,0.4)';

  // Per-action tints — each keeps a subtle warm/cool/purple/warm identity
  // via a tinted semi-transparent background.
  const colors: Record<string, WheelButtonStyle> = {
    explain: {
      bg: isDark ? 'rgba(44,40,36,0.85)' : 'rgba(252,248,240,0.85)',
      glow: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      text: textColor,
    },
    summary: {
      bg: isDark ? 'rgba(36,38,46,0.85)' : 'rgba(240,242,250,0.85)',
      glow: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      text: textColor,
    },
    search: {
      bg: isDark ? 'rgba(40,36,46,0.85)' : 'rgba(244,240,250,0.85)',
      glow: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      text: textColor,
    },
    task: {
      bg: isDark ? 'rgba(46,42,36,0.85)' : 'rgba(250,244,236,0.85)',
      glow: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      text: textColor,
    },
  };

  return {
    icons: {
      explain: { type: 'image', value: doodleUrl('explain') },
      summary: { type: 'image', value: doodleUrl('summary') },
      search:  { type: 'image', value: doodleUrl('search') },
      task:    { type: 'image', value: doodleUrl('task') },
    },
    colors,
    fallbackColor: {
      bg: isDark ? 'rgba(40,38,36,0.3)' : 'rgba(248,244,238,0.4)',
      glow: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      text: textColor,
    },
    wheelGlow: glowColor,
    centerBg,
    centerBorder,
    ringBorder: isDark
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid rgba(255,255,255,0.25)',
    centerIcon: { type: 'image', value: chrome.runtime.getURL('skins/icon-wheel.svg') },
    glass: {
      containerBlur: '8px',
      buttonBlur: '100px',
      containerBg,
      containerBorder,
    },
  };
}

function getWheelConfig(_skinId: string, isDark: boolean): WheelSkinConfig {
  return makeGlassConfig(isDark);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'weewoo-wheel',
      position: 'overlay',
      onMount(container) {
        const root = createRoot(container);
        root.render(<WheelApp />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    let slots: string[] = ['explain', 'summary', 'search'];
    let wheelSkin = 'doodle';
    let wheelTrigger: 'highlight' | 'rightclick' = 'highlight';
    let themeDark = false;

    getSettings().then((s) => {
      slots = s.slots;
      wheelSkin = s.wheelSkin ?? 'doodle';
      wheelTrigger = s.wheelTrigger ?? 'highlight';
      themeDark = s.theme === 'dark';
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.settings?.newValue) {
        const s = changes.settings.newValue as any;
        slots = s.slots;
        if (s.wheelSkin) {
          wheelSkin = s.wheelSkin;
        }
        if (s.wheelTrigger) {
          wheelTrigger = s.wheelTrigger;
        }
      }
    });

    function WheelApp() {
      // ---- wheel state ----
      const [visible, setVisible] = useState(false);
      const [position, setPosition] = useState({ x: 0, y: 0 });
      const selectionRef = useRef({ text: '', sourceUrl: '', sourceTitle: '' });
      const [skinId, setSkinId] = useState(wheelSkin);
      const [isDark, setIsDark] = useState(themeDark);

      // Sync skin + theme changes from storage
      useEffect(() => {
        const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
          if (area === 'local' && changes.settings?.newValue) {
            const s = changes.settings.newValue as any;
            if (s.wheelSkin) setSkinId(s.wheelSkin);
            if (s.theme) setIsDark(s.theme === 'dark');
          }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
      }, []);

      // ---- result panel state ----
      const [result, setResult] = useState<ActionResult | null>(null);
      const sourceRef = useRef<{ url: string; title: string; originalText: string } | null>(null);
      const [source, setSource] = useState<{
        url: string;
        title: string;
        originalText: string;
      } | null>(null);

      // ---- selection listener ----
      useEffect(() => {
        const handleMouseUp = () => {
          // Skip wheel display in right-click-only mode
          if (wheelTrigger === 'rightclick') return;

          const sel = window.getSelection();
          if (!sel || sel.isCollapsed || !sel.toString().trim()) {
            setVisible(false);
            return;
          }

          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          selectionRef.current = {
            text: sel.toString(),
            sourceUrl: window.location.href,
            sourceTitle: document.title,
          };

          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 12,
          });
          setVisible(true);
          // Dismiss any stale result panel when wheel re-appears
          setResult(null);
        };

        const handleMouseDown = (e: MouseEvent) => {
          const target = e.target as HTMLElement | null;
          // Shadow DOM retargets events crossing its boundary: any click inside
          // our UI surfaces with e.target === the <weewoo-wheel> host element.
          // So "inside our UI" == the host is the target (or an ancestor of it).
          const hostEl = document.querySelector('weewoo-wheel');
          const insideOurUi =
            !!hostEl && (hostEl === target || hostEl.contains(target));
          if (!insideOurUi) {
            setVisible(false);
            setResult(null);
          }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
          document.removeEventListener('mouseup', handleMouseUp);
          document.removeEventListener('mousedown', handleMouseDown);
        };
      }, []);

      // ---- debug toast state ----
      const [debugMsg, setDebugMsg] = useState<string | null>(null);
      const [debugColor, setDebugColor] = useState('#4a4');
      const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

      const showToast = (msg: string, color = '#4a4') => {
        setDebugMsg(msg);
        setDebugColor(color);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setDebugMsg(null), 4000);
      };

      // ---- message listener for ACTION_RESULT from background ----
      useEffect(() => {
        const handler = (
          message: any,
          _sender: chrome.runtime.MessageSender,
          _sendResponse: (response?: any) => void,
        ) => {
          console.log('🔔 [content] received message:', JSON.stringify(message));
          if (message?.kind === 'ACTION_RESULT') {
            const result = message as ActionResult;
            console.log('✅ [content] matched ACTION_RESULT, saved:', result.saved, 'tier:', result.searchTier);
            if (result.ok) {
              // Only auto-save if the background didn't already save it (loading-state flow)
              if (!result.saved && sourceRef.current) {
                const card: NewCard = {
                  type: result.cardType,
                  title: result.title,
                  body: result.body,
                  tags: [],
                  folder: 'no_folder',
                  sourceUrl: sourceRef.current.url,
                  sourceTitle: sourceRef.current.title,
                  originalText: sourceRef.current.originalText,
                };
                chrome.runtime.sendMessage({ kind: 'SAVE_CARD', card });
              }
              // Show tier badge for search actions
              const tierBadge = result.searchTier
                ? result.searchTier === 'A' ? ' 🌐 Web' : result.searchTier === 'B' ? ' 📡 Scrape' : ' 📚 Knowledge'
                : '';
              showToast(`💾 Saved: ${result.title.slice(0, 50) || 'Untitled'}${tierBadge}`, '#4a4');
              setSource(null);
              sourceRef.current = null;
            } else {
              // Error — show panel (loading-state cards already saved as error by background)
              if (!result.saved) {
                setResult(result);
              }
              showToast(
                `❌ ERROR: ${result.error?.slice(0, 60) || 'failed'}`,
                '#f44',
              );
            }
          } else {
            console.log('⏭️ [content] ignored message (kind=', message?.kind, ')');
          }
        };
        chrome.runtime.onMessage.addListener(handler);
        return () => chrome.runtime.onMessage.removeListener(handler);
      }, []);

      // ---- handlers ----
      const handlePick = (actionId: string) => {
        const { text, sourceUrl, sourceTitle } = selectionRef.current;
        const label = actionId.toUpperCase();
        console.log('🖱️ [content] handlePick:', { actionId, textLen: text.length, sourceUrl });
        showToast(`🖱️ CLICKED: ${label} (${text.length} chars selected)`, '#4af');
        sourceRef.current = { url: sourceUrl, title: sourceTitle, originalText: text };
        setSource(sourceRef.current);
        chrome.runtime.sendMessage({
          kind: 'RUN_ACTION',
          actionId,
          selection: text,
          sourceUrl,
          sourceTitle,
        });
        console.log('📤 [content] sent RUN_ACTION to background');
        setVisible(false);
      };

      const handleSave = (card: NewCard) => {
        chrome.runtime.sendMessage({ kind: 'SAVE_CARD', card });
        setResult(null);
        setSource(null);
      };

      const handleClose = () => {
        setResult(null);
        setSource(null);
      };

      return (
        <>
          {/*  TOAST — pops up on every action */}
          {debugMsg && (
            <div
              style={{
                position: 'fixed',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2147483647,
                background: 'rgba(0,0,0,0.9)',
                color: debugColor,
                fontSize: 13,
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '10px 24px',
                borderRadius: 10,
                border: `2px solid ${debugColor}`,
                boxShadow: `0 0 20px ${debugColor}44`,
                animation: 'weewoo-toast-in 0.2s ease-out',
                whiteSpace: 'nowrap',
              }}
            >
              {debugMsg}
            </div>
          )}

          {/* Wheel */}
          {visible && !result && (
            <div
              style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -100%)',
                zIndex: 2147483647,
                pointerEvents: 'auto',  // ← MUST HAVE: WXT overlay has pointer-events:none
              }}
            >
              <Wheel slots={slots} onPick={handlePick} config={getWheelConfig(skinId, isDark)} />
            </div>
          )}

          {/* Result panel — centered on screen, not near selection */}
          {result && source && (
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2147483647,
                pointerEvents: 'auto',  // ← MUST HAVE
              }}
            >
              <ResultPanel
                result={result}
                source={source}
                onSave={handleSave}
                onClose={handleClose}
              />
            </div>
          )}
        </>
      );
    }

    ui.mount();
  },
});
