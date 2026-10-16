// End-to-end test of the demo admissions portal (/admissions).
// Usage: node scripts/test-admissions-portal.js [path/to/test/files]
const puppeteer = require('puppeteer-core');
const path = require('path');
const FILES = process.argv[2] || path.join(__dirname, 'fixtures');
const BASE = 'http://localhost:3000';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  const offsite = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { const u = r.url(); if (!u.startsWith(BASE) && !/fonts\.(googleapis|gstatic)\.com/.test(u) && !u.startsWith('data:') && !u.startsWith('blob:')) offsite.push(u); });
  let fails = 0;
  const check = (label, ok, extra = '') => { if (!ok) fails++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${extra !== '' ? '  (' + extra + ')' : ''}`); };
  const txt = (sel) => page.$eval(sel, e => e.textContent.trim()).catch(() => null);
  const visible = (sel) => page.$eval(sel, e => !e.closest('[hidden]') && getComputedStyle(e).display !== 'none').catch(() => false);
  const step = () => txt('[data-progress-count]');
  const next = async () => { await page.click('[data-action="next"]'); await wait(450); };
  const errorsShown = () => page.$$eval('.portal-form .field-error', els => els.filter(e => !e.closest('[hidden]')).map(e => e.textContent));
  await page.setViewport({ width: 1440, height: 900 });

  /* 1. Every Apply CTA on the homepage opens /admissions */
  console.log('\n== Homepage Apply links');
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  const applies = await page.$$eval('a', as => as.filter(a => /apply/i.test(a.textContent) || a.classList.contains('admissions-cta')).map(a => ({ t: a.textContent.trim().replace(/\s+/g, ' '), href: a.getAttribute('href'), demo: a.dataset.demoMessage || null })));
  applies.forEach(a => check(`"${a.t}" → ${a.href}`, a.href === '/admissions' && !a.demo));
  const ext = await page.$$eval('a[href]', as => as.filter(a => /^(https?:)?\/\//.test(a.getAttribute('href')) || /mcroyalschools\.com/.test(a.getAttribute('href')) && !a.dataset.demoMessage).length);
  check('no external / MC Royal links on homepage', ext === 0, ext);
  for (const [label, sel, w] of [['Header Apply Now', '.btn-apply-header', 1440], ['Hero Apply Now', '.hero-video-cta-primary', 1440], ['Admissions section CTA', '.admissions-cta', 1440], ['Footer Apply Now', '.footer-apply-link', 1440], ['Mobile drawer Apply Now', '.mobile-drawer-footer .btn-primary', 390]]) {
    await page.setViewport({ width: w, height: 900 });
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    if (w === 390) { await page.click('.menu-toggle-btn'); await wait(500); }
    await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click(sel)]);
    check(`${label} opens the portal`, new URL(page.url()).pathname.replace(/\/$/, '') === '/admissions', page.url());
  }

  /* 2. Landing */
  console.log('\n== Landing');
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/admissions', { waitUntil: 'networkidle0' });
  check('heading', (await txt('#landing-heading')) === 'Begin Your Application');
  check('session from config', (await txt('[data-school="admissions.session"]')) === '2026 / 2027 Academic Session');
  check('levels from config', (await txt('[data-school="admissions.levels"]')) === 'Nursery · Primary · College');
  check('school name in header from config', (await txt('.portal-brand-name')) === 'MC Royal Schools');
  check('Back to Website → /', (await page.$eval('.portal-back', a => a.getAttribute('href'))) === '/');
  await page.screenshot({ path: 'screenshots/portal-landing-1440px.png' });

  /* 3. Step 1 validation + fill */
  console.log('\n== Step 01 Student');
  await page.click('[data-action="start"]'); await wait(450);
  check('form opens on step 1', (await step()) === 'Step 1 of 5');
  await next();
  let errs = await errorsShown();
  check('empty Continue shows inline errors (no alert)', errs.length === 6, errs.length + ' of 6 required fields');
  check('focus moves to first invalid field', (await page.evaluate(() => document.activeElement.id)) === 'f-firstName');
  check('errors linked via aria-describedby', await page.$eval('#f-firstName', e => (e.getAttribute('aria-describedby') || '').includes('f-firstName-error') && e.getAttribute('aria-invalid') === 'true'));
  await page.type('#f-firstName', 'Amara1');
  await page.type('#f-lastName', 'Okafor');
  await page.$eval('#f-dob', e => { e.value = '2040-01-01'; e.dispatchEvent(new Event('change', { bubbles: true })); });
  await next();
  errs = await errorsShown();
  check('name with digit rejected', errs.some(e => /letters only/.test(e)));
  check('future date of birth rejected', errs.some(e => /future/.test(e)));
  await page.$eval('#f-firstName', e => { e.value = ''; });
  await page.type('#f-firstName', 'Amara');
  await page.$eval('#f-dob', e => { e.value = '2015-03-12'; e.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.click('input[name="gender"][value="Female"]');
  await page.select('#f-classApplying', 'Primary 5');
  await page.type('#f-nationality', 'Nigerian');
  await page.type('#f-currentSchool', 'Bright Steps Academy');
  const passportInput = await page.$('#doc-passport-compact');
  await passportInput.uploadFile(path.join(FILES, 'passport.jpg')); await wait(900);
  check('passport attached in step 1 (filename shown)', (await txt('.upload--compact .upload-file-name')) === 'passport.jpg');
  check('upload marked demo-only', /demo only, not uploaded/.test(await txt('.upload--compact .upload-status') || ''));
  await next();
  check('valid step 1 advances to step 2', (await step()) === 'Step 2 of 5');

  /* 4. Step 2 */
  console.log('\n== Step 02 Parent / Guardian');
  await page.type('#f-parentName', 'Ngozi Okafor');
  await page.select('#f-relationship', 'Mother');
  await page.type('#f-phone', '12345');
  await page.type('#f-email', 'ngozi@');
  await page.type('#f-address', 'Lagos');
  await next();
  errs = await errorsShown();
  check('bad phone rejected', errs.some(e => /phone/.test(e)));
  check('bad email rejected', errs.some(e => /email/.test(e)));
  check('short address rejected', errs.some(e => /full address/.test(e)));
  await page.$eval('#f-phone', e => { e.value = ''; }); await page.type('#f-phone', '0803 123 4567');
  await page.$eval('#f-email', e => { e.value = ''; }); await page.type('#f-email', 'ngozi.okafor@example.com');
  await page.$eval('#f-address', e => { e.value = ''; }); await page.type('#f-address', '12 Example Close, Ikeja, Lagos');
  await page.screenshot({ path: 'screenshots/portal-step2-1440px.png' });
  await next();
  check('step 2 → step 3', (await step()) === 'Step 3 of 5');

  /* 5. Back button keeps data */
  await page.click('[data-action="back"]'); await wait(450);
  check('Back returns to step 2 with data kept', (await step()) === 'Step 2 of 5' && (await page.$eval('#f-parentName', e => e.value)) === 'Ngozi Okafor');
  await next();

  /* 6. Step 3 — class applying synced from step 1 */
  console.log('\n== Step 03 Academic');
  check('class applying carried over from step 1', (await page.$eval('#f-classApplying3', e => e.value)) === 'Primary 5');
  await page.select('#f-currentClass', 'Primary 4');
  await page.select('#f-entryTerm', '2026 / 2027 — First Term');
  await page.type('#f-notes', 'Enjoys reading and choir.');
  check('character counter updates', (await txt('[data-count-for="notes"]')) === '25');
  await next();
  check('step 3 → step 4', (await step()) === 'Step 4 of 5');

  /* 7. Step 4 — uploads */
  console.log('\n== Step 04 Documents');
  check('passport from step 1 shown in documents', (await txt('[data-upload-list] .upload[data-doc="passport"] .upload-file-name')) === 'passport.jpg');
  const bc = await page.$('#doc-birthCertificate');
  await bc.uploadFile(path.join(FILES, 'birth-certificate.pdf')); await wait(900);
  check('birth certificate attached', (await txt('.upload[data-doc="birthCertificate"] .upload-file-name')) === 'birth-certificate.pdf');
  check('file type + size shown', /PDF · 13 B/.test(await txt('.upload[data-doc="birthCertificate"] .upload-file-meta') || ''));
  const pr = await page.$('#doc-previousResult');
  await pr.uploadFile(path.join(FILES, 'big.pdf')); await wait(300);
  check('oversized file rejected with message', /larger than 5 MB/.test(await txt('.upload[data-doc="previousResult"] .field-error') || ''));
  await pr.uploadFile(path.join(FILES, 'notes.txt')); await wait(300);
  check('wrong file type rejected', /isn’t accepted/.test(await txt('.upload[data-doc="previousResult"] .field-error') || ''));
  await page.screenshot({ path: 'screenshots/portal-step4-1440px.png' });
  await page.click('.upload[data-doc="birthCertificate"] .upload-remove'); await wait(300);
  check('remove button clears the file', !(await visible('.upload[data-doc="birthCertificate"] .upload-file')));
  await bc.uploadFile(path.join(FILES, 'birth-certificate.pdf')); await wait(900);
  await next();
  check('step 4 → review', (await step()) === 'Step 5 of 5');

  /* 8. Review + Edit */
  console.log('\n== Step 05 Review');
  const review = await txt('[data-review]');
  check('review shows student name', review.includes('Amara Okafor'));
  check('review shows formatted date of birth', review.includes('12 March 2015'));
  check('review shows parent email', review.includes('ngozi.okafor@example.com'));
  check('review lists attached documents', review.includes('birth-certificate.pdf') && review.includes('Not attached'));
  check('every section has Edit', (await page.$$('[data-review] .review-edit')).length === 4);
  await page.screenshot({ path: 'screenshots/portal-review-1440px.png', fullPage: true });
  await page.click('[data-review] .review-edit[aria-label^="Edit Parent"]'); await wait(450);
  check('Edit jumps to step 2', (await step()) === 'Step 2 of 5');
  check('button reads "Save and return to review"', (await txt('[data-next-label]')) === 'Save and return to review');
  await page.$eval('#f-phone', e => { e.value = ''; }); await page.type('#f-phone', '+234 803 765 4321');
  await next();
  check('returns straight to review after edit', (await step()) === 'Step 5 of 5' && (await txt('[data-review]')).includes('+234 803 765 4321'));

  /* 9. Submit */
  await next();
  check('submit blocked until confirmation ticked', /confirm/.test((await errorsShown()).join(' ')));
  await page.click('.portal-confirm-label'); await wait(150);
  await next(); await wait(300);
  console.log('\n== Success');
  check('success screen shown', (await txt('#success-heading')) === 'Application Received');
  const ref = await txt('[data-success="reference"]');
  check('demo reference generated', /^MCR-2026-\d{4}$/.test(ref), ref);
  check('applicant name shown', (await txt('[data-success="name"]')) === 'Amara Okafor');
  check('status Received', (await txt('.portal-receipt .portal-status')) === 'Received');
  await page.screenshot({ path: 'screenshots/portal-success-1440px.png' });
  await page.reload({ waitUntil: 'networkidle0' }); await wait(300);
  check('refresh keeps the success screen', await visible('#success-heading'));
  await page.click('[data-action="summary"]'); await wait(450);
  check('View Application Summary', (await txt('[data-summary-title]')) === 'Amara Okafor' && (await page.$$('[data-summary] .review-edit')).length === 0);
  await page.click('[data-action="back-to-success"]'); await wait(300);
  await page.click('.portal-success-new'); await wait(450);
  check('Start new application → empty step 1', (await step()) === 'Step 1 of 5' && (await page.$eval('#f-firstName', e => e.value)) === '');

  /* 10. Start-new confirmation dialog when there is unsaved progress */
  await page.type('#f-firstName', 'Tobi');
  await wait(300);
  await page.click('.portal-progress-meta [data-action="new"]'); await wait(300);
  check('confirmation dialog opens', await page.$eval('[data-dialog]', d => d.open));
  await page.keyboard.press('Escape'); await wait(200);
  check('Escape closes dialog, data kept', !(await page.$eval('[data-dialog]', d => d.open)) && (await page.$eval('#f-firstName', e => e.value)) === 'Tobi');

  /* 11. Browser Back moves between steps */
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/admissions', { waitUntil: 'networkidle0' });
  await page.click('[data-action="start"]'); await wait(400);
  await page.goBack(); await wait(400);
  check('browser Back from step 1 returns to landing (stays in portal)', await visible('#landing-heading') && new URL(page.url()).pathname.startsWith('/admissions'));

  /* 12. Keyboard + reduced motion */
  console.log('\n== Keyboard + reduced motion');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/admissions', { waitUntil: 'networkidle0' });
  const anim = await page.$eval('[data-screen="landing"]', e => getComputedStyle(e).animationName);
  check('reduced motion: no screen animation', anim === 'none', anim);
  const order = [];
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => (document.activeElement.textContent || document.activeElement.className).trim().replace(/\s+/g, ' ').slice(0, 24))); }
  check('tab order starts with skip link, brand, back link, Start', order[0].startsWith('Skip') && order.some(t => t.startsWith('Start Application')), order.join(' | '));
  await page.focus('[data-action="start"]'); await page.keyboard.press('Enter'); await wait(200);
  check('Enter on Start opens form; focus on step title', (await page.evaluate(() => document.activeElement.textContent)) === 'Tell us about the student');
  await page.keyboard.press('Tab');
  check('next Tab reaches first name field', (await page.evaluate(() => document.activeElement.id)) === 'f-firstName');
  await page.emulateMediaFeatures([]);

  console.log('\nJS errors:', errors.length ? errors : 'none');
  console.log('Off-site requests:', offsite.length ? offsite : 'none');
  if (errors.length || offsite.length) fails++;
  console.log(`\n${fails === 0 ? 'ALL PASSED' : fails + ' FAILED'}`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
