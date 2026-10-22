// Mobile captures sized for the iPhone mockup: the 390x844 screen minus the
// 47pt status bar, so each shot fills the area under the status bar exactly.
const { chromium } = require('playwright');
const path = require('path');
const { prepare, sectionShot } = require('./capture');

const OUT = path.join(__dirname, '..', 'raw');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await prepare(page);
  await page.screenshot({ path: path.join(OUT, 'phone-hero.png') });
  for (const id of ['about', 'school-life', 'facilities']) {
    await sectionShot(page, id, path.join(OUT, `phone-${id}.png`));
  }
  await browser.close();
  console.log('done');
})();
