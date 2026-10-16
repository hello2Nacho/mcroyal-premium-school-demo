const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const artifactsDir = '/Users/mac/.gemini/antigravity/brain/a2184a51-2405-48b7-94c6-7e7fd4e15539';

  const filePath = 'file://' + path.join(__dirname, '..', 'video-hero.html');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Desktop 1440px x 900px
  console.log('Capturing Video Hero Desktop 1440px...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  const desktopPathLocal = path.join(screenshotsDir, 'video-hero-1440px.png');
  const desktopPathArtifact = path.join(artifactsDir, 'video-hero-1440px.png');
  await page.screenshot({ path: desktopPathLocal, fullPage: false });
  fs.copyFileSync(desktopPathLocal, desktopPathArtifact);

  // 2. Tablet 768px x 1024px
  console.log('Capturing Video Hero Tablet 768px...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  const tabletPathLocal = path.join(screenshotsDir, 'video-hero-768px.png');
  const tabletPathArtifact = path.join(artifactsDir, 'video-hero-768px.png');
  await page.screenshot({ path: tabletPathLocal, fullPage: false });
  fs.copyFileSync(tabletPathLocal, tabletPathArtifact);

  // 3. Mobile 390px x 844px
  console.log('Capturing Video Hero Mobile 390px...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  const mobilePathLocal = path.join(screenshotsDir, 'video-hero-390px.png');
  const mobilePathArtifact = path.join(artifactsDir, 'video-hero-390px.png');
  await page.screenshot({ path: mobilePathLocal, fullPage: false });
  fs.copyFileSync(mobilePathLocal, mobilePathArtifact);

  await browser.close();
  console.log('All Video Hero prototype screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
