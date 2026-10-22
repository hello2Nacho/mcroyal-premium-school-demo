// Slices the full-page captures into tiles Remotion can load (Chrome caps very
// tall bitmaps) and writes the layout data the scroll animation needs.
const sharp = require('sharp');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const TILE = 4000;
fs.mkdirSync(PUB, { recursive: true });

async function slice(src, prefix) {
  const img = sharp(src, { limitInputPixels: false });
  const { width, height } = await img.metadata();
  const tiles = [];
  for (let top = 0, i = 0; top < height; top += TILE, i++) {
    const h = Math.min(TILE, height - top);
    const name = `${prefix}-tile-${i}.png`;
    await sharp(src, { limitInputPixels: false }).extract({ left: 0, top, width, height: h }).png().toFile(path.join(PUB, name));
    tiles.push({ src: name, height: h });
  }
  return { width, height, tiles };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const topbar = {};
  for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(process.argv[2] || 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    topbar[label] = await page.evaluate(() => document.querySelector('.site-header').getBoundingClientRect().top);
    await page.close();
  }
  await browser.close();

  const out = {};
  for (const [label, src, scale] of [
    ['desktop', path.join(ROOT, 'screens', 'desktop-fullpage.png'), 2],
    ['mobile', path.join(ROOT, 'raw', 'mobile-fullpage.png'), 3]
  ]) {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'raw', `${label}-meta.json`)));
    const sliced = await slice(src, label);
    fs.copyFileSync(path.join(ROOT, 'raw', `${label}-header-scrolled.png`), path.join(PUB, `${label}-header-scrolled.png`));
    out[label] = { ...sliced, scale, topbar: topbar[label], headerHeight: meta.headerHeight, sections: meta.sections, pageHeight: meta.pageHeight };
  }
  fs.writeFileSync(path.join(ROOT, 'src', 'layout.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, (k, v) => (k === 'tiles' ? v.length : v)));
})();
