import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import { C, FONT, SAFE, starPoints } from './theme';
import { CategoryScene, IntroScene, OutroScene, QuestionScene } from './scenes';

export type Seg = { type: 'intro' | 'category' | 'question' | 'outro'; from: number; dur: number; voice: string; voiceAt: number; [k: string]: any };
export type QuizProps = { titre: string; total: number; logo: string | null; durationInFrames: number; segments: Seg[] };

const useFonts = () => {
  const [handle] = useState(() => delayRender('Poppins'));
  useEffect(() => {
    Promise.all(['400', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Poppins`)))
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, [handle]);
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const P = 180;
  const dx = (frame * 0.4) % P, dy = (frame * 0.22) % P;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${C.cream} 0%, ${C.cream2} 100%)` }}>
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        <defs>
          <pattern id="geo" width={P} height={P} patternUnits="userSpaceOnUse" patternTransform={`translate(${dx} ${dy})`}>
            <g fill="none" stroke={C.green} strokeWidth="1.6" opacity="0.08">
              <polygon points={starPoints(P / 2, P / 2, 52)} />
              <circle cx={P / 2} cy={P / 2} r="20" />
              {[[0, 0], [P, 0], [0, P], [P, P]].map(([x, y], i) => <polygon key={i} points={starPoints(x, y, 34)} />)}
              <path d={`M${P / 2} 0 V${P / 2 - 52} M${P / 2} ${P} V${P / 2 + 52} M0 ${P / 2} H${P / 2 - 52} M${P} ${P / 2} H${P / 2 + 52}`} />
            </g>
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#geo)" />
        <g transform={`translate(1820 1000) rotate(${frame * 0.05})`} opacity="0.1">
          <polygon points={starPoints(0, 0, 330)} fill="none" stroke={C.gold} strokeWidth="5" />
          <polygon points={starPoints(0, 0, 250)} fill="none" stroke={C.gold} strokeWidth="3" />
        </g>
        <g transform={`translate(100 1000) rotate(${-frame * 0.04})`} opacity="0.07">
          <polygon points={starPoints(0, 0, 220)} fill="none" stroke={C.green} strokeWidth="4" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Hud: React.FC<{ segments: Seg[]; total: number }> = ({ segments, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = segments.find((s) => s.type !== 'intro')?.from ?? 0;
  const outro = segments.find((s) => s.type === 'outro')?.from ?? Infinity;
  if (frame < start || frame >= outro) return null;
  const cur = [...segments].reverse().find((s) => s.from <= frame && s.type !== 'outro')!;
  const isQ = cur.type === 'question';
  const n = isQ ? cur.n : cur.n - 1;
  const cat = isQ ? cur.categorie : cur.name;
  const k = spring({ frame: frame - cur.from, fps, config: { damping: 200 }, durationInFrames: 25 });
  const prev = isQ ? (n - 1) / total : n / total;
  const fill = interpolate(k, [0, 1], [prev, n / total]);
  const vis = interpolate(frame, [start, start + 15, outro - 15, outro], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badge = spring({ frame: frame - cur.from, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ opacity: vis }}>
      <div style={{ position: 'absolute', left: SAFE, top: SAFE, display: 'flex', alignItems: 'center', gap: 14, background: C.green, color: C.white, borderRadius: 40, padding: '10px 30px 10px 14px', fontSize: 30, fontWeight: 600, transform: `scale(${0.9 + 0.1 * badge})`, transformOrigin: 'left center', boxShadow: '0 6px 18px rgba(14,77,54,.25)' }}>
        <svg width="38" height="38" viewBox="0 0 100 100"><polygon points={starPoints(50, 50, 46)} fill={C.gold} /></svg>
        {cat}
      </div>
      <div style={{ position: 'absolute', right: SAFE, top: SAFE + 6, fontSize: 36, fontWeight: 700, color: C.green }}>
        Question <span style={{ color: C.gold }}>{Math.max(1, n)}</span>/{total}
      </div>
      <div style={{ position: 'absolute', left: SAFE, right: SAFE, top: SAFE + 86, height: 14, borderRadius: 7, background: 'rgba(14,77,54,.12)', overflow: 'hidden' }}>
        <div style={{ width: `${fill * 100}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${C.green2}, ${C.gold})` }} />
      </div>
    </AbsoluteFill>
  );
};

export const Quiz: React.FC<QuizProps> = (p) => {
  useFonts();
  const scene = (s: Seg) => {
    switch (s.type) {
      case 'intro': return <IntroScene s={s} titre={p.titre} logo={p.logo} />;
      case 'category': return <CategoryScene s={s} />;
      case 'question': return <QuestionScene s={s} />;
      default: return <OutroScene s={s} total={p.total} />;
    }
  };
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Background />
      {p.segments.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`${s.type} ${s.n ?? ''}`}>
          {scene(s)}
          <Sequence from={s.voiceAt}><Audio src={staticFile(s.voice)} /></Sequence>
          {s.voiceA ? <Sequence from={s.voiceAAt}><Audio src={staticFile(s.voiceA)} /></Sequence> : null}
        </Sequence>
      ))}
      <Hud segments={p.segments} total={p.total} />
    </AbsoluteFill>
  );
};
