const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots');
  const viewports = [
    { name: 'stage5-admissions-1440px', width: 1440, height: 960 },
    { name: 'stage5-admissions-1366px', width: 1366, height: 768 },
    { name: 'stage5-admissions-1024px', width: 1024, height: 768 },
    { name: 'stage5-admissions-768px', width: 768, height: 1024 },
    { name: 'stage5-admissions-390px', width: 390, height: 844 }
  ];
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
    // Scroll through the section so every reveal triggers, then settle
    const top = await page.evaluate(() => document.querySelector('#admissions').getBoundingClientRect().top + window.scrollY);
    const h = await page.evaluate(() => document.querySelector('#admissions').offsetHeight);
    for (let y = top - vp.height; y < top + h; y += 200) {
      await page.evaluate(v => window.scrollTo(0, v), y);
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 2200));
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      sectionHeight: document.querySelector('#admissions').offsetHeight,
      ctaSameRow: (() => { const a = document.querySelector('.admissions-cta').getBoundingClientRect(), b = document.querySelector('.admissions-link').getBoundingClientRect(); return Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)) < 4; })(),
      ctaWidth: Math.round(document.querySelector('.admissions-cta').getBoundingClientRect().width),
      hidden: [...document.querySelectorAll('.adm-reveal')].filter(e => !e.classList.contains('is-visible')).length
    }));
    console.log(vp.name, metrics);
    await page.addStyleTag({ content: 'header, .topbar, .site-header, .menu-toggle-btn { visibility: hidden !important; }' });
    const el = await page.$('#admissions');
    await el.screenshot({ path: path.join(outDir, `${vp.name}.png`) });
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
