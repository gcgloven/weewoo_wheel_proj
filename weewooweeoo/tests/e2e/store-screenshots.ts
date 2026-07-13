/**
 * Store Screenshot Capture Script
 *
 * Captures Chrome Web Store listing screenshots for WeeWoo² Wheel.
 *
 * PREREQUISITES:
 *   1. Build the extension:  cd weewooweeoo && pnpm build
 *   2. Launch Chrome with remote debugging AND the extension loaded:
 *      google-chrome --remote-debugging-port=9222 \
 *        --disable-extensions-except=/path/to/.output/chrome-mv3 \
 *        --load-extension=/path/to/.output/chrome-mv3
 *   3. In that Chrome, open the options page and sidepanel at least once
 *      so they exist as tabs.
 *
 * USAGE:
 *   cd weewooweeoo
 *   pnpm build
 *   # (launch Chrome as above, then:)
 *   node --import tsx tests/e2e/store-screenshots.ts
 *
 * OUTPUT:
 *   docs/screenshots/01-options.png   — Provider configuration page
 *   docs/screenshots/02-sidepanel.png — Scrapbook side panel
 *   docs/screenshots/03-wheel.png     — Wheel on selected text (needs test page)
 */

import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../docs/screenshots');
const EXTENSION_DIST = path.resolve(__dirname, '../../.output/chrome-mv3');

// Ensure output directory exists
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureExtensionPage(
  browser: any,
  extensionId: string,
  pageName: string,
  outputName: string,
  width: number = 1280,
  height: number = 800
) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });

  const url = `chrome-extension://${extensionId}/${pageName}.html`;
  console.log(`📸 Capturing ${pageName} at ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
    await sleep(1000); // Let React render
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, outputName),
      fullPage: false,
    });
    console.log(`  ✅ Saved: ${outputName}`);
  } catch (err: any) {
    console.error(`  ❌ Failed to capture ${pageName}: ${err.message}`);
    console.log(`  💡 Make sure the extension is loaded and you've opened ${pageName}.html at least once.`);
  } finally {
    await page.close();
  }
}

async function captureWheelOnTestPage(
  browser: any,
  serverPort: number
) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  const testPageUrl = `http://127.0.0.1:${serverPort}/`;
  console.log(`📸 Navigating to test page: ${testPageUrl}`);

  await page.goto(testPageUrl, { waitUntil: 'networkidle2', timeout: 10000 });
  await sleep(2000); // Wait for content script injection

  // Select the target text
  await page.evaluate(() => {
    const el = document.querySelector('#target');
    if (el) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  });

  await sleep(1500); // Wait for wheel to appear

  // Check if wheel is visible
  const wheelState = await page.evaluate(() => {
    const host = document.querySelector('weewoo-wheel');
    const wheel = host?.shadowRoot?.querySelector('[aria-label="WeeWoo Wheel"]');
    return {
      hostExists: !!host,
      wheelVisible: !!wheel,
      wheelStyle: wheel ? window.getComputedStyle(wheel).display : 'N/A',
    };
  });

  console.log('  Wheel state:', JSON.stringify(wheelState));

  if (wheelState.wheelVisible) {
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-wheel.png'),
      fullPage: false,
    });
    console.log('  ✅ Saved: 03-wheel.png');
  } else {
    console.log('  ⚠️ Wheel not visible — content script may not have injected.');
    console.log('  💡 Try manual capture: select text on any page and take a screenshot.');
  }

  await page.close();
}

async function main() {
  const puppeteer = await import('puppeteer');

  // ── Start a tiny HTTP test page server ──
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>WeeWoo² Wheel Test Page</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 80px auto; padding: 20px; line-height: 1.8; color: #333; }
  #target { background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffc107; font-size: 18px; cursor: text; }
  h1 { color: #6c5ce7; }
</style></head>
<body>
  <h1>WeeWoo² Wheel — Test Page</h1>
  <p>Select the text below to trigger the radial command wheel:</p>
  <p id="target">Artificial intelligence is transforming how we interact with information on the web. By combining large language models with browser-native interfaces, we can create tools that understand context, generate insights, and help users make sense of complex content without ever leaving the page.</p>
  <p>This paragraph is here to provide additional context around the selection area, simulating a real webpage reading experience.</p>
</body>
</html>`);
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as { port: number };

  // ── Connect to Chrome with remote debugging ──
  let browser: any;
  try {
    browser = await (puppeteer as any).connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null,
    });
    console.log('✅ Connected to Chrome via CDP');
  } catch {
    console.log('⚠️  Could not connect to Chrome at :9222. Launching new instance...');

    browser = await puppeteer.default.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: [
        `--disable-extensions-except=${EXTENSION_DIST}`,
        `--load-extension=${EXTENSION_DIST}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--remote-debugging-port=9223',
      ],
    });
    console.log('✅ Launched Chrome with extension (headless mode — wheel may not render)');
  }

  // ── Find the extension ID ──
  const targets = await browser.targets();
  let extensionId = '';

  for (const target of targets) {
    const url = target.url();
    const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
    if (match) {
      extensionId = match[1];
      console.log(`🔍 Found extension ID: ${extensionId}`);
      break;
    }
  }

  if (!extensionId) {
    // Try reading from the service worker
    for (const target of targets) {
      const url = target.url();
      if (url.startsWith('chrome-extension://') && url.includes('background')) {
        const m = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (m) { extensionId = m[1]; console.log(`🔍 Found via SW: ${extensionId}`); break; }
      }
    }
  }

  // ── Capture screenshots ──
  if (extensionId) {
    await captureExtensionPage(browser, extensionId, 'options', '01-options.png');
    await captureExtensionPage(browser, extensionId, 'sidepanel', '02-sidepanel.png');
  } else {
    console.log('❌ Could not find extension ID. Trying fallback approach...');
    // Fallback: list all pages
    const pages = await browser.pages();
    console.log(`  Available pages (${pages.length}):`);
    for (const p of pages) {
      try {
        console.log(`    ${p.url().slice(0, 100)} — "${(await p.title()).slice(0, 60)}"`);
      } catch { /* skip */ }
    }
  }

  // ── Try wheel capture ──
  await captureWheelOnTestPage(browser, addr.port);

  // ── Cleanup ──
  server.close();
  if (browser.disconnect) await browser.disconnect();
  else await browser.close();

  console.log('\n📁 Screenshots saved to:', SCREENSHOTS_DIR);
  console.log('📋 Required CWS dimensions: 1280x800 or 640x400');
  console.log('   If any screenshot failed, capture manually and place in docs/screenshots/');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
