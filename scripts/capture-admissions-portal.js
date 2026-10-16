// Responsive captures of the admissions portal at the five review widths.
const puppeteer = require('puppeteer-core');
const path = require('path');
const BASE = 'http://localhost:3000';
const out = path.join(__dirname, '..', 'screenshots');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const sizes = [[1440, 900], [1366, 768], [1024, 768], [768, 1024], [390, 844]];

// A completed demo application, written straight into localStorage
const filled = (screen, step) => JSON.stringify({
  screen, step, furthest: 5, editingFromReview: false,
  reference: screen === 'success' ? 'MCR-2026-0001' : null,
  data: { firstName: 'Amara', lastName: 'Okafor', dob: '2015-03-12', gender: 'Female', classApplying: 'Primary 5', nationality: 'Nigerian', currentSchool: 'Bright Steps Academy',
    parentName: 'Ngozi Okafor', relationship: 'Mother', phone: '0803 123 4567', email: 'ngozi.okafor@example.com', address: '12 Example Close, Ikeja, Lagos',
    currentClass: 'Primary 4', entryTerm: '2026 / 2027 — First Term', notes: 'Enjoys reading and choir.' },
  docs: { passport: { name: 'passport.jpg', size: 3828, ext: 'jpg' }, birthCertificate: { name: 'birth-certificate.pdf', size: 182340, ext: 'pdf' } }
});

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const report = [];
  for (const [w, h] of sizes) {
    const mobile = w < 768;
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const shots = [
      ['landing', null],
      ['step1-errors', JSON.stringify({ screen: 'form', step: 1, furthest: 1, data: {}, docs: {} })],
      ['step4', filled('form', 4)],
      ['review', filled('form', 5)],
      ['success', filled('success', 5)]
    ];
    const overflow = [];
    for (const [name, stored] of shots) {
      await page.goto(BASE + '/admissions', { waitUntil: 'networkidle0' });
      await page.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem('school-demo-admissions', s); }, stored);
      await page.reload({ waitUntil: 'networkidle0' });
      if (name === 'step1-errors') { await page.click('[data-action="next"]'); }
      await wait(700);
      overflow.push(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
      await page.screenshot({ path: path.join(out, `portal-${name}-${w}px.png`), fullPage: true });
    }
    // Smallest touch target among visible buttons, links and fields
    const minTarget = await page.evaluate(() => Math.min(...[...document.querySelectorAll('button, a, input:not([type=file]):not([type=radio]):not([type=checkbox]), select, .field-choice, .portal-confirm-label')]
      .filter(el => el.offsetParent && !el.closest('[hidden]') && !el.classList.contains('portal-skip') && getComputedStyle(el).position !== 'absolute')
      .map(el => Math.round(el.getBoundingClientRect().height))));
    report.push(`${w}x${h}  horizontal overflow per screen: ${overflow.join(', ')}  | smallest tap target on success screen: ${minTarget}px`);
  }
  console.log(report.join('\n'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
