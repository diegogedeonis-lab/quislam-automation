#!/usr/bin/env node
// 1) Voix ElevenLabs pour chaque segment, avec cache (jamais régénéré) + durée ffprobe.
// Usage: node scripts/voice.js episode.json   (VOICE_MOCK=1 => voix muette de test, sans API)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { ROOT, BUILD, loadEnv, loadEpisode, buildSegments, probeDuration } = require('./common');

loadEnv();
const API = 'https://api.elevenlabs.io/v1';
const KEY = process.env.ELEVENLABS_API_KEY;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const MOCK = process.env.VOICE_MOCK === '1';
const CACHE = path.join(ROOT, 'cache', 'voices');

async function resolveVoiceId() {
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  const name = (process.env.ELEVENLABS_VOICE_NAME || 'Léo').toLowerCase();
  const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': KEY } });
  if (!res.ok) throw new Error(`ElevenLabs /voices: HTTP ${res.status}`);
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const v = (await res.json()).voices.find((x) => norm(x.name).split(/[\s-]/).includes(norm(name)));
  if (!v) throw new Error(`Voix "${name}" introuvable : renseigne ELEVENLABS_VOICE_ID dans .env`);
  console.log(`Voix : ${v.name} (${v.voice_id})`);
  return v.voice_id;
}

async function tts(voiceId, text, dest) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text, model_id: MODEL, language_code: 'fr',
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
      }),
    });
    if (res.ok) {
      const tmp = dest + '.tmp';
      fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
      fs.renameSync(tmp, dest);
      return;
    }
    const body = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    throw new Error(`ElevenLabs HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
}

function mock(text, dest) {
  const d = (0.8 + text.split(/\s+/).length * 0.36).toFixed(2);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', d, '-c:a', 'libmp3lame', '-b:a', '64k', dest]);
}

(async () => {
  const epFile = process.argv[2];
  if (!epFile) throw new Error('Usage: node scripts/voice.js episode.json');
  const segs = buildSegments(loadEpisode(epFile));
  if (!MOCK && !KEY) throw new Error('ELEVENLABS_API_KEY manquante dans .env (ou VOICE_MOCK=1 pour tester)');
  const voiceId = MOCK ? 'mock' : await resolveVoiceId();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });

  let made = 0;
  const queue = [...segs];
  const worker = async () => {
    for (let s; (s = queue.shift()); ) {
      const hash = crypto.createHash('sha1').update(`${voiceId}|${MODEL}|${s.text}`).digest('hex').slice(0, 20);
      s.file = path.join(CACHE, `${MOCK ? 'mock_' : ''}${hash}.mp3`);
      if (!fs.existsSync(s.file)) {
        MOCK ? mock(s.text, s.file) : await tts(voiceId, s.text, s.file);
        made++;
        process.stdout.write(`  voix ${s.id} ✓\n`);
      }
      s.duration = probeDuration(s.file);
    }
  };
  await Promise.all([worker(), worker()]);
  fs.writeFileSync(path.join(BUILD, 'voices.json'), JSON.stringify({ segments: segs }, null, 1));
  console.log(`Voix : ${segs.length} segments (${made} générés, ${segs.length - made} en cache)`);
})().catch((e) => { console.error('ERREUR voice.js :', e.message); process.exit(1); });
