const puppeteer = require('puppeteer-core');
const path = require('path');

async function extractPoster() {
  const posterPath = path.join(__dirname, '..', 'assets', 'images', 'hero-video-poster.jpg');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background:#000; overflow:hidden;">
        <video id="vid" src="http://localhost:3000/assets/videos/mcroyal-hero-1080p.mp4" muted autoplay playsinline loop style="width:100vw; height:100vh; object-fit:cover;"></video>
      </body>
    </html>
  `;

  await page.setContent(html);
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: posterPath, type: 'jpeg', quality: 90 });
  await browser.close();
  console.log('Poster generated successfully via http at:', posterPath);
}

extractPoster().catch(err => {
  console.error('Poster extraction error:', err);
});
