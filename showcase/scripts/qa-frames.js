// QA: extracts a frame every 2 seconds from each exported MP4 (with Remotion's
// bundled ffmpeg), builds a contact sheet, and flags flashes and stutter.
// Usage: node scripts/qa-frames.js [filter]
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'qa', 'frames');
fs.mkdirSync(OUT, { recursive: true });

const ffmpeg = args => execFileSync('npx', ['remotion', 'ffmpeg', '-loglevel', 'error', '-y', ...args], { cwd: ROOT });
const frameAt = (video, t, out) => ffmpeg(['-ss', t.toFixed(3), '-i', video, '-frames:v', '1', out]);

async function mean(file) {
  const s = await sharp(file).stats();
  return s.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) / 3;
}

async function diff(a, b) {
  const [x, y] = await Promise.all([a, b].map(f => sharp(f).resize(480).greyscale().raw().toBuffer()));
  let d = 0;
  for (let i = 0; i < x.length; i++) d += Math.abs(x[i] - y[i]);
  return d / x.length;
}

(async () => {
  const only = process.argv[2];
  const videos = fs.readdirSync(path.join(ROOT, 'output')).filter(f => f.endsWith('.mp4') && (!only || f.includes(only)));
  for (const file of videos) {
    const video = path.join(ROOT, 'output', file);
    const name = file.replace('.mp4', '');
    const duration = parseFloat(execFileSync('npx', ['remotion', 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { cwd: ROOT }).toString());
    const shots = [];
    for (let t = 0; t < duration - 0.01; t += 2) {
      const p = path.join(OUT, `${name}-${String(Math.round(t)).padStart(2, '0')}s.png`);
      frameAt(video, t, p);
      shots.push(p);
    }
    // Flash check: a near-black or near-white sampled frame.
    const flashes = [];
    for (const s of shots) {
      const m = await mean(s);
      if (m < 25 || m > 240) flashes.push(`${path.basename(s)} (mean ${m.toFixed(0)})`);
    }
    // Every-frame flash check: decode all frames small and flag any frame whose
    // brightness jumps away from both neighbours.
    const all = path.join(OUT, '_all');
    fs.rmSync(all, { recursive: true, force: true });
    fs.mkdirSync(all);
    ffmpeg(['-i', video, '-s', '192x108', path.join(all, '%04d.jpg')]);
    const files = fs.readdirSync(all).sort();
    const means = [];
    for (const f of files) means.push(await mean(path.join(all, f)));
    fs.rmSync(all, { recursive: true, force: true });
    const jumps = [];
    for (let i = 1; i < means.length - 1; i++) {
      const ref = (means[i - 1] + means[i + 1]) / 2;
      if (Math.abs(means[i] - ref) > 20 || means[i] < 20 || means[i] > 240) jumps.push(`frame ${i} (mean ${means[i].toFixed(0)}, neighbours ${ref.toFixed(0)})`);
    }
    if (means[0] < 20 || means[0] > 240) jumps.unshift(`frame 0 (mean ${means[0].toFixed(0)})`);

    // Stutter check: 1s of consecutive frames; a duplicate frame mid-motion or a spike is a stutter.
    const start = duration > 10 ? 6 : 0.5;
    const seq = [];
    for (let i = 0; i < 30; i++) {
      const p = path.join(OUT, `_seq-${i}.png`);
      frameAt(video, start + (i + 0.5) / 30, p);
      seq.push(p);
    }
    const diffs = [];
    for (let i = 1; i < seq.length; i++) diffs.push(await diff(seq[i - 1], seq[i]));
    seq.forEach(p => fs.unlinkSync(p));

    const portrait = name.includes('9x16');
    const tw = portrait ? 270 : 480, th = portrait ? 480 : 270, cols = portrait ? 7 : 4;
    const tiles = await Promise.all(shots.map(s => sharp(s).resize(tw, th).toBuffer()));
    await sharp({ create: { width: tw * cols, height: th * Math.ceil(tiles.length / cols), channels: 3, background: '#000' } })
      .composite(tiles.map((b, k) => ({ input: b, left: (k % cols) * tw, top: Math.floor(k / cols) * th })))
      .png().toFile(path.join(ROOT, 'qa', `sheet-${name}.png`));

    const mb = (fs.statSync(video).size / 1048576).toFixed(1);
    console.log(`${name}: ${duration.toFixed(2)}s, ${mb} MB, ${shots.length} frames`);
    console.log(`  flashes in 2s samples: ${flashes.length ? flashes.join(', ') : 'none'}`);
    console.log(`  every-frame check (${means.length} frames): ${jumps.length ? jumps.join(', ') : 'no flashes or blank frames'}`);
    console.log(`  frame-to-frame diff ${start}s-${start + 1}s: ${diffs.map(d => d.toFixed(1)).join(' ')}`);
  }
})();
