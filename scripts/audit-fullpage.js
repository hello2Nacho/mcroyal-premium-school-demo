// Whole-page QA pass: full-page screenshots + overflow, anchors, headings, images.
const puppeteer = require('puppeteer-core');
const path = require('path');
const outDir = path.join(__dirname, '..', 'screenshots');
const widths = [[1440, 960], [1366, 768], [1024, 768], [768, 1024], [390, 844]];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  for (const [w, h] of widths) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
    // reveal-on-scroll content + lazy images
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      await Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); }));
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 800));
    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const over = [...document.querySelectorAll('body *')].filter(el => {
        const r = el.getBoundingClientRect();
        if (!r.width) return false;
        // ignore elements inside an overflow-clipping ancestor
        let p = el.parentElement;
        while (p && p !== document.body) { const s = getComputedStyle(p); if (/hidden|clip|auto|scroll/.test(s.overflowX)) return false; p = p.parentElement; }
        return r.right > vw + 1 || r.left < -1;
      }).map(el => el.tagName.toLowerCase() + '.' + [...el.classList].join('.')).slice(0, 10);
      const sections = [...document.querySelectorAll('main > section, footer')].map(s => {
        const cs = getComputedStyle(s);
        return `${s.id || s.className.split(' ')[0]} h=${s.offsetHeight} pt=${cs.paddingTop} pb=${cs.paddingBottom} bg=${cs.backgroundColor}`;
      });
      return { scrollWidth: document.documentElement.scrollWidth, vw, over, sections };
    });
    console.log(`\n== ${w}px scrollWidth=${m.scrollWidth} vw=${m.vw} overflowing=${JSON.stringify(m.over)}`);
    if (w === 1440 || w === 390) m.sections.forEach(s => console.log('  ' + s));
    await page.screenshot({ path: path.join(outDir, `audit-full-${w}px.png`), fullPage: true });
  }

  // anchors, headings, images (at 1440)
  await page.setViewport({ width: 1440, height: 960 });
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
  const r = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
      .filter(h => h.startsWith('#') || !/^(https?:|mailto:|tel:)/.test(h));
    const broken = [...new Set(anchors)].filter(h => h.startsWith('#') ? !document.getElementById(h.slice(1)) : h !== 'index.html');
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(x => x.tagName + ' ' + x.textContent.trim().slice(0, 50));
    const imgs = [...document.images].map(i => {
      const r = i.getBoundingClientRect();
      return `${i.getAttribute('src')} nat=${i.naturalWidth}x${i.naturalHeight} attr=${i.getAttribute('width')}x${i.getAttribute('height')} loading=${i.getAttribute('loading')} top=${Math.round(r.top + scrollY)} rendered=${Math.round(r.width)}x${Math.round(r.height)}`;
    });
    return { broken, headings, imgs };
  });
  console.log('\nBROKEN ANCHORS', r.broken);
  console.log('\nHEADINGS\n' + r.headings.join('\n'));
  console.log('\nIMAGES\n' + r.imgs.join('\n'));
  await browser.close();
})();
