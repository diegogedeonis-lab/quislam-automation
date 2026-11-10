#!/usr/bin/env node
// 2) Montage calé sur les durées audio réelles -> build/props.json + build/public/ (voix, sfx, logo)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, BUILD, FPS, loadEpisode } = require('./common');

const COUNTDOWN_S = 8;
const f = (s) => Math.round(s * FPS);
const PUB = path.join(BUILD, 'public');
const SFX_DIR = path.join(ROOT, 'assets', 'sfx');

// Effets sonores synthétisés une fois avec FFmpeg (remplaçables par tes propres .wav du même nom)
const SFX = {
  tick: 'aevalsrc=0.6*sin(2*PI*1900*t)*exp(-t*90):d=0.08',
  pop: 'aevalsrc=0.45*sin(2*PI*(420+2600*t)*t)*exp(-t*28):d=0.18',
  whoosh: 'anoisesrc=d=0.8:c=pink:a=0.5,highpass=f=350,lowpass=f=2800,afade=t=in:d=0.4,afade=t=out:st=0.4:d=0.4',
  ding: 'aevalsrc=0.28*(sin(2*PI*880*t)+0.6*sin(2*PI*1318.5*t)+0.35*sin(2*PI*1760*t))*exp(-t*2.6):d=1.8',
  click: 'aevalsrc=0.5*sin(2*PI*1200*t)*exp(-t*120):d=0.06',
};
function ensureSfx() {
  fs.mkdirSync(SFX_DIR, { recursive: true });
  for (const [name, src] of Object.entries(SFX)) {
    const out = path.join(SFX_DIR, `${name}.wav`);
    if (!fs.existsSync(out)) execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', src, '-ar', '48000', '-ac', '2', out]);
  }
}
function place(src, rel) {
  const dest = path.join(PUB, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try { fs.linkSync(src, dest); } catch { fs.copyFileSync(src, dest); }
  return rel;
}

const epFile = process.argv[2];
const ep = loadEpisode(epFile);
const voices = JSON.parse(fs.readFileSync(path.join(BUILD, 'voices.json'), 'utf8')).segments;
const V = Object.fromEntries(voices.map((s) => [s.id, s]));
for (const q of ep.questions.keys()) if (!V[`q${q + 1}`]) throw new Error('voices.json périmé : relance voice.js');

fs.rmSync(PUB, { recursive: true, force: true });
ensureSfx();
for (const n of Object.keys(SFX)) place(path.join(SFX_DIR, `${n}.wav`), `sfx/${n}.wav`);
const logo = ['logo.png', 'logo.svg'].map((n) => path.join(ROOT, 'assets', n)).find(fs.existsSync);
const voiceRel = (id) => place(V[id].file, `v/${id}.mp3`);

const segments = [];
let t = 0;
const push = (seg) => { seg.from = t; segments.push(seg); t += seg.dur; };

const intro = V.intro.duration;
push({ type: 'intro', dur: f(Math.max(6, 1 + intro + 1.2)), titre: ep.titre, voice: voiceRel('intro'), voiceAt: f(1) });

let prevCat = null, catIdx = 0;
const cats = [];
ep.questions.forEach((q, i) => {
  if (q.categorie !== prevCat) {
    catIdx++; prevCat = q.categorie; cats.push(q.categorie);
    const d = V[`cat${catIdx}`].duration;
    push({ type: 'category', dur: f(Math.max(3, 0.6 + d + 1)), name: q.categorie, index: catIdx, n: i + 1, voice: voiceRel(`cat${catIdx}`), voiceAt: f(0.6) });
  }
  const vq = V[`q${i + 1}`], va = V[`a${i + 1}`];
  const vAt = 0.5;
  const cdAt = vAt + vq.duration + 0.4;
  const rev = cdAt + COUNTDOWN_S;
  const aAt = rev + 0.6;
  push({
    type: 'question', n: i + 1, categorie: q.categorie, q: q.q, choix: q.choix, bonne: q.bonne, explication: q.explication || '',
    voice: voiceRel(`q${i + 1}`), voiceAt: f(vAt),
    wordsFrom: f(vAt), wordsEnd: f(vAt + vq.duration * vq.qFraction * 0.92),
    cardsAt: vq.choiceMarks.map((m) => f(vAt + vq.duration * m - 0.15)),
    countdownAt: f(cdAt), countdownDur: f(COUNTDOWN_S), revealAt: f(rev),
    voiceA: voiceRel(`a${i + 1}`), voiceAAt: f(aAt), explAt: f(rev + 1.2),
    dur: f(aAt + va.duration + 1.5),
  });
});
const outro = V.outro.duration;
push({ type: 'outro', dur: f(Math.max(10, 1 + outro + 3)), categories: cats, voice: voiceRel('outro'), voiceAt: f(1) });

const props = { titre: ep.titre, total: ep.questions.length, logo: logo ? place(logo, path.basename(logo)) : null, durationInFrames: t, segments };
fs.writeFileSync(path.join(BUILD, 'props.json'), JSON.stringify(props));
const min = t / FPS / 60;
console.log(`Timeline : ${segments.length} scènes, ${Math.floor(min)} min ${Math.round((min % 1) * 60)} s`);
if (ep.questions.length >= 20 && (min < 11 || min > 13)) console.log('  (info) durée hors de la cible 11-13 min');
