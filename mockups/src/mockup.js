// Builds the mockup compositions. Scene and background come from the query
// string: ?scene=a|b|c|d&transparent=1
const params = new URLSearchParams(location.search);
const SCENE = params.get('scene') || 'a';
const TRANSPARENT = params.get('transparent') === '1';

const A = '../assets/';
const SHOTS = {
  laptop: A + 'laptop-hero.png',
  hero: { src: A + 'phone-hero.png', indicator: '#fff' },
  about: { src: A + 'phone-about.png', indicator: 'rgba(15,23,42,0.85)' },
  life: { src: A + 'phone-school-life.png', indicator: 'transparent' },
  facilities: { src: A + 'phone-facilities.png', indicator: 'rgba(15,23,42,0.85)' }
};

function el(tag, cls, style = {}, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  Object.assign(e.style, style);
  if (parent) parent.appendChild(e);
  return e;
}
const px = n => `${n}px`;

// MacBook Pro, front view. W = lid width. Returns the root and its total height.
function macbook(W, shot) {
  const side = W * 0.013, top = W * 0.017, bottom = W * 0.02;
  const sw = W - side * 2, sh = sw / 1.6;
  const lidH = top + sh + bottom;
  const baseW = W * 1.08, baseH = W * 0.022, hingeH = W * 0.006;
  const root = el('div', 'mbp', { width: px(baseW), height: px(lidH + hingeH + baseH) });
  root.style.setProperty('--lid-r', px(W * 0.018));
  const lid = el('div', 'lid', { left: px((baseW - W) / 2), width: px(W), height: px(lidH) }, root);
  const screen = el('div', 'screen', { left: px(side), top: px(top), width: px(sw), height: px(sh), borderRadius: px(W * 0.006) }, lid);
  el('img', 'shot', { top: 0, height: '100%', objectFit: 'cover' }, screen).src = shot;
  const nW = W * 0.085, nH = W * 0.0155;
  el('div', 'notch', { left: px(side + (sw - nW) / 2), top: px(top - 1), width: px(nW), height: px(nH + 1), borderRadius: `0 0 ${px(nH * 0.45)} ${px(nH * 0.45)}` }, lid);
  el('div', 'hinge', { left: px((baseW - W * 0.86) / 2), top: px(lidH), width: px(W * 0.86), height: px(hingeH + 2) }, root);
  const base = el('div', 'base', { left: 0, top: px(lidH + hingeH), width: px(baseW), height: px(baseH) }, root);
  el('div', 'lip', { width: px(W * 0.15), height: px(baseH * 0.32) }, base);
  return { root, height: lidH + hingeH + baseH, width: baseW };
}

