const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots');
  const viewports = [
    { name: 'stage6-school-life-1440px', width: 1440, height: 960 },
    { name: 'stage6-school-life-1366px', width: 1366, height: 768 },
    { name: 'stage6-school-life-1024px', width: 1024, height: 768 },
    { name: 'stage6-school-life-768px', width: 768, height: 1024 },
    { name: 'stage6-school-life-390px', width: 390, height: 844 }
  ];
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  const hideChrome = 'header, .topbar, .site-header, .menu-toggle-btn { visibility: hidden !important; }';

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: hideChrome });
    await page.evaluate(() => document.querySelector('#school-life').scrollIntoView());
    await page.evaluate(() => Promise.all([...document.querySelectorAll('#school-life img')].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })));
    await new Promise(r => setTimeout(r, 1200));
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      sectionHeight: document.querySelector('#school-life').offsetHeight
    }));
    console.log(vp.name, metrics);
    const el = await page.$('#school-life');
    await el.screenshot({ path: path.join(outDir, `${vp.name}.png`) });

    // Switch to Music via click and capture
    await page.click('#sl-tab-music');
    await new Promise(r => setTimeout(r, 1500));
    await el.screenshot({ path: path.join(outDir, `${vp.name}-music.png`) });
  }

  // Keyboard + hash checks at desktop
  await page.setViewport({ width: 1440, height: 960 });
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
  await page.focus('#sl-tab-self');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const afterKeys = await page.evaluate(() => [document.activeElement.id, document.querySelector('.school-life-panel.is-active').id]);
  await page.evaluate(() => { window.location.hash = '#music'; });
  await new Promise(r => setTimeout(r, 300));
  const afterHash = await page.evaluate(() => document.querySelector('.school-life-panel.is-active').id);
  console.log('keyboard ->', afterKeys, '| #music ->', afterHash);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
