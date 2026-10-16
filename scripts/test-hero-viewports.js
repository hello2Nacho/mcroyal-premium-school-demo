const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function testViewports() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const artifactsDir = '/Users/mac/.gemini/antigravity/brain/a2184a51-2405-48b7-94c6-7e7fd4e15539';

  const viewports = [
    { name: 'hero-1440x900', width: 1440, height: 900 },
    { name: 'hero-1366x768', width: 1366, height: 768 },
    { name: 'hero-1024x768', width: 1024, height: 768 },
    { name: 'hero-768x1024', width: 768, height: 1024 },
    { name: 'hero-390x844', width: 390, height: 844 }
  ];

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();

  for (const vp of viewports) {
    console.log(`Testing viewport ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Check measurements
    const metrics = await page.evaluate(() => {
      const hero = document.querySelector('.hero-video-section');
      const header = document.querySelector('.site-header');
      const topbar = document.querySelector('.topbar');
      const body = document.body;
      const docEl = document.documentElement;

      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const headerRect = header ? header.getBoundingClientRect() : null;
      const topbarRect = (topbar && window.getComputedStyle(topbar).display !== 'none') ? topbar.getBoundingClientRect() : null;

      const hasHorizontalScroll = docEl.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth;

      return {
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
        heroWidth: heroRect ? heroRect.width : 0,
        heroHeight: heroRect ? heroRect.height : 0,
        topbarHeight: topbarRect ? topbarRect.height : 0,
        headerHeight: headerRect ? headerRect.height : 0,
        hasHorizontalScroll,
        scrollWidth: docEl.scrollWidth
      };
    });

    console.log(`  Metrics for ${vp.name}:`, metrics);

    const localPath = path.join(screenshotsDir, `${vp.name}.png`);
    const artifactPath = path.join(artifactsDir, `${vp.name}.png`);
    await page.screenshot({ path: localPath, fullPage: false });
    fs.copyFileSync(localPath, artifactPath);
  }

  await browser.close();
  console.log('All viewports captured and tested successfully!');
}

testViewports().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
