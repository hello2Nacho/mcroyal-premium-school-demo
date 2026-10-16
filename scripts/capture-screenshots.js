const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const filePath = 'file://' + path.join(__dirname, '..', 'index.html');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Desktop 1440px x 900px
  console.log('Capturing Desktop 1440px...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-1440px.png'), fullPage: false });

  // 2. Tablet 768px x 1024px
  console.log('Capturing Tablet 768px...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotsDir, 'tablet-768px.png'), fullPage: false });

  // 3. Mobile 390px x 844px (Standard iPhone 12/13/14 viewport)
  console.log('Capturing Mobile 390px...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile-390px.png'), fullPage: false });

  // 4. Mobile Above-the-fold specific capture (390px x 844px)
  console.log('Capturing Mobile Above the Fold 390px...');
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile-hero-above-fold-390px.png'), fullPage: false });

  await browser.close();
  console.log('All hero screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
