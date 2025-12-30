
export enum EffectType {
  ASSEMBLE = 'ASSEMBLE', 
  ELASTIC = 'ELASTIC',   
  GALACTIC = 'GALACTIC', 
  GLITCH = 'GLITCH',     
  LIQUID = 'LIQUID',     
  VORTEX = 'VORTEX',     
  SCANWAVE = 'SCANWAVE', 
  STIPPLE = 'STIPPLE',   // New: 3D Stipple effect
}

export type ColorMode = 'solid' | 'gradient';
export type ParticleShape = 'square' | 'circle' | 'mixed'; // New: Shape control

export type OutputFormat = 'webm' | 'mp4';

export interface ColorConfig {
    mode: ColorMode;
    colorA: string; 
    colorB: string; 
}

export interface Particle {
  startX: number;
  startY: number;
  startZ: number;   // New: 3D Depth Start
  
  currentX: number;
  currentY: number;
  currentZ: number; // New: 3D Depth Current

  targetX: number;
  targetY: number;
  targetZ: number;  // New: Usually 0 for the flat QR

  size: number;
  sizeVariation: number; // New: Random factor for organic look (0.5 - 1.5)
  delay: number; 
  shape: 'square' | 'circle'; // New: Per-particle shape
  color?: string; 
}

export interface Point {
  x: number;
  y: number;
  color: string;
}

export type AnimationStatus = 'idle' | 'playing' | 'recording' | 'finished';
