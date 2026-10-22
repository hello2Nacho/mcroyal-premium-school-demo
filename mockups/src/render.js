// Renders each mockup scene to a 3200x2000 PNG and a 1920px-wide WebP.
// Run from the showcase folder's node_modules: node ../mockups/src/render.js
const path = require('path');
const { chromium } = require(path.join(__dirname, '../../showcase/node_modules/playwright'));
const sharp = require(path.join(__dirname, '../../showcase/node_modules/sharp'));

const OUT = path.join(__dirname, '..', 'output');
const PAGE = 'file://' + path.join(__dirname, 'mockup.html');
const JOBS = [
  ['a', false, 'mockup-a-macbook-iphone-brand'],
  ['b', false, 'mockup-b-macbook-iphone-studio'],
  ['c', false, 'mockup-c-three-iphones-dark'],
  ['d', false, 'mockup-d-macbook-3d-iphone'],
  ['a', true, 'mockup-e-macbook-iphone-transparent'],
  ['d', true, 'mockup-e-macbook-3d-iphone-transparent']
];

(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 3200, height: 2000 }, deviceScaleFactor: 1 });
  for (const [scene, transparent, name] of JOBS) {
    if (only && !name.includes(only)) continue;
    await page.goto(`${PAGE}?scene=${scene}${transparent ? '&transparent=1' : ''}`);
    await page.evaluate(() => window.__ready);
    await page.waitForTimeout(300);
    const png = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: png, omitBackground: transparent });
    await sharp(png).resize({ width: 1920 }).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(OUT, `${name}-1920.webp`));
    console.log(name);
  }
  await browser.close();
})();