// iPhone 15 Pro. sw = screen width in px; proportions follow the 393pt device.
function iphone(sw, shot) {
  const u = sw / 393; // px per point
  const frame = 4.5 * u, bezel = 6.5 * u;
  const sh = sw * 844 / 390;
  const W = sw + 2 * (frame + bezel), H = sh + 2 * (frame + bezel);
  const root = el('div', 'iphone', { width: px(W), height: px(H) });
  root.style.setProperty('--outer-r', px(62 * u));
  root.style.setProperty('--bezel-r', px(57.5 * u));
  root.style.setProperty('--screen-r', px(51 * u));

  // Side buttons sit just outside the titanium band.
  const btn = (side, y, h) => el('div', 'btn', { [side]: px(-2.2 * u), top: px(y * u), width: px(3.2 * u), height: px(h * u) }, root);
  btn('left', 116, 22); btn('left', 162, 44); btn('left', 218, 44); btn('right', 190, 72);

  el('div', 'frame', {}, root);
  const bz = el('div', 'bezel', { left: px(frame), top: px(frame), right: px(frame), bottom: px(frame) }, root);
  const screen = el('div', 'screen', { left: px(bezel), top: px(bezel), width: px(sw), height: px(sh) }, bz);

  const sb = 47 * sw / 390; // status bar height, matches the 390x797 captures
  const bar = el('div', 'statusbar', { height: px(sb), padding: `0 ${px(30 * u)} 0 ${px(38 * u)}`, fontSize: px(16.5 * u) }, screen);
  el('span', '', { paddingTop: px(4 * u) }, bar).textContent = '9:41';
  const icons = el('div', 'icons', { gap: px(6 * u), paddingTop: px(4 * u) }, bar);
  icons.innerHTML = `
    <svg width="${18 * u}" height="${12 * u}" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#0F172A"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#0F172A"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#0F172A"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0F172A"/></svg>
    <svg width="${16 * u}" height="${12 * u}" viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0L8 11.5Z M3.4 6.8a6.5 6.5 0 0 1 9.2 0l-1.4 1.4a4.5 4.5 0 0 0-6.4 0L3.4 6.8Z M1.2 4.6a9.6 9.6 0 0 1 13.6 0l-1.4 1.4a7.6 7.6 0 0 0-10.8 0L1.2 4.6Z" fill="#0F172A"/></svg>
    <svg width="${26 * u}" height="${12.5 * u}" viewBox="0 0 26 12.5"><rect x="0.5" y="0.5" width="22" height="11.5" rx="3.6" fill="none" stroke="#0F172A" stroke-opacity="0.4"/><rect x="2" y="2" width="19" height="8.5" rx="2.3" fill="#0F172A"/><path d="M24 4.3v4a2 2 0 0 0 0-4Z" fill="#0F172A" fill-opacity="0.45"/></svg>`;

  el('img', 'shot', { top: px(sb), height: px(sh - sb) }, screen).src = shot.src;
  const island = el('div', 'island', { top: px(11 * u), width: px(125 * u), height: px(36.5 * u) }, screen);
  el('div', 'cam', { right: px(13 * u), width: px(11 * u), height: px(11 * u) }, island);
  el('div', 'home-indicator', { bottom: px(8 * u), width: px(134 * u), height: px(5 * u), background: shot.indicator }, screen);
  return { root, width: W, height: H };
}

function place(node, x, y, extra = {}) {
  Object.assign(node.style, { left: px(x), top: px(y) }, extra);
  document.body.appendChild(node);
}

function groundShadow(cx, y, w, h, alpha) {
  el('div', 'ground-shadow', {
    left: px(cx - w / 2), top: px(y - h / 2), width: px(w), height: px(h),
    background: `radial-gradient(50% 50% at 50% 50%, rgba(20,8,30,${alpha}) 0%, rgba(20,8,30,${alpha * 0.45}) 45%, rgba(20,8,30,0) 100%)`
  }, document.body);
}

const PHONE_SHADOW = 'drop-shadow(0 6px 10px rgba(20,8,30,0.22)) drop-shadow(0 30px 50px rgba(20,8,30,0.30)) drop-shadow(0 70px 90px rgba(20,8,30,0.22))';
const LAPTOP_SHADOW = 'drop-shadow(0 10px 18px rgba(20,8,30,0.20)) drop-shadow(0 50px 80px rgba(20,8,30,0.22))';

function sceneLaptopPhone(bgClass) {
  if (!TRANSPARENT) el('div', 'stage ' + bgClass, {}, document.body);
  const mb = macbook(2000, SHOTS.laptop);
  const mx = (3200 - mb.width) / 2 - 90, my = (2000 - mb.height) / 2 - 30;
  groundShadow(mx + mb.width / 2, my + mb.height + 6, mb.width * 1.02, 90, 0.42);
  place(mb.root, mx, my, { filter: LAPTOP_SHADOW });
  const ph = iphone(430, SHOTS.hero);
  const px0 = mx + mb.width - 330, py0 = my + mb.height + 60 - ph.height;
  groundShadow(px0 + ph.width / 2, py0 + ph.height + 4, ph.width * 1.15, 60, 0.45);
  place(ph.root, px0, py0, { filter: PHONE_SHADOW });
}

function sceneTrio() {
  el('div', 'stage bg-dark', {}, document.body);
  const shots = [SHOTS.life, SHOTS.hero, SHOTS.about];
  const sw = 560, gap = 160;
  const phones = shots.map(s => iphone(sw, s));
  const W = phones[0].width, H = phones[0].height;
  const total = W * 3 + gap * 2;
  phones.forEach((p, i) => {
    const raised = i === 1 ? -110 : 0;
    const x = (3200 - total) / 2 + i * (W + gap);
    const y = (2000 - H) / 2 + 50 + raised;
    groundShadow(x + W / 2, (2000 - H) / 2 + 50 + H + 70, W * 1.25, 70, 0.55);
    place(p.root, x, y, { filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.45)) drop-shadow(0 80px 120px rgba(0,0,0,0.35))' });
  });
}

