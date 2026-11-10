import React from 'react';
import { Composition } from 'remotion';
import { Quiz, QuizProps } from './Quiz';

const defaults: QuizProps = { titre: 'QuIslam', total: 30, logo: null, durationInFrames: 300, segments: [] };

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Quiz"
    component={Quiz}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={300}
    defaultProps={defaults}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, props.durationInFrames) })}
  />
);
