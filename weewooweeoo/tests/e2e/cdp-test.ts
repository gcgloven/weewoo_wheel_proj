/**
 * Connect to existing Chrome on port 9222 (with extension loaded)
 * and test the WeeWoo² Wheel extension end-to-end.
 *
 * Prerequisites:
 *   1. pnpm build
 *   2. Chrome launched with --remote-debugging-port=9222 --load-extension=...
 *
 * Usage: node --import tsx tests/e2e/cdp-test.ts
 */
import puppeteer from 'puppeteer';

async function main() {
  console.log('🔌 Connecting to Chrome on port 9222...');
  const browser = await (puppeteer as any).connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null,
  });
  console.log('✅ Connected!');

  const pages = await browser.pages();
  console.log('   Open pages:', pages.length);
  const page = await browser.newPage();

  // Collect extension-related console logs
  page.on('console', (msg: any) => {
    const text = msg.text();
    if (
      text.includes('[content]') ||
      text.includes('[background]') ||
      text.includes('[dispatch]') ||
      text.includes('WeeWoo') ||
      msg.type() === 'error'
    ) {
      console.log(`  📟 [${msg.type()}] ${text.slice(0, 200)}`);
    }
  });

  // ── TEST 1: Content script injects ──
  console.log('\n── Test 1: Content script injection ──');

  await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  const hostCheck = await page.evaluate(() => {
    const host = document.querySelector('weewoo-wheel');
    return {
      exists: !!host,
      hasShadow: host?.shadowRoot ? true : false,
    };
  });
  console.log('   weewoo-wheel host:', JSON.stringify(hostCheck));

  if (hostCheck.exists) {
    console.log('   ✅ Content script injected!');
  } else {
    console.log('   ❌ Content script NOT injected.');
    console.log('   Check: Is the extension loaded? Visit chrome://extensions');
  }

  // ── TEST 2: Select text, wheel appears ──
  console.log('\n── Test 2: Wheel appears on text selection ──');

  await page.evaluate(() => {
    // Find the first substantial paragraph
    const p = document.querySelector('p');
    if (!p) return;
    const range = document.createRange();
    range.selectNodeContents(p);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // Fire mouseup to trigger the extension's listener
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    // Also dispatch on the paragraph itself
    p.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  await new Promise((r) => setTimeout(r, 1500));

  const wheelCheck = await page.evaluate(() => {
    const host = document.querySelector('weewoo-wheel');
    if (!host) return { error: 'no host element — content script did not inject' };
    if (!host.shadowRoot) return { error: 'no shadow root' };

    const wheel = host.shadowRoot.querySelector('[aria-label="WeeWoo Wheel"]');
    const menuButtons = host.shadowRoot.querySelectorAll('[role="menuitem"]');

    return {
      wheelPresent: !!wheel,
      buttonCount: menuButtons.length,
      buttonLabels: Array.from(menuButtons).map(b => b.textContent?.trim()),
    };
  });

  console.log('   Wheel:', JSON.stringify(wheelCheck, null, 2));

  if (wheelCheck.wheelPresent) {
    console.log('   ✅ Wheel appeared with buttons:', wheelCheck.buttonLabels);

    // ── TEST 3: Click a button, check result panel ──
    console.log('\n── Test 3: Click wheel button → result panel ──');

    const clickResult = await page.evaluate(() => {
      const host = document.querySelector('weewoo-wheel');
      if (!host?.shadowRoot) return { error: 'no shadow root' };
      const btn = host.shadowRoot.querySelector('[role="menuitem"]') as HTMLElement;
      if (!btn) return { error: 'no menu button found' };
      const label = btn.textContent?.trim();
      btn.click();
      return { clicked: true, label };
    });

    console.log('   Clicked:', JSON.stringify(clickResult));
    await new Promise((r) => setTimeout(r, 3000));

    const panelCheck = await page.evaluate(() => {
      const host = document.querySelector('weewoo-wheel');
      if (!host?.shadowRoot) return { error: 'no shadow root' };
      const alert = host.shadowRoot.querySelector('[role="alert"]');
      const dialog = host.shadowRoot.querySelector('[role="dialog"]');
      if (alert) {
        return { present: true, type: 'error', text: alert.textContent?.slice(0, 200) };
      }
      // Check for result panel by looking for editable fields
      const textareas = host.shadowRoot.querySelectorAll('textarea');
      const inputs = host.shadowRoot.querySelectorAll('input[type="text"]');
      if (textareas.length > 0 || inputs.length > 0) {
        return {
          present: true,
          type: 'result panel',
          textareas: textareas.length,
          inputs: inputs.length,
        };
      }
      return { present: false, reason: 'no alert, dialog, or editable fields found' };
    });

    console.log('   Panel:', JSON.stringify(panelCheck, null, 2));

    if (panelCheck.present) {
      console.log('   ✅ Result panel appeared!');
      if (panelCheck.type === 'error') {
        console.log('   ℹ️  Error panel expected — you need to configure an API key in options.');
      }
    } else {
      console.log('   ❌ No result panel — check background worker logs.');
    }
  } else {
    console.log('   ❌ Wheel did not appear.');
    console.log('   Reason:', wheelCheck.error);
    console.log('\n   🔍 Debug checklist:');
    console.log('   1. Is the extension ENABLED at chrome://extensions ?');
    console.log('   2. Did you reload after build? Click refresh icon on the extension card.');
    console.log('   3. Open service worker console: chrome://extensions → WeeWoo² Wheel → "service worker"');
    console.log('   4. Refresh this page (F5) and check for content script injection.');
  }

  // Cleanup
  await page.close();
  console.log('\n✅ CDP test complete.');
}

main().catch((err) => {
  console.error('💥 Fatal:', err.message);
  process.exit(1);
});
