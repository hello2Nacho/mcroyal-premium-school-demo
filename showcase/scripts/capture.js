// Captures portfolio screenshots of the site at desktop and mobile sizes.
// Usage: node scripts/capture.js [baseUrl]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = path.join(__dirname, '..', 'screens');
const RAW = path.join(__dirname, '..', 'raw');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(RAW, { recursive: true });

// Every candidate section; the three strongest are chosen after review.
const SECTIONS = [
  'how-we-learn', 'about', 'admissions', 'school-life', 'academics',
  'facilities', 'our-staff', 'secondary', 'graduation', 'primary', 'contact'
];

const HIDE_SCROLLBARS = `
  html { scrollbar-width: none !important; scroll-behavior: auto !important; }
  ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  *, *::before, *::after { caret-color: transparent !important; }
  /* The closed drawer sits off-canvas but its shadow bleeds onto the right edge. */
  .mobile-drawer:not(.is-open) { visibility: hidden !important; box-shadow: none !important; }
`;

// Every stylesheet must have loaded; a dropped request leaves a section unstyled.
async function stylesOk(page) {
  return page.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].every(l => {
    try { return l.sheet && l.sheet.cssRules.length > 0; } catch (e) { return true; } // cross-origin fonts
  }));
}

async function prepare(page) {
  for (let attempt = 1; ; attempt++) {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    if (await stylesOk(page)) break;
    if (attempt === 3) throw new Error('Stylesheets failed to load after 3 attempts');
  }
  await page.addStyleTag({ content: HIDE_SCROLLBARS });
  await page.evaluate(() => document.fonts.ready);
  // Freeze the hero video on a well-composed frame so every capture matches.
  await page.evaluate(async () => {
    const v = document.querySelector('.hero-video-element');
    if (!v) return;
    v.pause();
    if (v.readyState < 1) await new Promise(r => v.addEventListener('loadedmetadata', r, { once: true }));
    v.currentTime = 1.5;
    await new Promise(r => v.addEventListener('seeked', r, { once: true }));
  });
  // Force lazy images to load and wait for every image to decode.
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(i => (i.loading = 'eager'));
    await Promise.all([...document.images].map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = i.onerror = r; })));
  });
  // Scroll every section into view so reveal animations finish, then return to top.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 300) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

async function sectionShot(page, id, file) {
  await page.evaluate(id => {
    const el = document.getElementById(id);
    const header = document.querySelector('.site-header');
    const offset = header ? header.getBoundingClientRect().height : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo(0, Math.max(0, top));
  }, id);
  await page.waitForTimeout(700);
  await page.screenshot({ path: file });
}

async function run(label, viewport, scale, browser) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: label === 'mobile', hasTouch: label === 'mobile' });
  const page = await ctx.newPage();
  await prepare(page);
  await page.screenshot({ path: path.join(OUT, `${label}-hero.png`) });
  for (const id of SECTIONS) {
    await sectionShot(page, id, path.join(RAW, `${label}-${id}.png`));
  }

  // Data the video needs: section offsets, page height, topbar height, and the
  // sticky header in its scrolled state.
  const meta = await page.evaluate(ids => {
    const header = document.querySelector('.site-header');
    const hr = header.getBoundingClientRect();
    return {
      pageHeight: document.documentElement.scrollHeight,
      headerTop: hr.top + window.scrollY,
      headerHeight: hr.height,
      sections: Object.fromEntries(ids.map(id => [id, document.getElementById(id).getBoundingClientRect().top + window.scrollY]))
    };
  }, SECTIONS);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
  const hb = await page.locator('.site-header').boundingBox();
  await page.screenshot({ path: path.join(RAW, `${label}-header-scrolled.png`), clip: { x: 0, y: hb.y, width: viewport.width, height: hb.height } });
  fs.writeFileSync(path.join(RAW, `${label}-meta.json`), JSON.stringify(meta, null, 2));

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(label === 'desktop' ? OUT : RAW, `${label}-fullpage.png`), fullPage: true });
  await ctx.close();
}

if (require.main === module) (async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  await run('desktop', { width: 1440, height: 900 }, 2, browser);
  await run('mobile', { width: 390, height: 844 }, 3, browser);
  await browser.close();
  console.log('done');
})();

module.exports = { prepare, sectionShot, HIDE_SCROLLBARS };
