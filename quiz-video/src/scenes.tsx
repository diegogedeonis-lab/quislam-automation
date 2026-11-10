import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, interpolateColors, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SAFE, Star, starPoints } from './theme';
import type { Seg } from './Quiz';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const LET = ['A', 'B', 'C'];

const Fade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 10, dur - 10, dur], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
const Sfx: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.5 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={60}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} /></Sequence>
);

/* ───────────── INTRO ───────────── */
export const IntroScene: React.FC<{ s: Seg; titre: string; logo: string | null }> = ({ s, titre, logo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lg = spring({ frame, fps, config: { damping: 12, mass: 0.9 } });
  const word = 'QuIslam';
  const t = spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const b = spring({ frame: frame - 60, fps, config: { damping: 200 } });
  const ring = interpolate(frame, [0, 45], [0, 1], clamp);
  return (
    <Fade dur={s.dur}>
      <Sfx at={2} name="whoosh" volume={0.4} />
      <Sfx at={22} name="ding" volume={0.3} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ position: 'relative', width: 240, height: 240, transform: `scale(${lg}) rotate(${(1 - lg) * -120}deg)` }}>
          <svg width="240" height="240" viewBox="0 0 240 240" style={{ position: 'absolute' }}>
            <circle cx="120" cy="120" r="112" fill="none" stroke={C.gold} strokeWidth="4" strokeDasharray={704} strokeDashoffset={704 * (1 - ring)} transform="rotate(-90 120 120)" />
          </svg>
          {logo ? <Img src={staticFile(logo)} style={{ position: 'absolute', inset: 30, width: 180, height: 180, objectFit: 'contain' }} />
            : <Star size={180} fill={C.green} stroke={C.gold} strokeWidth={3} style={{ position: 'absolute', left: 30, top: 30, transform: `rotate(${frame * 0.3}deg)` }} />}
        </div>
        <div style={{ display: 'flex', marginTop: 30, fontSize: 130, fontWeight: 800, letterSpacing: 2 }}>
          {word.split('').map((ch, i) => {
            const p = spring({ frame: frame - 18 - i * 3, fps, config: { damping: 14 } });
            return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 50}px)`, color: i < 2 ? C.gold : C.green }}>{ch}</span>;
          })}
        </div>
        <div style={{ marginTop: 10, maxWidth: 1500, textAlign: 'center', fontSize: 52, fontWeight: 600, color: C.ink, opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>{titre}</div>
        <div style={{ marginTop: 34, fontSize: 44, fontWeight: 600, fontStyle: 'italic', color: C.gold, opacity: b, transform: `scale(${0.9 + 0.1 * b})`, letterSpacing: 3 }}>« Bismillah »</div>
      </AbsoluteFill>
    </Fade>
  );
};

/* ───────────── CATÉGORIE ───────────── */
export const CategoryScene: React.FC<{ s: Seg }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const out = spring({ frame: frame - (s.dur - 20), fps, config: { damping: 200 } });
  const x = interpolate(inn, [0, 1], [-2100, 0]) + interpolate(out, [0, 1], [0, 2100]);
  const txt = spring({ frame: frame - 12, fps, config: { damping: 14 } });
  const ic = spring({ frame: frame - 6, fps, config: { damping: 9 } });
  return (
    <AbsoluteFill>
      <Sfx at={0} name="whoosh" volume={0.5} />
      <AbsoluteFill style={{ justifyContent: 'center' }}>
        <div style={{ height: 8, background: C.gold, transform: `translateX(${x * 1.15}px)`, marginBottom: 18 }} />
        <div style={{ height: 280, background: `linear-gradient(90deg, ${C.green}, ${C.green2})`, transform: `translateX(${x}px)`, display: 'flex', alignItems: 'center', padding: `0 ${SAFE + 80}px`, gap: 60, boxShadow: '0 20px 50px rgba(14,77,54,.3)' }}>
          <div style={{ width: 170, height: 170, borderRadius: '50%', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ic}) rotate(${(1 - ic) * 180}deg)` }}>
            <Star size={120} fill={C.gold} stroke={C.green} strokeWidth={2} />
          </div>
          <div style={{ opacity: txt, transform: `translateX(${(1 - txt) * 60}px)` }}>
            <div style={{ fontSize: 34, fontWeight: 600, color: C.goldSoft, letterSpacing: 6, textTransform: 'uppercase' }}>Catégorie {s.index}</div>
            <div style={{ fontSize: 88, fontWeight: 800, color: C.white, lineHeight: 1.1 }}>{s.name}</div>
          </div>
        </div>
        <div style={{ height: 8, background: C.gold, transform: `translateX(${x * 0.85}px)`, marginTop: 18 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── QUESTION ───────────── */
const CARD_W = 520, CARD_H = 180, GAP = 50, CARDS_TOP = 540;
const cardCenter = (i: number) => ({ x: 960 + (i - 1) * (CARD_W + GAP), y: CARDS_TOP + CARD_H / 2 });

const Confetti: React.FC<{ at: number; i: number }> = ({ at, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - at) / fps;
  if (t < 0 || t > 2.4) return null;
  const { x: x0, y: y0 } = cardCenter(i);
  const cols = [C.gold, C.green2, C.goldSoft, '#E8B04B', C.green];
  return (
    <svg width="1920" height="1080" style={{ position: 'absolute', left: 0, top: 0 }}>
      {Array.from({ length: 70 }).map((_, k) => {
        const a = -Math.PI / 2 + (random(`a${k}`) - 0.5) * 2.4;
        const v = 600 + random(`v${k}`) * 900;
        const x = x0 + (random(`x${k}`) - 0.5) * 200 + Math.cos(a) * v * t;
        const y = y0 + Math.sin(a) * v * t + 0.5 * 1500 * t * t;
        const o = interpolate(t, [0, 1.4, 2.4], [1, 1, 0], clamp);
        const s = 10 + random(`s${k}`) * 12;
        return <rect key={k} x={x} y={y} width={s} height={s * 0.55} fill={cols[k % cols.length]} opacity={o} transform={`rotate(${(random(`r${k}`) * 720 + t * 540) % 360} ${x} ${y})`} />;
      })}
    </svg>
  );
};

const Ring: React.FC<{ s: Seg }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const el = frame - s.countdownAt;
  const appear = spring({ frame: el + 6, fps, config: { damping: 13 } });
  const hide = interpolate(frame, [s.revealAt, s.revealAt + 12], [1, 0], clamp);
  if (el < -6 || hide <= 0) return null;
  const prog = interpolate(el, [0, s.countdownDur], [0, 1], clamp);
  const remain = Math.max(0, Math.ceil((s.countdownDur - el) / fps));
  const last3 = remain <= 3 && el >= 0;
  const tsec = ((el % fps) + fps) % fps / fps;
  const pulse = last3 ? 1 + 0.13 * Math.exp(-tsec * 6) : 1;
  const col = interpolateColors(prog, [0, 0.6, 1], [C.green2, C.gold, '#D9822B']);
  const R = 74, L = 2 * Math.PI * R;
  return (
    <div style={{ position: 'absolute', left: 960 - 95, top: 790, width: 190, height: 190, opacity: hide, transform: `scale(${appear * pulse})` }}>
      <svg width="190" height="190" viewBox="0 0 190 190">
        <circle cx="95" cy="95" r={R} fill={C.white} stroke="rgba(14,77,54,.12)" strokeWidth="16" />
        <circle cx="95" cy="95" r={R} fill="none" stroke={col} strokeWidth="16" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * prog} transform="rotate(-90 95 95)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 78, fontWeight: 800, color: last3 ? col : C.green }}>{remain || ''}</div>
    </div>
  );
};

