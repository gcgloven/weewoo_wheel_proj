/**
 * E2E test: Reddit page → select text → WeeWoo² Wheel appears.
 *
 * Launches headed Chrome with the built extension, navigates to a
 * Reddit post, selects text, and verifies the wheel renders.
 *
 * Usage: pnpm build && node --import tsx tests/e2e/reddit-test.ts
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_DIST = path.resolve(__dirname, '../../.output/chrome-mv3');

const REDDIT_URL =
  'https://www.reddit.com/r/ClaudeCode/comments/1rw0bn9/the_real_issue_is_wait_actually_heres_the_fix/';

async function main() {
  const puppeteer = await import('puppeteer');

  console.log('🚀 Launching Chrome with WeeWoo² Wheel extension...');
  console.log('   Extension path:', EXTENSION_DIST);
  console.log('   Target URL:', REDDIT_URL);

  const browser = await puppeteer.default.launch({
    headless: false, // Headed mode so extension loads properly
    executablePath: '/usr/bin/google-chrome',
    args: [
      `--disable-extensions-except=${EXTENSION_DIST}`,
      `--load-extension=${EXTENSION_DIST}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,900',
    ],
  });

  const page = await browser.newPage();

  // Collect all console messages
  const logs: string[] = [];
  page.on('console', (msg: any) => {
    const text = msg.text();
    if (
      text.includes('[content]') ||
      text.includes('[background]') ||
      text.includes('[dispatch]') ||
      text.includes('WeeWoo') ||
      msg.type() === 'error'
    ) {
      console.log(`  [${msg.type()}] ${text.slice(0, 200)}`);
    }
    logs.push(`[${msg.type()}] ${text}`);
  });

  try {
    // ── Navigate to Reddit ──
    console.log('\n📄 Navigating to Reddit...');
    await page.goto(REDDIT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for page content to render
    await new Promise((r) => setTimeout(r, 3000));
    console.log('   Page title:', await page.title());

    // ── Check if extension injected ──
    const injected = await page.evaluate(() => {
      return !!document.querySelector('weewoo-wheel');
    });
    console.log('\n🔌 Extension injected:', injected);

    if (!injected) {
      console.log(
        '   ⚠️ Extension not injected — may need page refresh after extension load.',
      );
      console.log(
        '   Try: reload the extension at chrome://extensions then refresh this page.',
      );
    }

    // ── Find the post text and select it ──
    console.log('\n🖱️ Attempting to select post text...');

    const selectionResult = await page.evaluate(() => {
      // Try to find post content paragraphs
      const paragraphs = document.querySelectorAll(
        'p, [data-testid="post-content"], .text-neutral-content, shreddit-post div[slot="text-body"]',
      );
      const textBlocks: { tag: string; text: string }[] = [];
      for (const p of paragraphs) {
        const text = p.textContent?.trim();
        if (text && text.length > 30) {
          textBlocks.push({ tag: p.tagName, text: text.slice(0, 120) });
        }
      }

      // Try selecting the first substantial paragraph
      for (const p of paragraphs) {
        const text = p.textContent?.trim();
        if (text && text.length > 30) {
          const range = document.createRange();
          range.selectNodeContents(p);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          // Dispatch mouseup to trigger the extension's selection listener
          p.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          return {
            selected: true,
            text: text.slice(0, 200),
            textBlocksFound: textBlocks.length,
          };
        }
      }
      return { selected: false, textBlocksFound: textBlocks.length };
    });

    console.log('   Selection result:', JSON.stringify(selectionResult, null, 2));

    // ── Wait for wheel to appear ──
    console.log('\n⏳ Waiting for wheel (2s)...');
    await new Promise((r) => setTimeout(r, 2000));

    const wheelCheck = await page.evaluate(() => {
      const host = document.querySelector('weewoo-wheel');
      if (!host) return { present: false, reason: 'no host element' };
      if (!host.shadowRoot)
        return { present: false, reason: 'no shadow root' };
      const wheel = host.shadowRoot.querySelector(
        '[aria-label="WeeWoo Wheel"]',
      );
      const buttons = host.shadowRoot.querySelectorAll('[role="menuitem"]');
      return {
        present: !!wheel,
        buttonCount: buttons.length,
        buttonLabels: Array.from(buttons).map(
          (b) => b.textContent?.trim() || '',
        ),
      };
    });

    console.log('\n🎡 Wheel check:', JSON.stringify(wheelCheck, null, 2));

    if (wheelCheck.present) {
      console.log('\n✅ SUCCESS: Wheel appeared with', wheelCheck.buttonCount, 'buttons:', wheelCheck.buttonLabels);

      // ── Try clicking a button ──
      console.log('\n🖱️ Clicking first wheel button...');
      const clickResult = await page.evaluate(() => {
        const host = document.querySelector('weewoo-wheel');
        if (!host?.shadowRoot) return { clicked: false, reason: 'no wheel' };
        const btn = host.shadowRoot.querySelector(
          '[role="menuitem"]',
        ) as HTMLElement | null;
        if (!btn) return { clicked: false, reason: 'no button' };
        btn.click();
        return { clicked: true, label: btn.textContent?.trim() };
      });
      console.log('   Click result:', JSON.stringify(clickResult));

      // Wait for result panel
      await new Promise((r) => setTimeout(r, 3000));

      const panelCheck = await page.evaluate(() => {
        const host = document.querySelector('weewoo-wheel');
        if (!host?.shadowRoot) return { present: false, reason: 'no host' };
        const alert = host.shadowRoot.querySelector('[role="alert"]');
        const dialog = host.shadowRoot.querySelector('[role="dialog"]');
        if (alert) return { present: true, type: 'error', text: alert.textContent?.slice(0, 200) };
        if (dialog) return { present: true, type: 'result', text: dialog.textContent?.slice(0, 200) };
        return { present: false, reason: 'no alert or dialog found' };
      });

      console.log('\n📋 Result panel:', JSON.stringify(panelCheck, null, 2));

      if (panelCheck.present) {
        console.log('✅ SUCCESS: Result panel appeared!');
        console.log('   Content:', panelCheck.text);
      } else {
        console.log('❌ No result panel appeared — check background worker console.');
        console.log('   (Expected if no API key configured: should show "Missing API key" error)');
      }
    } else {
      console.log('\n❌ Wheel did NOT appear.');
      console.log('   Reason:', wheelCheck.reason);
      console.log('\n   Debug steps:');
      console.log('   1. Run: pnpm dev (separate terminal)');
      console.log('   2. Go to chrome://extensions → reload WeeWoo² Wheel');
      console.log('   3. Open the SERVICE WORKER console (click "service worker" link)');
      console.log('   4. Refresh this page');
      console.log('   5. Check for 📥 [background] and 🖱️ [content] logs');
    }

    // ── Print all collected logs ──
    console.log('\n\n📜 All collected console logs:');
    for (const log of logs) {
      console.log('  ', log.slice(0, 300));
    }
  } catch (err) {
    console.error('💥 Test error:', err);
  } finally {
    console.log('\n\n⏸️  Browser stays open for inspection. Close it manually or press Ctrl+C.');
    // Don't close browser — let user inspect
    // await browser.close();
  }
}

main().catch(console.error);
