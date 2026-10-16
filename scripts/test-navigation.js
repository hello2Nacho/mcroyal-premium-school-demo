// Navigation behaviour test: desktop (1440, 1024) and drawer (768, 390).
const puppeteer = require('puppeteer-core');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  let fails = 0;
  const check = (label, ok, extra = '') => { if (!ok) fails++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  (' + extra + ')' : ''}`); };

  // Where does a target sit relative to the sticky header after navigation?
  const landing = (sel) => page.evaluate((s) => {
    const h = document.querySelector('.site-header').getBoundingClientRect().bottom;
    const t = document.querySelector(s).getBoundingClientRect().top;
    return Math.round(t - h);
  }, sel);
  const state = () => page.evaluate(() => ({
    open: [...document.querySelectorAll('.nav-dropdown')].filter(d => getComputedStyle(d).visibility === 'visible').map(d => d.id),
    active: [...document.querySelectorAll('.nav-desktop > .nav-item > .nav-link.is-active, .mobile-drawer .mobile-nav-link.is-active')].map(a => a.textContent.trim()),
    toast: (() => { const t = document.querySelector('.demo-toast.is-visible'); return t ? t.querySelector('.demo-toast-text').textContent : null; })(),
    tab: document.querySelector('.school-life-tab[aria-selected="true"]')?.id,
    drawerOpen: document.querySelector('.mobile-drawer').classList.contains('is-open'),
    scrollY: Math.round(window.scrollY)
  }));
  const fresh = async (w, h) => {
    await page.setViewport({ width: w, height: h, hasTouch: false, isMobile: false });
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
    await wait(400);
  };
  const hoverThenClick = async (parentSel, itemSel) => {
    await page.hover(parentSel); await wait(300);
    await page.click(itemSel); await wait(1600);
  };

  for (const [w, h] of [[1440, 900], [1024, 768]]) {
    console.log(`\n== ${w}px (desktop navigation)`);
    await fresh(w, h);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check('no horizontal overflow', sw === w, `scrollWidth=${sw}`);

    await page.hover('[aria-controls="dropdown-about"]'); await wait(300);
    check('hovering About opens its dropdown', (await state()).open.includes('dropdown-about'));

    await page.click('[aria-controls="dropdown-about"]'); await wait(1600);
    let s = await state(); let d = await landing('#about');
    check('clicking About scrolls to #about, clear of header', d >= 0 && d <= 20, `gap=${d}px`);
    check('About dropdown closes after click (pointer still over it)', !s.open.includes('dropdown-about'));
    check('About highlighted as active', s.active.includes('About'), s.active.join(','));

    await hoverThenClick('[aria-controls="dropdown-academics"]', '#dropdown-academics a[href="#secondary"]');
    s = await state(); d = await landing('#secondary');
    check('Academics → Secondary lands on #secondary', d >= 0 && d <= 20, `gap=${d}px`);
    check('dropdown closed after choosing item', s.open.length === 0, s.open.join(','));
    check('Academics highlighted while in Secondary', s.active.includes('Academics'), s.active.join(','));

    await hoverThenClick('[aria-controls="dropdown-academics"]', '#dropdown-academics a[href="#kindergarten"]');
    d = await landing('#kindergarten');
    check('Academics → Kindergarten clears header', d >= 0 && d <= 20, `gap=${d}px`);

    await hoverThenClick('[aria-controls="dropdown-school-life"]', '#dropdown-school-life a[href="#sports"]');
    s = await state(); d = await landing('#school-life');
    check('School Life → Sports opens Athletics tab', s.tab === 'sl-tab-athletics', s.tab);
    check('…and shows the School Life section', d >= -10 && d <= 40, `gap=${d}px`);
    await page.evaluate(() => document.querySelector('#sl-tab-self').click()); await wait(200);
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(900);
    await hoverThenClick('[aria-controls="dropdown-school-life"]', '#dropdown-school-life a[href="#sports"]');
    check('clicking Sports a second time still works', (await state()).tab === 'sl-tab-athletics');

    await hoverThenClick('[aria-controls="dropdown-school-life"]', '#dropdown-school-life a[href="#facilities"]');
    d = await landing('#facilities');
    check('School Life → Facilities lands on #facilities', d >= 0 && d <= 20, `gap=${d}px`);

    await hoverThenClick('[aria-controls="dropdown-about"]', '#dropdown-about a[href="#leadership"]');
    s = await state();
    check('About → Leadership shows demo notice', /coming soon/.test(s.toast || ''), s.toast);

    await page.click('.nav-desktop a[href="#contact"]'); await wait(1600);
    s = await state();
    check('Contact scrolls to footer + active', s.active.includes('Contact'), s.active.join(','));
    await page.click('.nav-desktop a[href="#"]'); await wait(1600);
    s = await state();
    check('Home returns to top + active', s.scrollY === 0 && s.active.includes('Home'), `y=${s.scrollY}`);

    // Keyboard
    await page.focus('[aria-controls="dropdown-academics"]');
    await page.keyboard.press('ArrowDown'); await wait(200);
    const kb = await page.evaluate(() => document.activeElement.getAttribute('href'));
    check('Keyboard: ArrowDown enters the Academics dropdown', kb === '#kindergarten', kb);
    await page.keyboard.press('Escape'); await wait(450); // fade-out is 220ms
    s = await state();
    check('Keyboard: Escape closes it', s.open.length === 0, s.open.join(','));
    await page.focus('[aria-controls="dropdown-admissions"]');
    await page.keyboard.press('Enter'); await wait(1600);
    d = await landing('#admissions');
    check('Keyboard: Enter on Admissions goes to #admissions', d >= 0 && d <= 20, `gap=${d}px`);
  }

  // Touch tablet at 1024 (no hover): tap 1 opens, tap 2 navigates
  console.log('\n== 1024px touch tablet');
  await page.setViewport({ width: 1024, height: 768, hasTouch: true, isMobile: false });
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' }); await wait(400);
  await page.tap('[aria-controls="dropdown-academics"]'); await wait(500);
  let s = await state();
  check('Tap 1 on Academics opens dropdown, stays put', s.open.includes('dropdown-academics') && s.scrollY === 0, `y=${s.scrollY}`);
  await page.tap('#dropdown-academics a[href="#primary"]'); await wait(1600);
  let d = await landing('#primary');
  check('Tapping Primary in the open dropdown navigates', d >= 0 && d <= 20, `gap=${d}px`);
  await page.evaluate(() => window.scrollTo(0, 0)); await wait(900);
  await page.tap('[aria-controls="dropdown-about"]'); await wait(400);
  await page.tap('[aria-controls="dropdown-about"]'); await wait(1600);
  d = await landing('#about');
  check('Tap 2 on About goes to #about', d >= 0 && d <= 20, `gap=${d}px`);

  for (const [w, h] of [[768, 1024], [390, 844]]) {
    console.log(`\n== ${w}px (drawer navigation)`);
    await page.setViewport({ width: w, height: h, hasTouch: true, isMobile: true });
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' }); await wait(400);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check('no horizontal overflow', sw === w, `scrollWidth=${sw}`);

    const openDrawer = async () => { await page.tap('.menu-toggle-btn'); await wait(500); };
    const expand = async (label) => {
      await page.evaluate((l) => [...document.querySelectorAll('.mobile-accordion-toggle')].find(b => b.getAttribute('aria-label').includes(l)).click(), label);
      await wait(400);
    };

    await openDrawer();
    await page.tap('.mobile-drawer a.mobile-nav-link[href="#about"]'); await wait(1600);
    s = await state(); d = await landing('#about');
    check('Drawer About closes drawer + lands on #about', !s.drawerOpen && d >= 0 && d <= 20, `gap=${d}px`);
    check('Body scroll restored', await page.evaluate(() => document.body.style.overflow === ''));

    await openDrawer(); await expand('Academics');
    await page.tap('.mobile-drawer a[href="#primary"]'); await wait(1600);
    d = await landing('#primary');
    check('Drawer Academics → Primary lands on #primary', d >= 0 && d <= 20, `gap=${d}px`);

    await openDrawer(); await expand('School Life');
    await page.tap('.mobile-drawer a[href="#music"]'); await wait(1600);
    s = await state();
    check('Drawer School Life → Music opens Music tab', !s.drawerOpen && s.tab === 'sl-tab-music', s.tab);

    await openDrawer(); await expand('About');
    await page.tap('.mobile-drawer a[href="#philosophy"]'); await wait(400);
    s = await state();
    check('Drawer Philosophy closes drawer + demo notice', !s.drawerOpen && /coming soon/.test(s.toast || ''), s.toast);

    await openDrawer();
    await page.tap('.mobile-drawer a.mobile-nav-link[href="#contact"]'); await wait(1600);
    s = await state();
    check('Drawer Contact → footer, Contact active', s.active.includes('Contact'), s.active.join(','));
  }

  console.log(`\n${fails === 0 ? 'ALL PASSED' : fails + ' FAILED'}`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
