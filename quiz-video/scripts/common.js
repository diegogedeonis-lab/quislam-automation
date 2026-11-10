// Shared helpers: .env loader, episode loading, voice segment texts.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const FPS = 30;
const LETTERS = ['A', 'B', 'C'];

function loadEnv() {
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function loadEpisode(file) {
  const ep = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(ep.questions) || !ep.questions.length) throw new Error('episode.json: "questions" vide');
  const limit = parseInt(process.env.QUIZ_LIMIT || '0', 10);
  if (limit > 0) ep.questions = ep.questions.slice(0, limit);
  ep.questions.forEach((q, i) => {
    if (!Array.isArray(q.choix) || q.choix.length !== 3) throw new Error(`Question ${i + 1}: il faut 3 choix`);
    if (![0, 1, 2].includes(q.bonne)) throw new Error(`Question ${i + 1}: "bonne" doit valoir 0, 1 ou 2`);
    q.categorie = q.categorie || 'Quiz';
  });
  return ep;
}

const clean = (s) => String(s).trim().replace(/[.?!:;]+$/, '');

// Every spoken segment of the episode, in order. id is stable for the episode.
function buildSegments(ep) {
  const n = ep.questions.length;
  const segs = [{
    id: 'intro',
    text: `Bismillah ! Bienvenue sur QuIslam. ${clean(ep.titre)}. ${n} questions t'attendent : prépare-toi et compte tes bonnes réponses !`,
  }];
  let prevCat = null, catIdx = 0;
  ep.questions.forEach((q, i) => {
    if (q.categorie !== prevCat) {
      catIdx++;
      segs.push({ id: `cat${catIdx}`, text: catIdx === 1 ? `On commence avec : ${q.categorie} !` : `Nouvelle catégorie : ${q.categorie} !` });
      prevCat = q.categorie;
    }
    const head = `Question ${i + 1}. ${q.q.trim()}`;
    const parts = q.choix.map((c, k) => `${LETTERS[k]} : ${clean(c)}.`);
    const text = `${head} ${parts.join(' ')}`;
    // character offsets of each choice inside the spoken text (for visual sync)
    let pos = head.length + 1;
    const marks = parts.map((p) => { const m = pos / text.length; pos += p.length + 1; return m; });
    segs.push({ id: `q${i + 1}`, text, qFraction: head.length / text.length, choiceMarks: marks });
    segs.push({ id: `a${i + 1}`, text: `La bonne réponse est ${LETTERS[q.bonne]} : ${clean(q.choix[q.bonne])}. ${q.explication || ''}`.trim() });
  });
  segs.push({
    id: 'outro',
    text: `Et voilà, c'est la fin du quiz ! Combien de bonnes réponses as-tu eues ? Écris ton score en commentaire, et abonne-toi pour ne rater aucun quiz. Barakallahou fikoum !`,
  });
  return segs;
}

function probeDuration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();
  const d = parseFloat(out);
  if (!isFinite(d)) throw new Error(`ffprobe: durée illisible pour ${file}`);
  return d;
}

module.exports = { ROOT, BUILD, FPS, LETTERS, loadEnv, loadEpisode, buildSegments, probeDuration };
