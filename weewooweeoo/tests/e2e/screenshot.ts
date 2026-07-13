import puppeteer from 'puppeteer';

async function main() {
  const browser = await (puppeteer as any).connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null,
  });

  const pages = await browser.pages();
  console.log(`Found ${pages.length} tabs:`);
  for (let i = 0; i < pages.length; i++) {
    const title = await pages[i].title().catch(() => '???');
    console.log(`  [${i}] "${title.slice(0, 60)}" — ${pages[i].url().slice(0, 80)}`);
  }

  // Use the example.com tab
  const page = pages.find((p: any) => p.url().includes('example.com')) || pages[pages.length - 1];
  console.log('\nUsing tab:', await page.title());

  // Check extension injection
  const state = await page.evaluate(() => {
    const host = document.querySelector('weewoo-wheel');
    const wheel = host?.shadowRoot?.querySelector('[aria-label="WeeWoo Wheel"]');
    const buttons = host?.shadowRoot?.querySelectorAll('[role="menuitem"]');
    return {
      hostExists: !!host,
      wheelVisible: !!wheel,
      buttonCount: buttons?.length || 0,
      buttonLabels: Array.from(buttons || []).map(b => b.textContent?.trim()),
    };
  });
  console.log('Extension state:', JSON.stringify(state, null, 2));

  // Take screenshot
  await page.screenshot({ path: '/tmp/weewoo-user-view.png' });
  console.log('\nScreenshot saved: /tmp/weewoo-user-view.png');
}

main().catch(err => { console.error(err); process.exit(1); });
