import React from 'react';
import { Composition, continueRender, delayRender, staticFile } from 'remotion';
import { Showcase } from './Showcase';
import { Background } from './Background';

// Font is bundled locally so renders never depend on the network.
const fontHandle = delayRender('Loading Plus Jakarta Sans');
const font = new FontFace('Plus Jakarta Sans', `url(${staticFile('fonts/PlusJakartaSans-500.woff2')}) format('woff2')`, { weight: '500' });
font.load().then(f => { document.fonts.add(f); continueRender(fontHandle); });

const FPS = 30;
const STOPS = ['how-we-learn', 'about', 'admissions', 'school-life', 'academics', 'facilities', 'our-staff', 'graduation', 'end'];
const TOUR = { stops: STOPS, intro: 50, hold: 36, returnFrames: 26, outro: 22 };
const TEASER = { stops: [], intro: 30, hold: 0, returnFrames: 0, outro: 22 };

const LANDSCAPE = { device: 'desktop', windowWidth: 1360, contentHeight: 850, ui: 1 };
const PORTRAIT = { device: 'mobile', windowWidth: 760, contentHeight: 1440, ui: 1.35 };

export const Root = () => (
  <>
    <Composition id="Showcase-16x9" component={Showcase} durationInFrames={25 * FPS} fps={FPS} width={1920} height={1080} defaultProps={{ ...LANDSCAPE, ...TOUR }} />
    <Composition id="Showcase-9x16" component={Showcase} durationInFrames={25 * FPS} fps={FPS} width={1080} height={1920} defaultProps={{ ...PORTRAIT, ...TOUR }} />
    <Composition id="Teaser-16x9" component={Showcase} durationInFrames={6 * FPS} fps={FPS} width={1920} height={1080} defaultProps={{ ...LANDSCAPE, ...TEASER }} />
    <Composition id="Teaser-9x16" component={Showcase} durationInFrames={6 * FPS} fps={FPS} width={1080} height={1920} defaultProps={{ ...PORTRAIT, ...TEASER }} />
    <Composition id="MockupBg" component={Background} durationInFrames={1} fps={FPS} width={3200} height={2000} />
  </>
);