// Angled 3D MacBook with an iPhone leaning beside it.
function scene3D() {
  if (!TRANSPARENT) el('div', 'stage bg-brand', {}, document.body);
  // Floor shadows drawn in screen space (3D floor planes flatten poorly).
  const blob = (cx, cy, w, h, deg, a, blur) => el('div', '', {
    position: 'absolute', left: px(cx - w / 2), top: px(cy - h / 2), width: px(w), height: px(h), borderRadius: '50%',
    background: `rgba(20,8,30,${a})`, filter: `blur(${blur}px)`, transform: `rotate(${deg}deg)`
  }, document.body);
  blob(1520, 1600, 2500, 900, -14, 0.24, 90);
  blob(1680, 1710, 1750, 190, -14, 0.38, 40);
  blob(2590, 1385, 470, 80, -8, 0.45, 18);
  const view = el('div', '', { position: 'absolute', inset: 0, perspective: '5200px', perspectiveOrigin: '50% 20%' }, document.body);
  const world = el('div', '', { position: 'absolute', left: '1420px', top: '1430px', width: 0, height: 0, transformStyle: 'preserve-3d', transform: 'rotateX(-14deg) rotateY(28deg)' }, view);
  const face = (w, h, transform, style = {}) => el('div', '', Object.assign({ position: 'absolute', left: px(-w / 2), top: px(-h / 2), width: px(w), height: px(h), transform, backfaceVisibility: 'hidden' }, style), world);

  const W = 1560, D = 1080, T = 30; // base width, depth, thickness
  const alu = 'linear-gradient(180deg, #E9EBEE 0%, #CDD0D5 100%)';
  // Base deck (top surface) with keyboard well and trackpad.
  const deck = face(W, D, `translate3d(0, ${-T}px, 0) rotateX(90deg)`, { background: 'linear-gradient(90deg, #D7D9DD 0%, #E6E8EB 50%, #D3D5D9 100%)', borderRadius: '28px' });
  const kb = el('div', '', {
    position: 'absolute', left: px(W * 0.12), top: px(D * 0.07), width: px(W * 0.76), height: px(D * 0.43), borderRadius: '14px',
    background: '#1A1B1F', padding: px(W * 0.008), display: 'grid', gridTemplateColumns: 'repeat(28, 1fr)', gridTemplateRows: '0.6fr repeat(5, 1fr)', gap: px(W * 0.005)
  }, deck);
  // Six rows of keys; spans add up to 28 columns per row.
  const rows = [
    [3, ...Array(12).fill(2), 1],
    Array(14).fill(2),
    [3, ...Array(12).fill(2), 1],
    [4, ...Array(11).fill(2), 2],
    [5, ...Array(10).fill(2), 3],
    [2, 2, 2, 3, 10, 3, 2, 2, 2]
  ];
  rows.forEach(r => r.forEach(span => el('div', '', {
    gridColumn: `span ${span}`, borderRadius: px(W * 0.003),
    background: 'linear-gradient(180deg, #2E2F35 0%, #26272C 100%)', boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
  }, kb)));
  el('div', '', { position: 'absolute', left: px(W * 0.08), top: px(D * 0.08), width: px(W * 0.03), height: px(D * 0.42), borderRadius: '8px', background: 'radial-gradient(circle, #8E9197 1.5px, transparent 2px) 0 0 / 12px 12px' }, deck);
  el('div', '', { position: 'absolute', right: px(W * 0.08), top: px(D * 0.08), width: px(W * 0.03), height: px(D * 0.42), borderRadius: '8px', background: 'radial-gradient(circle, #8E9197 1.5px, transparent 2px) 0 0 / 12px 12px' }, deck);
  el('div', '', { position: 'absolute', left: px(W * 0.31), top: px(D * 0.56), width: px(W * 0.38), height: px(D * 0.36), borderRadius: '18px', background: 'linear-gradient(180deg, #D0D3D8 0%, #C8CBD0 100%)', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.06)' }, deck);
  // Front, left and right edges of the base.
  face(W, T, `translate3d(0, ${-T / 2}px, ${D / 2}px)`, { background: 'linear-gradient(180deg, #C4C7CC 0%, #8C8F95 100%)', borderRadius: '0 0 14px 14px' });
  face(D, T, `translate3d(${-W / 2}px, ${-T / 2}px, 0) rotateY(-90deg)`, { background: 'linear-gradient(180deg, #B5B8BD 0%, #7E8187 100%)' });
  face(D, T, `translate3d(${W / 2}px, ${-T / 2}px, 0) rotateY(90deg)`, { background: 'linear-gradient(180deg, #B5B8BD 0%, #7E8187 100%)' });

  // Lid: hinged at the back edge of the deck, tilted back 14 degrees.
  const LW = W * 0.97, side = LW * 0.013, top = LW * 0.017, bottom = LW * 0.02;
  const sw = LW - side * 2, sh = sw / 1.6, LH = top + sh + bottom;
  const lid = el('div', '', {
    position: 'absolute', left: px(-LW / 2), top: px(-LH), width: px(LW), height: px(LH),
    transformOrigin: '50% 100%', transform: `translate3d(0, ${-T}px, ${-D / 2 + 20}px) rotateX(-14deg)`,
    background: '#0A0A0C', borderRadius: `${px(LW * 0.018)} ${px(LW * 0.018)} 10px 10px`, boxShadow: '0 0 0 4px #B9BCC2', backfaceVisibility: 'hidden'
  }, world);
  const screen = el('div', 'screen', { left: px(side), top: px(top), width: px(sw), height: px(sh), borderRadius: px(LW * 0.006) }, lid);
  el('img', 'shot', { top: 0, height: '100%' }, screen).src = SHOTS.laptop;
  const nW = LW * 0.085, nH = LW * 0.0155;
  el('div', '', { position: 'absolute', background: '#0A0A0C', left: px(side + (sw - nW) / 2), top: px(top - 1), width: px(nW), height: px(nH + 1), borderRadius: `0 0 ${px(nH * 0.45)} ${px(nH * 0.45)}`, zIndex: 2 }, lid);
  // Lid back (aluminium) so the edge reads when seen at an angle.
  el('div', '', {
    position: 'absolute', left: px(-LW / 2), top: px(-LH), width: px(LW), height: px(LH),
    transformOrigin: '50% 100%', transform: `translate3d(0, ${-T}px, ${-D / 2 + 8}px) rotateX(-14deg) rotateY(180deg)`,
    background: alu, borderRadius: `${px(LW * 0.018)} ${px(LW * 0.018)} 10px 10px`, backfaceVisibility: 'hidden'
  }, world);

  // iPhone leaning against an invisible stand to the right of the laptop.
  const ph = iphone(400, SHOTS.hero);
  const holder = el('div', '', {
    position: 'absolute', left: px(-ph.width / 2), top: px(-ph.height), width: px(ph.width), height: px(ph.height),
    transformOrigin: '50% 100%', transformStyle: 'preserve-3d',
    transform: `translate3d(${W / 2 + 330}px, 0, ${D / 2 - 160}px) rotateY(-34deg) rotateX(-11deg)`
  }, world);
  ph.root.style.left = '0'; ph.root.style.top = '0';
  holder.appendChild(ph.root);
  // Titanium thickness on the visible long edge.
  el('div', '', { position: 'absolute', left: px(-11), top: px(30), width: '22px', height: px(ph.height - 60), transform: 'rotateY(90deg)', background: 'linear-gradient(90deg, #6F6B66, #CFCBC5, #77736E)', borderRadius: '11px' }, holder);
}

if (TRANSPARENT) document.body.classList.add('transparent');
if (SCENE === 'a') sceneLaptopPhone('bg-brand');
if (SCENE === 'b') sceneLaptopPhone('bg-studio');
if (SCENE === 'c') sceneTrio();
if (SCENE === 'd') scene3D();

window.__ready = Promise.all([...document.images].map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = i.onerror = r; })));
