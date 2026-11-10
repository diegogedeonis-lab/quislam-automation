import React from 'react';

export const C = {
  cream: '#FBF6EA', cream2: '#F1E6CC', green: '#0E4D36', green2: '#17734F', greenGlow: '46,170,105',
  gold: '#C9A24D', goldSoft: '#E9D49A', ink: '#1E2B24', muted: '#7D8A82', white: '#FFFFFF',
};
export const FONT = "'Poppins', sans-serif";
export const SAFE = 80;

// Étoile à 8 branches (deux carrés superposés), motif géométrique islamique
export const starPoints = (cx: number, cy: number, r: number) => {
  const ri = (r * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : ri;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
};

export const Star: React.FC<{ size: number; fill?: string; stroke?: string; strokeWidth?: number; style?: React.CSSProperties }> = ({ size, fill = C.gold, stroke = 'none', strokeWidth = 0, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <polygon points={starPoints(50, 50, 46)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <circle cx="50" cy="50" r="15" fill="none" stroke={stroke === 'none' ? C.cream : stroke} strokeWidth="3" />
  </svg>
);
