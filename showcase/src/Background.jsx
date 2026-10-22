import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

// MC Royal brand palette (css/tokens.css): royal purple + regal gold.
export const BRAND = {
  purple950: '#200E2C',
  purple800: '#46255E',
  purple600: '#6B3E8C',
  purple500: '#8663A6',
  purple400: '#A27AD2',
  purple300: '#C2A6E3',
  gold300: '#EED099',
  gold400: '#E3B86A',
  gold500: '#C99738',
  gold600: '#B07E2C'
};

// A wave path across the canvas; `phase` is in radians so a full 2π cycle loops.
function wavePath(w, h, baseY, amp, phase, lobes) {
  const pts = [];
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const t = (i / steps) * Math.PI * 2 * lobes;
    const y = baseY
      + amp * Math.sin(t + phase)
      + amp * 0.45 * Math.sin(t * 1.7 - phase * 2 + 1.3)
      + amp * 0.2 * Math.sin(t * 3.1 + phase * 3);
    pts.push([x, y]);
  }
  let d = `M 0 ${h} L ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += ` Q ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`;
  }
  d += ` L ${w} ${pts[pts.length - 1][1]} L ${w} ${h} Z`;
  return d;
}

export const Background = ({ grain = true, grainOpacity = 0.16, grainStep = 2, transparentBase = false, staticFrame }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, durationInFrames } = useVideoConfig();
  const f = staticFrame ?? frame;
  // One full drift cycle per composition so the video loops seamlessly.
  const phase = (f / durationInFrames) * Math.PI * 2;
  const portrait = h > w;
  const base = portrait ? h * 0.74 : h * 0.66;
  const amp = portrait ? h * 0.035 : h * 0.06;

  return (
    <AbsoluteFill>
      {!transparentBase && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(110% 80% at 12% 8%, #B68CE6 0%, transparent 55%),
              radial-gradient(80% 70% at 92% 18%, #9A5FCB 0%, transparent 60%),
              linear-gradient(165deg, #8A55B8 0%, ${BRAND.purple600} 45%, ${BRAND.purple800} 100%)`
          }}
        />
      )}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="waveBack" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F8E6C4" />
            <stop offset="1" stopColor={BRAND.gold300} />
          </linearGradient>
          <linearGradient id="waveFront" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={BRAND.gold300} />
            <stop offset="0.45" stopColor={BRAND.gold400} />
            <stop offset="1" stopColor={BRAND.gold600} />
          </linearGradient>
        </defs>
        <path d={wavePath(w, h, base - amp * 1.4, amp * 1.1, -phase + 2.1, 0.85)} fill="url(#waveBack)" />
        <path d={wavePath(w, h, base, amp, phase, 0.7)} fill="url(#waveFront)" />
      </svg>
      {grain && (
        <svg width={w} height={h} style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: grainOpacity }}>
          <filter id="grain">
            {/* Seed changes every grainStep frames: visible grain at a lower bitrate. */}
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(f / grainStep) % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      )}
    </AbsoluteFill>
  );
};
