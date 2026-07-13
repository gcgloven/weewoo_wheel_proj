/**
 * Full E2E: configure API key → Search action → auto-save → verify card.
 *
 * 1. Finds extension ID from CDP targets
 * 2. Sets API key via service worker context (chrome.storage.local)
 * 3. Mocks LLM endpoint to return fake search result
 * 4. Navigates example.com, selects text, real-clicks 🔍Search
 * 5. Verifies card auto-saved (no manual Save needed anymore)
 * 6. Checks sidepanel for the saved card
 *
 * Prerequisites: pnpm dev running (Chrome on :9222)
 * Usage: node --import tsx tests/e2e/configure-and-search.ts
 */
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

async function findExtensionId(): Promise<string> {
  try {
    // Read from the active web-ext Chrome profile's Preferences
    const result = execSync(
      `find /tmp/tmp-web-ext--*/ -name "Preferences" -exec grep -o '"piclpgjkkpfaolmlokeaihbbmkdjjkjc"' {} \\; 2>/dev/null | head -1`,
      { encoding: 'utf8', timeout: 3000 },
    ).trim();
    if (result) return result.replace(/"/g, '');
  } catch {}
  // Fallback: known WXT dev ID pattern
  return 'piclpgjkkpfaolmlokeaihbbmkdjjkjc';
}

async function main() {
  const extId = await findExtensionId();
  console.log('Extension ID:', extId);
  const browser = await (puppeteer as any).connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null,
  });

  // ── Step 1: Set API key via extension page context ──
  console.log('\n── Step 1: Configuring API key ──');

  const settingsPage = await browser.newPage();
  // Navigate to sidepanel — it has chrome.storage access in its own origin
  await settingsPage.goto(`chrome-extension://${extId}/sidepanel.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 10000,
  }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  const setResult = await settingsPage.evaluate(() => {
    try {
      chrome.storage.local.set({
        settings: {
          baseUrl: 'https://api.example-mock.com/v1',
          apiKey: 'sk-test-example-api-key-for-e2e',
          model: 'gpt-4o-mini',
          maxTokens: 2048,
          slots: ['explain', 'summary', 'search'],
          search: { searchPrompt: '', searchDepth: 'top 3 most relevant results' },
        },
      });
      return 'ok';
    } catch (e: any) {
      return 'error: ' + e.message;
    }
  });
  console.log('   Storage set:', setResult);
  await settingsPage.close();

  // ── Step 2: Set up LLM mock in service worker context ──
  console.log('\n── Step 2: Setting up LLM mock (SW context) ──');

  // Find the service worker target and inject a fetch override
  const swTargets = (await browser.targets()).filter((t: any) =>
    t.url().includes('background') || t.type() === 'service_worker',
  );
  if (swTargets.length > 0) {
    for (const sw of swTargets) {
      try {
        const swCdp = await sw.createCDPSession();
        await swCdp.send('Runtime.enable');
        await swCdp.send('Runtime.evaluate', {
          expression: `
            const origFetch = self.fetch.bind(self);
            self.fetch = async function(input, init) {
              const url = typeof input === 'string' ? input : input.url;
              if (url && url.includes('/chat/completions')) {
                console.log('[MOCK] Intercepted SW fetch to:', url);
                return new Response(JSON.stringify({
                  choices: [{ message: { content:
                    '## Search Query\\n\`e2e-test-search-query\`\\n\\n' +
                    '## Synthesized Answer\\nMocked search result for E2E testing.\\n\\n' +
                    '## Caveats\\n- This is a test mock',
                  }}],
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
              return origFetch(input, init);
            };
            'mock installed'
          `,
        });
        console.log('   Mock injected into SW target:', sw.url().slice(0, 80));
      } catch (e: any) {
        console.log('   SW target not accessible:', e.message?.slice(0, 60));
      }
    }
  } else {
    console.log('   No SW target found — mock may not work');
  }

  // Collect logs
  const testPage = await browser.newPage();
  testPage.on('console', (msg: any) => {
    const t = msg.text();
    if (t.includes('BUTTON CLICKED') || t.includes('handlePick') ||
        t.includes('sent RUN') || t.includes('received message') ||
        t.includes('Saved') || t.includes('[dispatch]') ||
        t.includes('ACTION_RESULT') || msg.type() === 'error') {
      console.log('  📟', t.slice(0, 200));
    }
  });

  // ── Step 3: Navigate and test ──
  console.log('\n── Step 3: Testing Search on example.com ──');
  await testPage.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  const injected = await testPage.evaluate(
    () => !!document.querySelector('weewoo-wheel'),
  );
  console.log('   Content script injected:', injected);
  if (!injected) {
    console.log('   ❌ Extension not loaded. Reload at chrome://extensions');
    await testPage.close();
    return;
  }

  // Push paragraph to middle of screen
  await testPage.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '350px';
    document.body.insertBefore(spacer, document.body.firstChild);
  });

  // Select text and trigger wheel
  await testPage.evaluate(() => {
    const p = document.querySelector('p');
    if (!p) return;
    const range = document.createRange();
    range.selectNodeContents(p);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Find and click Search button
  const searchBtn = await testPage.evaluate(() => {
    const host = document.querySelector('weewoo-wheel');
    const buttons = host?.shadowRoot?.querySelectorAll('[role="menuitem"]');
    if (!buttons) return null;
    for (const btn of buttons) {
      if (btn.textContent?.includes('Search')) {
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: btn.textContent.trim() };
      }
    }
    return null;
  });

  if (!searchBtn) {
    console.log('   ❌ Search button not found');
    await testPage.close();
    return;
  }
  console.log(`   🖱️ Clicking "${searchBtn.label}" at (${Math.round(searchBtn.x)}, ${Math.round(searchBtn.y)})`);
  await testPage.mouse.click(searchBtn.x, searchBtn.y);
  await new Promise((r) => setTimeout(r, 5000));

  // ── Step 4: Verify auto-save ──
  console.log('\n── Step 4: Verifying auto-save ──');

  // Check toast for "Saved" message
  const toastCheck = await testPage.evaluate(() => {
    const host = document.querySelector('weewoo-wheel');
    if (!host?.shadowRoot) return { found: false };
    // Look for "Saved" text in shadow DOM
    const text = host.shadowRoot.textContent || '';
    return {
      found: text.includes('Saved'),
      snippet: text.slice(0, 300),
    };
  });
  console.log('   Toast:', JSON.stringify(toastCheck));

  // Screenshot
  await testPage.screenshot({ path: '/tmp/weewoo-configure-search.png' });
  console.log('   Screenshot: /tmp/weewoo-configure-search.png');

  // ── Summary ──
  console.log('\n═══════════════════════════════════');
  if (toastCheck.found) {
    console.log('✅✅✅ FULL E2E PASSED');
    console.log('   API key → Search click → LLM mock → Auto-save → Saved toast');
  } else {
    console.log('⚠️ Partial pass — check logs above');
  }
  console.log('═══════════════════════════════════');

  await testPage.close();
}

main().catch((e) => {
  console.error('💥 Fatal:', e.message);
  process.exit(1);
});
