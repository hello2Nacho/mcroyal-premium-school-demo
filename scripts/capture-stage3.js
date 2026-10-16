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

  // 1. Desktop 1440px
  console.log('Capturing Stage 3 Desktop 1440px...');
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/index.html#how-we-learn', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Hover over row 1 to capture the refined subtle interaction
  await page.hover('.value-row:first-child');
  await new Promise(r => setTimeout(r, 500));

  const desktopPathLocal = path.join(screenshotsDir, 'stage3-values-1440px.png');
  const desktopPathArtifact = path.join(artifactsDir, 'stage3-values-1440px.png');
  await page.screenshot({ path: desktopPathLocal, fullPage: false });
  fs.copyFileSync(desktopPathLocal, desktopPathArtifact);

  // 2. Tablet 768px
  console.log('Capturing Stage 3 Tablet 768px...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/index.html#how-we-learn', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const tabletPathLocal = path.join(screenshotsDir, 'stage3-values-768px.png');
  const tabletPathArtifact = path.join(artifactsDir, 'stage3-values-768px.png');
  await page.screenshot({ path: tabletPathLocal, fullPage: false });
  fs.copyFileSync(tabletPathLocal, tabletPathArtifact);

  // 3. Mobile 390px
  console.log('Capturing Stage 3 Mobile 390px...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/index.html#how-we-learn', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const mobilePathLocal = path.join(screenshotsDir, 'stage3-values-390px.png');
  const mobilePathArtifact = path.join(artifactsDir, 'stage3-values-390px.png');
  await page.screenshot({ path: mobilePathLocal, fullPage: false });
  fs.copyFileSync(mobilePathLocal, mobilePathArtifact);

  await browser.close();
  console.log('All Stage 3 screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
