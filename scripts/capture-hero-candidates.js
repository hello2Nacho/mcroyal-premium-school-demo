const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureHeroPass() {
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

  // 1. Desktop Candidate A (005.jpeg - All-School Multi-grade Student Community)
  console.log('Capturing Desktop Hero Candidate A (005.jpeg)...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const img = document.getElementById('hero-img');
    if (img) img.src = 'assets/images/005.jpeg';
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotsDir, 'hero-candidate-a-desktop.png'), fullPage: false });
  await page.screenshot({ path: path.join(screenshotsDir, 'desktop-1440px.png'), fullPage: false });

  // 2. Desktop Candidate B (058.jpeg - Active Classroom Learning & Academic Engagement)
  console.log('Capturing Desktop Hero Candidate B (058.jpeg)...');
  await page.evaluate(() => {
    const img = document.getElementById('hero-img');
    if (img) {
      img.src = 'assets/images/058.jpeg';
      img.style.objectPosition = 'center 40%';
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotsDir, 'hero-candidate-b-desktop.png'), fullPage: false });

  // 3. Desktop Candidate C (028.jpeg - Secondary College Students & Campus Environment)
  console.log('Capturing Desktop Hero Candidate C (028.jpeg)...');
  await page.evaluate(() => {
    const img = document.getElementById('hero-img');
    if (img) {
      img.src = 'assets/images/028.jpeg';
      img.style.objectPosition = 'center 30%';
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotsDir, 'hero-candidate-c-desktop.png'), fullPage: false });

  // Reset back to Candidate A for responsive breakpoints
  await page.evaluate(() => {
    const img = document.getElementById('hero-img');
    if (img) {
      img.src = 'assets/images/005.jpeg';
      img.style.objectPosition = 'center 25%';
    }
  });

  // 4. Tablet 768px (Selected Candidate A)
  console.log('Capturing Tablet 768px...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotsDir, 'tablet-768px.png'), fullPage: false });

  // 5. Mobile 390px (Selected Candidate A)
  console.log('Capturing Mobile 390px...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotsDir, 'mobile-390px.png'), fullPage: false });

  await browser.close();
  console.log('All hero refinement screenshots captured successfully!');
}

captureHeroPass().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
