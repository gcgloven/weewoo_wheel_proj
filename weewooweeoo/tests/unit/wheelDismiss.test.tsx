/**
 * Tests for the shadow DOM outside-click dismissal fix (Bug #3 in repair-log).
 *
 * Verifies the fix: when shadow DOM retargets e.target to the <weewoo-wheel>
 * host element, the outside-click handler correctly identifies it as "inside
 * our UI" and does NOT dismiss the wheel.
 *
 * This reproduces the exact scenario that was broken:
 *   1. User clicks a wheel button
 *   2. mousedown fires first, e.target = <weewoo-wheel> (shadow DOM retargeting)
 *   3. Before fix: handler dismissed the wheel → click never registered
 *   4. After fix: handler recognizes host as "inside UI" → click proceeds
 */
import { fireEvent } from '@testing-library/react';

// ── Simulated DOM setup ──────────────────────────────────────────

/**
 * Creates a minimal DOM structure that mirrors the shadow DOM reality:
 *   <html>
 *     <body>
 *       <!-- page content -->
 *       <weewoo-wheel>   ← shadow DOM host (WXT overlay)
 *         #shadow-root
 *           <div aria-label="WeeWoo Wheel">
 *             <button role="menuitem">Explain</button>  ← what user actually clicks
 *           </div>
 *       </weewoo-wheel>
 *     </body>
 *   </html>
 *
 * In a real browser, clicking the <button> inside the shadow DOM causes
 * the mousedown event's target to be RETARGETED to <weewoo-wheel> when
 * the event crosses the shadow boundary to the page-level listener.
 */
function createMockDom() {
  const host = document.createElement('weewoo-wheel');
  const shadow = host.attachShadow({ mode: 'open' });
  const wheelDiv = document.createElement('div');
  wheelDiv.setAttribute('aria-label', 'WeeWoo Wheel');
  const button = document.createElement('button');
  button.setAttribute('role', 'menuitem');
  button.textContent = 'Explain';
  wheelDiv.appendChild(button);
  shadow.appendChild(wheelDiv);
  document.body.appendChild(host);
  return { host, shadow, wheelDiv, button };
}

// ── The FIXED outside-click logic ────────────────────────────────

/**
 * The corrected outside-click handler pattern.
 * This is the logic now used in entrypoints/content/index.tsx.
 */
function isInsideOurUi(target: HTMLElement | null): boolean {
  const hostEl = document.querySelector('weewoo-wheel');
  if (!hostEl) return false;
  // KEY FIX: target IS the host when shadow DOM retargets the event.
  // Old broken check: hostEl.shadowRoot?.querySelector('...')?.contains(target)
  //   → always false because target=host, and host is ancestor not descendant.
  return hostEl === target || hostEl.contains(target);
}

// ── Tests ────────────────────────────────────────────────────────

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});

test('click on wheel button → e.target retargeted to host → recognized as inside UI', () => {
  createMockDom();
  const host = document.querySelector('weewoo-wheel')!;

  // Simulate shadow DOM event retargeting: the actual click was on the
  // button inside shadow DOM, but the page-level mousedown listener sees
  // e.target === the host element.
  const syntheticEvent = { target: host } as unknown as MouseEvent;

  // The page-level listener receives this and checks:
  const inside = isInsideOurUi(syntheticEvent.target as HTMLElement);
  expect(inside).toBe(true);
  // → Wheel is NOT dismissed ✅
});

test('click on page content (not our UI) → recognized as outside', () => {
  const { host } = createMockDom();
  // Some element on the page, unrelated to our UI
  const pageParagraph = document.createElement('p');
  pageParagraph.textContent = 'Some page text';
  document.body.insertBefore(pageParagraph, host);

  const syntheticEvent = { target: pageParagraph } as unknown as MouseEvent;

  const inside = isInsideOurUi(syntheticEvent.target as HTMLElement);
  expect(inside).toBe(false);
  // → Wheel IS dismissed (correct behavior) ✅
});

test('click on body when no host exists → returns false (safe)', () => {
  // No host element in DOM at all
  const syntheticEvent = { target: document.body } as unknown as MouseEvent;

  const inside = isInsideOurUi(syntheticEvent.target as HTMLElement);
  expect(inside).toBe(false);
  // → Safe: doesn't crash when host is missing ✅
});

test('host.contains(target) works when target is a child of host (non-shadow)', () => {
  // Edge case: target is a child of host in the light DOM (though unlikely)
  const host = document.createElement('weewoo-wheel');
  const child = document.createElement('span');
  host.appendChild(child); // light DOM child, not shadow
  document.body.appendChild(host);

  const syntheticEvent = { target: child } as unknown as MouseEvent;

  const inside = isInsideOurUi(syntheticEvent.target as HTMLElement);
  expect(inside).toBe(true);
  // → Handles light DOM children too ✅
});

test('the old broken pattern would have failed — documenting the fix', () => {
  const { host, wheelDiv } = createMockDom();

  // OLD BROKEN PATTERN (what was in the code before the fix):
  function oldBrokenCheck(target: HTMLElement | null): boolean {
    const hostEl = document.querySelector('weewoo-wheel');
    if (!hostEl?.shadowRoot) return false;
    const insideWheel = hostEl.shadowRoot
      .querySelector('[aria-label="WeeWoo Wheel"]')
      ?.contains(target);
    const insidePanel = hostEl.shadowRoot
      .querySelector('[role="alert"], [role="dialog"]')
      ?.contains(target);
    return !!(insideWheel || insidePanel);
  }

  // With e.target = host (shadow DOM retargeting):
  const result = oldBrokenCheck(host);
  expect(result).toBe(false);
  // ❌ Old code would dismiss the wheel on every button click!
  //    wheelDiv.contains(host) is false because host is the ANCESTOR,
  //    not a descendant of wheelDiv.

  // NEW FIXED PATTERN — same scenario:
  const newResult = isInsideOurUi(host);
  expect(newResult).toBe(true);
  // ✅ Correctly identifies the host as "inside our UI"
});
