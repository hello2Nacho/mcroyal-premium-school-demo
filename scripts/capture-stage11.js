const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots');
  const viewports = [
    { name: 'stage11-graduation-1440px', width: 1440, height: 960 },
    { name: 'stage11-graduation-1366px', width: 1366, height: 768 },
    { name: 'stage11-graduation-1024px', width: 1024, height: 768 },
    { name: 'stage11-graduation-768px', width: 768, height: 1024 },
    { name: 'stage11-graduation-390px', width: 390, height: 844 }
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
    await page.evaluate(() => document.querySelector('#graduation').scrollIntoView());
    await page.evaluate(() => Promise.all([...document.querySelectorAll('#graduation img')].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })));
    await new Promise(r => setTimeout(r, 1200));
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      sectionHeight: document.querySelector('#graduation').offsetHeight
    }));
    console.log(vp.name, metrics);
    const el = await page.$('#graduation');
    await el.screenshot({ path: path.join(outDir, `${vp.name}.png`) });
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
