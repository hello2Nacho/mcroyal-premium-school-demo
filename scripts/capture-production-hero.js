const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const artifactsDir = '/Users/mac/.gemini/antigravity/brain/a2184a51-2405-48b7-94c6-7e7fd4e15539';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();

  // Test across responsive matrix
  const viewports = [
    { name: 'video-hero-1440px.png', width: 1440, height: 900, isPrimary: true },
    { name: 'video-hero-1280px.png', width: 1280, height: 800, isPrimary: false },
    { name: 'video-hero-1024px.png', width: 1024, height: 768, isPrimary: false },
    { name: 'video-hero-768px.png', width: 768, height: 1024, isPrimary: true },
    { name: 'video-hero-430px.png', width: 430, height: 932, isPrimary: false },
    { name: 'video-hero-390px.png', width: 390, height: 844, isPrimary: true },
    { name: 'video-hero-375px.png', width: 375, height: 667, isPrimary: false }
  ];

  for (const vp of viewports) {
    console.log(`Capturing ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
    // Let video/frame render smoothly
    await new Promise(r => setTimeout(r, 1200));

    const localPath = path.join(screenshotsDir, vp.name);
    await page.screenshot({ path: localPath, fullPage: false });

    if (vp.isPrimary) {
      const artifactPath = path.join(artifactsDir, vp.name);
      fs.copyFileSync(localPath, artifactPath);
    }
  }

  await browser.close();
  console.log('Production hero capture complete!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
