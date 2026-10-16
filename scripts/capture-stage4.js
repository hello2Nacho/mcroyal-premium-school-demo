const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureStage4() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const artifactsDir = '/Users/mac/.gemini/antigravity/brain/a2184a51-2405-48b7-94c6-7e7fd4e15539';

  const viewports = [
    { name: 'stage4-about-1440px', width: 1440, height: 960 },
    { name: 'stage4-about-1366px', width: 1366, height: 768 },
    { name: 'stage4-about-1024px', width: 1024, height: 768 },
    { name: 'stage4-about-768px', width: 768, height: 1024 },
    { name: 'stage4-about-390px', width: 390, height: 844 }
  ];

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();

  for (const vp of viewports) {
    console.log(`Capturing Stage 4 for ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/index.html#about', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Measure metrics
    const metrics = await page.evaluate(() => {
      const about = document.querySelector('#about');
      const docEl = document.documentElement;
      const rect = about ? about.getBoundingClientRect() : null;

      return {
        windowWidth: window.innerWidth,
        scrollWidth: docEl.scrollWidth,
        hasHorizontalScroll: docEl.scrollWidth > window.innerWidth,
        aboutTop: rect ? rect.top : 0,
        aboutHeight: rect ? rect.height : 0
      };
    });

    console.log(`  Metrics for ${vp.name}:`, metrics);

    const localPath = path.join(screenshotsDir, `${vp.name}.png`);
    const artifactPath = path.join(artifactsDir, `${vp.name}.png`);
    await page.screenshot({ path: localPath, fullPage: false });
    fs.copyFileSync(localPath, artifactPath);
  }

  await browser.close();
  console.log('All Stage 4 screenshots captured successfully!');
}

captureStage4().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
