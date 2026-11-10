# QuIslam — générateur de vidéos quiz YouTube (1920x1080, 30 fps)

**Installation (VPS Ubuntu, Node 18+, FFmpeg)** : `cd quiz-video && npm install`

**Configuration** : `cp .env.example .env` puis renseigne `ELEVENLABS_API_KEY` (voix « Léo » trouvée par son nom, ou `ELEVENLABS_VOICE_ID`). Nasheeds : `MUSIC_DIR=/assets/music`. Logo optionnel : `assets/logo.png`.

**Produire un épisode** (30 questions → ~12 min) : `./make_episode.sh episode.json` → `out/episode.mp4`

**Test rapide** (2 questions, 960x540, 4 s) : `VOICE_MOCK=1 ./make_episode.sh episode.example.json --test`

Pipeline : `scripts/voice.js` (ElevenLabs + cache `cache/voices`, durées ffprobe) → `scripts/timeline.js` (montage calé sur l'audio) → Remotion (`src/`) → `scripts/mix.js` (nasheeds en ducking + fondus).
Les voix déjà générées ne sont jamais refacturées. Effets sonores : `assets/sfx/*.wav` (générés au 1er lancement, remplaçables).
Prévisualiser : `npm run studio` (après un premier lancement). Relis toujours les questions avant publication.
