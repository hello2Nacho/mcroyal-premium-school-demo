import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { Background } from './Background';
import layout from './layout.json';

export const URL_TEXT = 'mcroyal.school.org';

const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Builds a list of { frame, scroll } keyframes. Holds are flat segments,
// moves ease in and out. Ends back on the hero so the loop is seamless.
export function buildTimeline({ device, viewportCss, durationInFrames, stops, intro, hold, returnFrames, outro }) {
  const L = layout[device];
  const maxScroll = L.pageHeight - viewportCss;
  const header = L.headerHeight;
  const targets = stops.map(s => (s === 'end' ? maxScroll : Math.min(maxScroll, Math.max(0, L.sections[s] - header))));
  const dists = targets.map((t, i) => Math.abs(t - (i === 0 ? 0 : targets[i - 1])));
  const sumD = dists.reduce((a, b) => a + b, 0);
  const settle = L.topbar > 0 ? 12 : 0; // frames to reveal the top bar after the crossfade
  const moveBudget = durationInFrames - intro - hold * targets.length - returnFrames - settle - outro;
  const n = targets.length;
  const keys = [{ frame: 0, scroll: 0 }, { frame: intro, scroll: 0 }];
  let f = intro;
  let prev = 0;
  targets.forEach((t, i) => {
    const dur = Math.round(moveBudget * (0.5 / n + (0.5 * dists[i]) / sumD));
    f += dur;
    keys.push({ frame: f, scroll: t, ease: true });
    f += hold;
    keys.push({ frame: f, scroll: t });
    prev = t;
  });
  // The return to the hero is a crossfade (see Showcase), not a scroll. It
  // lands with the top bar scrolled away so the sticky header lines up in
  // both layers, then eases the top bar back into view.
  keys.push({ frame: f + 1, scroll: L.topbar, returnFrom: prev, returnStart: f });
  f += returnFrames;
  keys.push({ frame: f, scroll: L.topbar, returnEnd: true });
  if (settle) {
    f += settle;
    keys.push({ frame: f, scroll: 0, ease: true });
  }
  keys.push({ frame: durationInFrames, scroll: 0 });
  return keys;
}

function scrollAt(keys, frame) {
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.frame) {
      if (b.frame === a.frame) return b.scroll;
      return interpolate(frame, [a.frame, b.frame], [a.scroll, b.scroll], { easing: b.ease ? easeInOut : undefined, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    }
  }
  return keys[keys.length - 1].scroll;
}

const Dots = ({ size }) => (
  <div style={{ display: 'flex', gap: size * 0.7 }}>
    {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
      <div key={c} style={{ width: size, height: size, borderRadius: '50%', background: c, boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)' }} />
    ))}
  </div>
);

export const BrowserWindow = ({ width, contentHeight, ui = 1, children }) => {
  const bar = Math.round(44 * ui);
  return (
    <div
      style={{
        width,
        borderRadius: 14,
        background: '#fff',
        overflow: 'hidden',
        boxShadow: `0 1px 2px rgba(32,14,44,0.10), 0 6px 12px rgba(32,14,44,0.10), 0 18px 36px rgba(32,14,44,0.14), 0 40px 80px rgba(32,14,44,0.20), 0 80px 140px rgba(32,14,44,0.24)`
      }}
    >
      <div style={{ height: bar, display: 'flex', alignItems: 'center', padding: `0 ${16 * ui}px`, background: '#fff', borderBottom: '1px solid #EEF0F4', position: 'relative' }}>
        <Dots size={12 * ui} />
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            height: 28 * ui, minWidth: 300 * ui, padding: `0 ${18 * ui}px`, borderRadius: 999, background: '#F3F1F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 * ui,
            fontFamily: '"Plus Jakarta Sans", -apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: 14 * ui, fontWeight: 500, color: '#3D3450', letterSpacing: 0.1
          }}
        >
          <svg width={12 * ui} height={12 * ui} viewBox="0 0 24 24" fill="none" stroke="#6B3E8C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          {URL_TEXT}
        </div>
      </div>
      <div style={{ height: contentHeight, position: 'relative', overflow: 'hidden', background: '#fff' }}>{children}</div>
    </div>
  );
};

