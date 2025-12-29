
export enum EffectType {
  ASSEMBLE = 'ASSEMBLE', // Renamed from CONVERGE for clarity
  ELASTIC = 'ELASTIC',   // New: Bouncy arrival
  GALACTIC = 'GALACTIC', // Renamed/Refined Spiral
  GLITCH = 'GLITCH',     // New: Cyberpunk teleport
  LIQUID = 'LIQUID',     // New: Sine wave flow
  VORTEX = 'VORTEX',     // Existing
  SCANWAVE = 'SCANWAVE', // Existing
}

export type ColorMode = 'solid' | 'gradient';

export type OutputFormat = 'webm' | 'mp4';

export interface ColorConfig {
    mode: ColorMode;
    colorA: string; // Primary/Start Color
    colorB: string; // Secondary/End Color
}

export interface Particle {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  size: number;
  delay: number; // 0 to 1 range relative to total animation time
  color?: string; // Optional per-particle override (for complex gradients)
}

export interface Point {
  x: number;
  y: number;
  color: string;
}

export type AnimationStatus = 'idle' | 'playing' | 'recording' | 'finished';
