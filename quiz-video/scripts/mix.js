#!/usr/bin/env node
// 3) Mixage final : voix + sfx (déjà dans le rendu Remotion) + nasheeds en fond, bas sous la voix (ducking), fondus.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, loadEnv, probeDuration } = require('./common');

loadEnv();
const [raw, out] = process.argv.slice(2);
if (!raw || !out) { console.error('Usage: node scripts/mix.js raw.mp4 out.mp4'); process.exit(1); }
const dur = probeDuration(raw);
const dirs = [process.env.MUSIC_DIR, '/assets/music', path.join(ROOT, 'assets', 'music')].filter(Boolean);
const dir = dirs.find((d) => fs.existsSync(d) && fs.readdirSync(d).some((x) => /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(x)));
const vol = parseFloat(process.env.MUSIC_VOLUME || '0.16');
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', '-stats', ...args], { stdio: 'inherit' });

if (!dir) {
  console.log('Mixage : aucune musique trouvée (MUSIC_DIR), vidéo sans nasheed.');
  ff(['-i', raw, '-c', 'copy', '-movflags', '+faststart', out]);
  process.exit(0);
}
const files = fs.readdirSync(dir).filter((x) => /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(x)).map((x) => path.join(dir, x));
for (let i = files.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [files[i], files[j]] = [files[j], files[i]]; }
const playlist = [];
for (let sum = 0, k = 0; sum < dur + 2; k++) { const fl = files[k % files.length]; playlist.push(fl); sum += probeDuration(fl); }

const inputs = playlist.flatMap((fl) => ['-i', fl]);
const fmt = 'aformat=sample_rates=48000:channel_layouts=stereo';
const chain = playlist.map((_, i) => `[${i + 1}:a]${fmt}[m${i}]`).join(';');
const fadeOut = Math.max(0, dur - 4).toFixed(2);
const graph = `${chain};${playlist.map((_, i) => `[m${i}]`).join('')}concat=n=${playlist.length}:v=0:a=1,atrim=0:${dur.toFixed(2)},asetpts=N/SR/TB,` +
  `volume=${vol},afade=t=in:d=3,afade=t=out:st=${fadeOut}:d=4[mus];` +
  `[0:a]${fmt},asplit=2[voix][sc];[mus][sc]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=500[duck];` +
  `[voix][duck]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]`;
console.log(`Mixage : ${playlist.length} piste(s) depuis ${dir}`);
ff(['-i', raw, ...inputs, '-filter_complex', graph, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]);
