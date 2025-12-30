
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EffectType, Particle, Point, AnimationStatus, ColorConfig, OutputFormat, ParticleShape } from '../types';
import { processImage } from '../services/imageProcessor';
// @ts-ignore
import * as Mp4Muxer from "mp4-muxer";

interface CanvasRendererProps {
  imageSrc: string;
  effect: EffectType;
  colorConfig: ColorConfig;
  speed: number;
  particleSizeMultiplier: number;
  sizeVariance: number;
  density: number; 
  shape: ParticleShape;
  glowIntensity: number; // Used now to control Opacity/Intensity of the additive blend
  trailPersistence: number; 
  onStatusChange: (status: AnimationStatus) => void;
  triggerAnimation: number;
  triggerRecording: number;
  outputFormat: OutputFormat;
}

const CANVAS_SIZE = 600;
const FOCAL_LENGTH = 400; 

// --- Easing Functions ---
const Easing = {
    linear: (t: number) => t,
    easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeInOutExpo: (t: number) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeOutElastic: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutBack: (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutQuad: (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  imageSrc,
  effect,
  colorConfig,
  speed,
  particleSizeMultiplier,
  sizeVariance,
  density,
  shape,
  glowIntensity,
  trailPersistence,
  onStatusChange,
  triggerAnimation,
  triggerRecording,
  outputFormat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  const isRecordingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);

  // WebM Recorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // MP4 Recorder Refs
  const muxerRef = useRef<any>(null);
  const videoEncoderRef = useRef<VideoEncoder | null>(null);

  const [points, setPoints] = useState<Point[]>([]);

  // 1. Image Processing
  useEffect(() => {
    if (!imageSrc) return;
    processImage(imageSrc, CANVAS_SIZE, CANVAS_SIZE, density)
      .then((extractedPoints) => {
        setPoints(extractedPoints);
        resetParticles(extractedPoints);
        drawStatic();
      })
      .catch((err) => console.error(err));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, density]); 

  // 2. React to Color/Effect/Shape/Glow/Trail changes
  useEffect(() => {
    if (points.length > 0) {
        resetParticles(points);
        drawStatic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, colorConfig, particleSizeMultiplier, shape, sizeVariance, glowIntensity]);

  const resetParticles = (pts: Point[]) => {
    particlesRef.current = pts.map((pt) => {
      let startX = 0, startY = 0, startZ = 0;
      let delay = Math.random(); 

      const randomZ = () => (Math.random() - 0.5) * 1000; 
      const randomOffscreen = () => (Math.random() - 0.5) * CANVAS_SIZE * 3;

      switch (effect) {
        case EffectType.STIPPLE:
           startX = randomOffscreen();
           startY = randomOffscreen();
           startZ = (Math.random()) * 800 + 200; 
           const centerDist = Math.sqrt(Math.pow(pt.x - CANVAS_SIZE/2, 2) + Math.pow(pt.y - CANVAS_SIZE/2, 2));
           delay = centerDist / (CANVAS_SIZE * 0.7); 
           break;
        case EffectType.GALACTIC:
           const angle = Math.random() * Math.PI * 2;
           const r = CANVAS_SIZE * 0.8; 
           startX = CANVAS_SIZE / 2 + Math.cos(angle) * r;
           startY = CANVAS_SIZE / 2 + Math.sin(angle) * r;
           startZ = randomZ() * 0.5;
           const dist = Math.sqrt(Math.pow(pt.x - CANVAS_SIZE/2, 2) + Math.pow(pt.y - CANVAS_SIZE/2, 2));
           delay = dist / (CANVAS_SIZE * 0.7); 
           break;
        case EffectType.LIQUID:
            startX = pt.x + Math.sin(pt.y * 0.05) * 50;
            startY = CANVAS_SIZE + 100;
            startZ = 0;
            delay = (CANVAS_SIZE - pt.y) / CANVAS_SIZE;
            break;
        case EffectType.GLITCH:
            startX = pt.x + (Math.random() - 0.5) * 200;
            startY = pt.y + (Math.random() - 0.5) * 200;
            startZ = 0;
            delay = Math.random();
            break;
        case EffectType.ELASTIC:
        case EffectType.VORTEX:
             const edge = Math.floor(Math.random() * 4);
             if (edge === 0) { startX = Math.random() * CANVAS_SIZE; startY = -50; }
             else if (edge === 1) { startX = CANVAS_SIZE + 50; startY = Math.random() * CANVAS_SIZE; }
             else if (edge === 2) { startX = Math.random() * CANVAS_SIZE; startY = CANVAS_SIZE + 50; }
             else { startX = -50; startY = Math.random() * CANVAS_SIZE; }
             startZ = randomZ();
             delay = Math.random();
             break;
        case EffectType.SCANWAVE:
            startX = pt.x;
            startY = pt.y;
            startZ = 0;
            delay = pt.y / CANVAS_SIZE;
            break;
        default: // ASSEMBLE
            startX = Math.random() * CANVAS_SIZE;
            startY = Math.random() * CANVAS_SIZE;
            startZ = randomZ();
            break;
      }

      let pShape: 'square' | 'circle' = 'square';
      if (shape === 'circle') pShape = 'circle';
      else if (shape === 'mixed') pShape = Math.random() > 0.5 ? 'circle' : 'square';

      const randomFactor = (Math.random() - 0.5) * sizeVariance; 
      const sizeVariation = 1 + randomFactor; 

      return {
        startX, startY, startZ,
        currentX: startX, currentY: startY, currentZ: startZ,
        targetX: pt.x, targetY: pt.y, targetZ: 0,
        size: density * particleSizeMultiplier, 
        sizeVariation,
        delay,
        shape: pShape
      };
    });
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle, scale: number) => {
      const finalSize = p.size * p.sizeVariation * scale;
      if (finalSize < 0.3) return;

      const drawX = Math.floor(p.currentX);
      const drawY = Math.floor(p.currentY);

      if (p.shape === 'circle') {
          // Performance optimization: small circles as rects are faster
          if (finalSize < 2) {
            ctx.fillRect(drawX - finalSize/2, drawY - finalSize/2, finalSize, finalSize);
          } else {
            ctx.beginPath();
            ctx.arc(drawX, drawY, finalSize / 2, 0, Math.PI * 2);
            ctx.fill();
          }
      } else {
          ctx.fillRect(drawX - finalSize/2, drawY - finalSize/2, finalSize, finalSize);
      }
  };

  const drawStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    // 1. Clear with Solid Black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. Match Animation Blend Mode Exactly
    // This ensures the static preview looks exactly like the high-energy animation frame
    if (glowIntensity > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 + (glowIntensity / 100); 
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
    }
    
    ctx.shadowBlur = 0;

    const gradient = colorConfig.mode === 'gradient' 
        ? ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE) 
        : null;
    
    if (gradient) {
        gradient.addColorStop(0, colorConfig.colorA);
        gradient.addColorStop(1, colorConfig.colorB);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = colorConfig.colorA;
    }

    particlesRef.current.forEach(p => {
        // Draw exactly at target, no Z depth (since it's final state)
        drawParticle(ctx, { ...p, currentX: p.targetX, currentY: p.targetY, currentZ: 0 }, 1);
    });

    // Reset Context
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  };

  const finishRecording = async () => {
      try {
          if (videoEncoderRef.current && muxerRef.current) {
              await videoEncoderRef.current.flush();
              muxerRef.current.finalize();
              const buffer = muxerRef.current.target.buffer;
              const blob = new Blob([buffer], { type: 'video/mp4' });
              downloadBlob(blob, 'mp4');
          }
          else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
          }
      } catch (e) {
          console.error("Encoding/Recording failed", e);
          alert("Recording failed. Please try again.");
          cleanupRecordingState();
      }
      
      videoEncoderRef.current = null;
      muxerRef.current = null;
  };

  const cleanupRecordingState = () => {
      onStatusChange('idle');
      isRecordingRef.current = false;
      setIsRecording(false);
  };

  const downloadBlob = (blob: Blob, ext: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-stipple-magic-${effect.toLowerCase()}.${ext}`;
      a.click();
      cleanupRecordingState();
  };

  const startAnimationLoop = useCallback((isRecordingActive: boolean) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    let startTime: number | null = null;
    const animDuration = 2500 / speed; 
    
    // Deterministic Frame Counting for Video Recording
    let frameCount = 0;
    const RECORDING_FPS = 60;
    const MS_PER_FRAME = 1000 / RECORDING_FPS;

    const animate = async (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      let currentTime = timestamp;
      if (isRecordingActive) {
          currentTime = (startTime || 0) + (frameCount * MS_PER_FRAME);
      }

      // Pure animation progress (0 to 1)
      const rawProgress = (currentTime - (startTime || 0)) / animDuration;
      const progress = Math.min(rawProgress, 1.0); 

      // --- Drawing Logic ---
      
      // 1. Trail Logic
      // We use simple trail persistence. 
      // IMPORTANT: We do NOT force a hard clear at the end. 
      // This ensures the final frame retains the "glow" of accumulated trails.
      ctx.globalCompositeOperation = 'source-over';
      
      let currentClearAlpha = 0.4 - (trailPersistence * 0.38); 
      if (effect === EffectType.GLITCH) currentClearAlpha = 0.4;

      ctx.fillStyle = `rgba(0, 0, 0, ${currentClearAlpha})`;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // --- Color & Gradient Setup ---
      let fillStyle: string | CanvasGradient = colorConfig.colorA;
      if (colorConfig.mode === 'gradient') {
          const g = ctx.createLinearGradient(0,0, CANVAS_SIZE, CANVAS_SIZE);
          g.addColorStop(0, colorConfig.colorA);
          g.addColorStop(1, colorConfig.colorB);
          fillStyle = g;
      }
      ctx.fillStyle = fillStyle;
      
      // --- Glow / Blend Mode Logic ---
      if (glowIntensity > 0) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.5 + (glowIntensity / 100); 
      } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
      }

      ctx.shadowBlur = 0; 
      
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;

      particlesRef.current.forEach(p => {
         const staggerWindow = 0.5;
         const moveDuration = 0.5;
         const myStart = p.delay * staggerWindow;
         
         let t = 0;
         if (progress > myStart) t = (progress - myStart) / moveDuration;
         t = Math.max(0, Math.min(1, t));

         if (t === 0 && effect !== EffectType.SCANWAVE) return; 

         let ease = t;
         switch (effect) {
            case EffectType.STIPPLE: ease = Easing.easeInOutExpo(t); break;
            case EffectType.ELASTIC: ease = Easing.easeOutElastic(t); break;
            case EffectType.ASSEMBLE: ease = Easing.easeInOutExpo(t); break;
            case EffectType.VORTEX: ease = Easing.easeInOutCubic(t); break;
            case EffectType.GALACTIC: ease = Easing.easeInOutCubic(t); break;
            case EffectType.LIQUID: ease = Easing.easeOutBack(t); break;
            case EffectType.GLITCH: ease = t < 0.2 ? 0 : t < 0.5 ? 0.2 : t < 0.8 ? 0.8 : 1; break;
            case EffectType.SCANWAVE: ease = t; break;
         }

         // Calculate 3D Position
         let x = p.startX + (p.targetX - p.startX) * ease;
         let y = p.startY + (p.targetY - p.startY) * ease;
         let z = p.startZ + (p.targetZ - p.startZ) * ease;

         if (effect === EffectType.GALACTIC) {
            const angleOffset = (1 - ease) * Math.PI * 2;
            const currentX2D = p.targetX + (p.startX - p.targetX) * (1-ease);
            const currentY2D = p.targetY + (p.startY - p.targetY) * (1-ease);
            const cos = Math.cos(angleOffset);
            const sin = Math.sin(angleOffset);
            x = cx + (currentX2D - cx) * cos - (currentY2D - cy) * sin;
            y = cy + (currentX2D - cx) * sin + (currentY2D - cy) * cos;
         } 
         else if (effect === EffectType.STIPPLE) {
             if (t < 1) {
                 const timeVal = isRecordingActive ? frameCount * 16 : timestamp;
                 const noise = Math.sin(timeVal * 0.005 + p.startX) * 10 * (1-t);
                 x += noise;
                 z += noise * 2;
             }
         }
         else if (effect === EffectType.GLITCH) {
             if (t < 1) {
                x = p.targetX + (Math.random()-0.5) * 50 * (1-t);
                y = p.targetY + (Math.random()-0.5) * 50 * (1-t);
                if (Math.random() > 0.8) return; 
             } else {
                 x = p.targetX; y = p.targetY;
             }
         }
         else if (effect === EffectType.SCANWAVE) {
             if (t > 0 && t < 0.2) {
                 ctx.fillStyle = '#ffffff'; x = p.targetX; y = p.targetY; z = 0;
             } else if (t >= 0.2) {
                 ctx.fillStyle = fillStyle; x = p.targetX; y = p.targetY; z = 0;
             } else { return; }
         }

         const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
         const screenX = cx + (x - cx) * scale;
         const screenY = cy + (y - cy) * scale;

         p.currentX = screenX;
         p.currentY = screenY;
         p.currentZ = z;

         drawParticle(ctx, p, scale);
         
         if (effect === EffectType.SCANWAVE) ctx.fillStyle = fillStyle;
      });

      // Reset Opacity
      ctx.globalAlpha = 1.0;

      // --- Encoding Logic ---
      if (isRecordingActive) {
          if (videoEncoderRef.current && muxerRef.current) {
              const videoTimestamp = frameCount * (1000 / RECORDING_FPS) * 1000;
              const frame = new VideoFrame(canvasRef.current, { timestamp: videoTimestamp });
              videoEncoderRef.current.encode(frame, { keyFrame: frameCount % 30 === 0 });
              frame.close();
          }
      }

      frameCount++;

      if (progress < 1.0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        if (isRecordingActive) {
            if (videoEncoderRef.current) {
                 const videoTimestamp = frameCount * (1000 / RECORDING_FPS) * 1000;
                 const frame = new VideoFrame(canvasRef.current, { timestamp: videoTimestamp });
                 videoEncoderRef.current.encode(frame, { keyFrame: true });
                 frame.close();
            }
            await finishRecording();
        } else {
            // CRITICAL FIX: Do NOT call drawStatic() here.
            // We want the final frame of the animation (which has the perfect glow and settled particles)
            // to simply freeze. Calling drawStatic() would clear the canvas and remove the glow, causing a flicker.
            onStatusChange('finished');
        }
      }
    };

    onStatusChange(isRecordingActive ? 'recording' : 'playing');
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [speed, effect, colorConfig, shape, sizeVariance, glowIntensity, trailPersistence, onStatusChange]);

  // Handle Trigger Recording
  useEffect(() => {
    if (triggerRecording > 0 && canvasRef.current) {
      if (isRecordingRef.current) return;
      isRecordingRef.current = true;
      setIsRecording(true);

      resetParticles(points);
      
      const useMp4 = outputFormat === 'mp4';
      const supportsVideoEncoder = typeof window.VideoEncoder === 'function' && typeof window.VideoFrame === 'function';

      if (useMp4 && supportsVideoEncoder) {
          try {
              const muxer = new Mp4Muxer.Muxer({
                  target: new Mp4Muxer.ArrayBufferTarget(),
                  video: { codec: 'avc', width: CANVAS_SIZE, height: CANVAS_SIZE },
                  fastStart: 'in-memory', 
              });

              const encoder = new VideoEncoder({
                  output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                  error: (e) => { console.error("Encoder error", e); cleanupRecordingState(); },
              });

              encoder.configure({
                  codec: 'avc1.42E01E', width: CANVAS_SIZE, height: CANVAS_SIZE, bitrate: 8_000_000, framerate: 60,
              });

              muxerRef.current = muxer;
              videoEncoderRef.current = encoder;
              startAnimationLoop(true);
              return; 
          } catch (e) {
              alert("MP4 initialization failed.");
              cleanupRecordingState();
              return;
          }
      } 
      
      // Fallback to WebM
      const stream = canvasRef.current.captureStream(60);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        downloadBlob(blob, 'webm');
      };
      recorder.onerror = (e) => cleanupRecordingState();
      
      recorder.start();
      startAnimationLoop(true);
    }
    
    // Cleanup function for useEffect
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRecording]);

  useEffect(() => {
    if (triggerAnimation > 0) {
        if (isRecordingRef.current) return;
        resetParticles(points);
        startAnimationLoop(false);
    }
    return () => {
         if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAnimation]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full h-auto max-w-[400px] md:max-w-[600px] aspect-square block mx-auto"
        // Use CSS filter for the "Glow" look in preview mode (optional, but 'lighter' mode is usually enough)
        style={{
             // Only apply CSS glow if NOT recording (browsers sometimes don't capture CSS filters in streams properly)
             // and keep it subtle to avoid layout thrashing.
             filter: isRecording ? 'none' : `drop-shadow(0 0 ${glowIntensity * 0.5}px ${colorConfig.mode === 'solid' ? colorConfig.colorA : colorConfig.colorB})`
        }}
      />
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full animate-pulse z-20">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span className="text-xs font-bold uppercase tracking-wider">REC</span>
        </div>
      )}
    </div>
  );
};

export default CanvasRenderer;