export const QuestionScene: React.FC<{ s: Seg }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words: string[] = s.q.split(/\s+/);
  const step = Math.max(1, (s.wordsEnd - s.wordsFrom) / words.length);
  const qSize = s.q.length > 110 ? 50 : s.q.length > 70 ? 58 : 66;
  const rev = spring({ frame: frame - s.revealAt, fps, config: { damping: 12, stiffness: 110 } });
  const revOn = frame >= s.revealAt;
  const ex = spring({ frame: frame - s.explAt, fps, config: { damping: 200 }, durationInFrames: 20 });
  return (
    <Fade dur={s.dur}>
      {s.cardsAt.map((at: number, i: number) => <Sfx key={i} at={at} name="pop" volume={0.35} />)}
      {Array.from({ length: Math.round(s.countdownDur / fps) }).map((_, k, arr) => (
        <Sfx key={k} at={s.countdownAt + k * fps} name="tick" volume={k >= arr.length - 3 ? 0.4 : 0.18} />
      ))}
      <Sfx at={s.revealAt} name="ding" volume={0.45} />

      {/* Question, mot par mot */}
      <div style={{ position: 'absolute', left: SAFE + 60, right: SAFE + 60, top: 210, height: 290, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', fontSize: qSize, fontWeight: 700, lineHeight: 1.25, color: C.green }}>
          {words.map((w, i) => {
            const p = spring({ frame: frame - (s.wordsFrom + i * step), fps, config: { damping: 200 }, durationInFrames: 12 });
            return <span key={i} style={{ display: 'inline-block', marginRight: '0.28em', opacity: p, transform: `translateY(${(1 - p) * 24}px)`, filter: `blur(${(1 - p) * 6}px)` }}>{w}</span>;
          })}
        </div>
      </div>

      {/* Cartes A / B / C */}
      {s.choix.map((c: string, i: number) => {
        const p = spring({ frame: frame - s.cardsAt[i], fps, config: { damping: 10, stiffness: 120, mass: 0.8 } });
        const good = i === s.bonne;
        const r = revOn ? rev : 0;
        const scale = (0.75 + 0.25 * p) * (good ? 1 + 0.09 * r : 1 - 0.05 * r);
        const bg = good ? interpolateColors(r, [0, 1], [C.white, C.green2]) : C.white;
        const fg = good ? interpolateColors(r, [0, 1], [C.ink, C.white]) : C.ink;
        const fs = c.length > 34 ? 30 : c.length > 20 ? 36 : 44;
        const { x } = cardCenter(i);
        return (
          <div key={i} style={{
            position: 'absolute', left: x - CARD_W / 2, top: CARDS_TOP, width: CARD_W, height: CARD_H, borderRadius: 28, background: bg,
            border: `4px solid ${good && r > 0.05 ? C.goldSoft : 'rgba(14,77,54,.15)'}`, display: 'flex', alignItems: 'center', gap: 24, padding: '0 30px', boxSizing: 'border-box',
            opacity: Math.min(1, p * 1.6) * (good ? 1 : 1 - 0.6 * r), transform: `translateY(${(1 - p) * 90}px) scale(${scale})`,
            filter: good ? 'none' : `grayscale(${r})`,
            boxShadow: good && r > 0 ? `0 0 ${70 * r}px ${18 * r}px rgba(${C.greenGlow},${0.5 * r}), 0 12px 30px rgba(0,0,0,.12)` : '0 12px 30px rgba(14,77,54,.12)',
          }}>
            <div style={{ flex: '0 0 92px', height: 92, borderRadius: '50%', background: good && r > 0.5 ? C.gold : C.green, color: C.white, fontSize: 48, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {good && r > 0.5 ? <svg width="50" height="50" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : LET[i]}
            </div>
            <div style={{ fontSize: fs, fontWeight: 600, color: fg, lineHeight: 1.15 }}>{c}</div>
          </div>
        );
      })}

      <Ring s={s} />
      <Confetti at={s.revealAt} i={s.bonne} />

      {/* Explication */}
      {s.explication && frame >= s.explAt - 1 ? (
        <div style={{ position: 'absolute', left: 260, right: 260, bottom: SAFE + 10, minHeight: 170, borderRadius: 26, background: 'rgba(255,255,255,.92)', border: `3px solid ${C.goldSoft}`, padding: '22px 40px', boxSizing: 'border-box', opacity: ex, transform: `translateY(${(1 - ex) * 30}px)`, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 12px 30px rgba(14,77,54,.12)' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.gold, letterSpacing: 3, textTransform: 'uppercase' }}>Bonne réponse : {LET[s.bonne]}</div>
          <div style={{ fontSize: s.explication.length > 120 ? 32 : 38, fontWeight: 500, color: C.ink, lineHeight: 1.3, marginTop: 6 }}>{s.explication}</div>
        </div>
      ) : null}
    </Fade>
  );
};

/* ───────────── OUTRO ───────────── */
export const OutroScene: React.FC<{ s: Seg; total: number }> = ({ s, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 14 } });
  const b = spring({ frame: frame - 25, fps, config: { damping: 14 } });
  const c = spring({ frame: frame - 50, fps, config: { damping: 200 } });
  const btn = spring({ frame: frame - 80, fps, config: { damping: 10 } });
  const CLICK = 135;
  const cur = spring({ frame: frame - 105, fps, config: { damping: 18 } });
  const press = interpolate(frame, [CLICK - 4, CLICK, CLICK + 6], [1, 0.9, 1], clamp);
  const subbed = frame >= CLICK;
  const bell = subbed ? Math.sin((frame - CLICK) * 0.6) * 18 * Math.exp(-(frame - CLICK) / 25) : 0;
  const tiers = [[`${Math.round(total * 0.85)}+`, 'Excellent !'], [`${Math.round(total * 0.5)}+`, 'Bravo !'], ['moins', 'Continue d\'apprendre !']];
  return (
    <Fade dur={s.dur}>
      <Sfx at={0} name="whoosh" volume={0.4} />
      <Sfx at={CLICK} name="click" volume={0.6} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 110 }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.gold, letterSpacing: 6, textTransform: 'uppercase', opacity: a }}>Quiz terminé</div>
        <div style={{ fontSize: 92, fontWeight: 800, color: C.green, textAlign: 'center', transform: `scale(${0.8 + 0.2 * a})`, opacity: a }}>Combien de bonnes réponses ?</div>
        <div style={{ display: 'flex', gap: 30, marginTop: 30, opacity: b, transform: `translateY(${(1 - b) * 40}px)` }}>
          {tiers.map(([n, l], i) => (
            <div key={i} style={{ background: C.white, borderRadius: 22, padding: '18px 36px', border: `3px solid ${i === 0 ? C.gold : 'rgba(14,77,54,.15)'}`, textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.green }}>{n === 'moins' ? `< ${Math.round(total * 0.5)}` : n}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: C.muted }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 46, fontSize: 50, fontWeight: 600, color: C.ink, opacity: c }}>
          Écris ton score <span style={{ color: C.green2, fontWeight: 800 }}>en commentaire</span> !
        </div>
        <div style={{ position: 'relative', marginTop: 50, transform: `scale(${btn * press})` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '24px 56px', borderRadius: 60, background: subbed ? '#E4E1D8' : '#D93025', color: subbed ? C.ink : C.white, fontSize: 46, fontWeight: 800, boxShadow: subbed ? 'none' : '0 14px 34px rgba(217,48,37,.35)' }}>
            <svg width="46" height="46" viewBox="0 0 24 24" style={{ transform: `rotate(${bell}deg)` }}><path d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z" fill={subbed ? C.ink : '#fff'} /></svg>
            {subbed ? 'ABONNÉ' : "S'ABONNER"}
          </div>
          <svg width="70" height="70" viewBox="0 0 24 24" style={{ position: 'absolute', right: -30, bottom: -40, opacity: cur, transform: `translate(${(1 - cur) * 260}px, ${(1 - cur) * 160}px)` }}>
            <path d="M5 2l14 10-6.5 1.2L16 20l-3 1.4-3.4-6.8L5 19z" fill="#fff" stroke={C.ink} strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: SAFE + 10, fontSize: 34, fontWeight: 600, fontStyle: 'italic', color: C.gold, opacity: c }}>Barakallahou fikoum — à bientôt sur QuIslam</div>
      </AbsoluteFill>
      <svg width="1920" height="1080" style={{ position: 'absolute' }} opacity={0.12}>
        <polygon points={starPoints(960, 540, 600 + frame * 0.3)} fill="none" stroke={C.gold} strokeWidth="3" transform={`rotate(${frame * 0.08} 960 540)`} />
      </svg>
    </Fade>
  );
};
