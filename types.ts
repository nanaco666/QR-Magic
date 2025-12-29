export enum EffectType {
  CONVERGE = 'CONVERGE',
  SPIRAL = 'SPIRAL',
  MATRIX = 'MATRIX',
  EXPLOSION = 'EXPLOSION',
  VORTEX = 'VORTEX',
  RAINDROP = 'RAINDROP',
  SCANWAVE = 'SCANWAVE',
}

export type ColorTheme = 'white' | 'matrix' | 'neon' | 'fire' | 'rainbow';

export interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  delay: number;
  active: boolean;
}

export interface Point {
  x: number;
  y: number;
  color: string;
}

export type AnimationStatus = 'idle' | 'playing' | 'recording' | 'finished';