export const Page = ({ device, contentWidth, scrollCss, blur = 0 }) => {
  const L = layout[device];
  const k = contentWidth / (L.width / L.scale); // screen px per CSS px
  const pxScale = contentWidth / L.width; // screen px per image px
  let y = 0;
  const headerY = Math.max(0, L.topbar - scrollCss);
  const showHeader = scrollCss > L.topbar + 0.5;
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, width: contentWidth, transform: `translateY(${-scrollCss * k}px)`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
        {L.tiles.map(t => {
          const top = y;
          y += t.height * pxScale;
          return <Img key={t.src} src={staticFile(t.src)} style={{ position: 'absolute', left: 0, top, width: contentWidth, height: t.height * pxScale + 0.5, display: 'block' }} />;
        })}
      </div>
      {showHeader && (
        <Img
          src={staticFile(`${device}-header-scrolled.png`)}
          style={{ position: 'absolute', left: 0, top: headerY * k, width: contentWidth, height: L.headerHeight * k, boxShadow: '0 4px 20px -2px rgba(15,23,42,0.08)' }}
        />
      )}
    </>
  );
};

export const Showcase = ({ device, windowWidth, contentHeight, ui, stops, intro, hold, returnFrames, outro, grainOpacity, grainStep, grain = true }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const L = layout[device];
  const viewportCss = contentHeight / (windowWidth / (L.width / L.scale));
  const keys = React.useMemo(
    () => buildTimeline({ device, viewportCss, durationInFrames, stops, intro, hold, returnFrames, outro }),
    [device, viewportCss, durationInFrames]
  );
  const scroll = scrollAt(keys, frame);
  // Quick return: the end of the page crossfades to the hero instead of
  // scrolling past every section (which strobes).
  const ret = keys.find(k => k.returnFrom !== undefined);
  const retEnd = keys.find(k => k.returnEnd).frame;
  const inReturn = ret && frame > ret.returnStart && frame < retEnd;
  const p = inReturn ? interpolate(frame, [ret.returnStart, retEnd], [0, 1], { easing: easeInOut }) : 0;
  // Motion blur only at whip-pan speed (the quick return to the hero), so
  // sections flying past read as one smooth move instead of a strobe.
  const speed = Math.abs(scrollAt(keys, frame + 1) - scrollAt(keys, frame - 1)) / 2 * (windowWidth / (L.width / L.scale));
  const blur = interpolate(speed, [200, 700], [0, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const scaleIn = interpolate(frame, [0, 30], [0.92, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scaleOut = interpolate(frame, [durationInFrames - outro, durationInFrames - 1], [1, 0.92], { easing: easeInOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = Math.min(scaleIn, scaleOut);
  const cyc = (frame / durationInFrames) * Math.PI * 2;
  const driftY = 6 * Math.sin(cyc * 2);
  const driftX = 3 * Math.sin(cyc + 0.8);

  return (
    <AbsoluteFill>
      <Background grain={grain} grainOpacity={grainOpacity} grainStep={grainStep} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `translate(${driftX}px, ${driftY}px) scale(${scale})` }}>
          <BrowserWindow width={windowWidth} contentHeight={contentHeight} ui={ui}>
            {inReturn ? (
              <>
                <div style={{ position: 'absolute', inset: 0, opacity: 1 - p }}>
                  <Page device={device} contentWidth={windowWidth} scrollCss={ret.returnFrom} />
                </div>
                <div style={{ position: 'absolute', inset: 0, opacity: p }}>
                  <Page device={device} contentWidth={windowWidth} scrollCss={L.topbar} />
                </div>
              </>
            ) : (
              <Page device={device} contentWidth={windowWidth} scrollCss={scroll} blur={blur} />
            )}
          </BrowserWindow>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
