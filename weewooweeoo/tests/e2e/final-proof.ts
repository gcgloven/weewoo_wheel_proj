import puppeteer from 'puppeteer';
async function main() {
  const browser = await (puppeteer as any).connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await browser.newPage();
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.evaluate(() => { const s = document.createElement('div'); s.style.height = '350px'; document.body.insertBefore(s, document.body.firstChild); });
  await page.evaluate(() => {
    const p = document.querySelector('p');
    if (!p) return;
    const range = document.createRange(); range.selectNodeContents(p);
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges(); sel.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 1500));
  const btnBox = await page.evaluate(() => {
    const host = document.querySelector('weewoo-wheel');
    const btn = host?.shadowRoot?.querySelector('[role="menuitem"]');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (!btnBox) { console.log('Wheel not visible, retry'); await page.close(); return; }
  await page.mouse.click(btnBox.x, btnBox.y);
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: '/tmp/weewoo-working.png' });
  const panel = await page.evaluate(() => {
    const host = document.querySelector('weewoo-wheel');
    const alert = host?.shadowRoot?.querySelector('[role="alert"]');
    return alert ? alert.textContent.slice(0, 120) : 'NO PANEL';
  });
  console.log('PANEL AFTER REAL CLICK:', panel);
  console.log('Screenshot: /tmp/weewoo-working.png');
  await page.close();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
