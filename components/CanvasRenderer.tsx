
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EffectType, Particle, Point, AnimationStatus, ColorConfig } from '../types';
import { processImage } from '../services/imageProcessor';

interface CanvasRendererProps {
  imageSrc: string;
  effect: EffectType;
  colorConfig: ColorConfig;
  speed: number;
  particleSizeMultiplier: number;
  onStatusChange: (status: AnimationStatus) => void;
  triggerAnimation: number;
  triggerRecording: number;
}

const CANVAS_SIZE = 600;

// --- Easing Functions ---
// t: 0 to 1
const Easing = {
    linear: (t: number) => t,
    easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeOutElastic: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutBack: (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  imageSrc,
  effect,
  colorConfig,
  speed,
  particleSizeMultiplier,
  onStatusChange,
  triggerAnimation,
  triggerRecording,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const coloredImageRef = useRef<HTMLCanvasElement | null>(null);

  const [points, setPoints] = useState<Point[]>([]);

  // 1. Image Processing
  useEffect(() => {
    if (!imageSrc) return;
    processImage(imageSrc, CANVAS_SIZE, CANVAS_SIZE, 3)
      .then((extractedPoints) => {
        setPoints(extractedPoints);
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          originalImageRef.current = img;
          updateStaticVisuals(extractedPoints);
        };
      })
      .catch((err) => console.error(err));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  // 2. React to Color/Effect changes immediately
  useEffect(() => {
    if (points.length > 0) {
        updateStaticVisuals(points);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, colorConfig, particleSizeMultiplier]);

  const updateStaticVisuals = (currentPoints: Point[]) => {
      // Regenerate the "ghost" background image
      if (originalImageRef.current) {
          coloredImageRef.current = generateColoredImage(originalImageRef.current, CANVAS_SIZE, CANVAS_SIZE, colorConfig);
      }
      // Reset particles to end state
      resetParticles(currentPoints);
      // Draw one frame
      drawStatic();
  };

  const generateColoredImage = (
    img: HTMLImageElement,
    width: number,
    height: number,
    config: ColorConfig
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
  
    // Background Black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw Inverted Image
    ctx.filter = 'invert(1)';
    ctx.drawImage(img, 0, 0, width, height);
    ctx.filter = 'none';
  
    // Blend Mode Magic
    ctx.globalCompositeOperation = 'multiply';
    
    if (config.mode === 'solid') {
       ctx.fillStyle = config.colorA;
    } else {
       const grad = ctx.createLinearGradient(0, 0, width, height);
       grad.addColorStop(0, config.colorA);
       grad.addColorStop(1, config.colorB);
       ctx.fillStyle = grad;
    }
    
    ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation = 'source-over';
    return canvas;
  };

  const resetParticles = (pts: Point[]) => {
    particlesRef.current = pts.map((pt) => {
      // Logic to determine Start positions based on Effect
      let startX = 0, startY = 0;
      // Delay distribution (0.0 to 1.0)
      let delay = Math.random(); 

      switch (effect) {
        case EffectType.GALACTIC:
           const angle = Math.random() * Math.PI * 2;
           const r = CANVAS_SIZE * 0.8; // Large radius
           startX = CANVAS_SIZE / 2 + Math.cos(angle) * r;
           startY = CANVAS_SIZE / 2 + Math.sin(angle) * r;
           // Delay based on distance from center
           const dist = Math.sqrt(Math.pow(pt.x - CANVAS_SIZE/2, 2) + Math.pow(pt.y - CANVAS_SIZE/2, 2));
           delay = dist / (CANVAS_SIZE * 0.7); 
           break;
        case EffectType.LIQUID:
            startX = pt.x + Math.sin(pt.y * 0.05) * 50;
            startY = CANVAS_SIZE + 100; // Start below screen
            delay = (CANVAS_SIZE - pt.y) / CANVAS_SIZE; // Bottom up
            break;
        case EffectType.GLITCH:
            // Start near target but randomized
            startX = pt.x + (Math.random() - 0.5) * 200;
            startY = pt.y + (Math.random() - 0.5) * 200;
            delay = Math.random();
            break;
        case EffectType.ELASTIC:
        case EffectType.VORTEX:
            // Start from edges
             const edge = Math.floor(Math.random() * 4);
             if (edge === 0) { startX = Math.random() * CANVAS_SIZE; startY = -50; }
             else if (edge === 1) { startX = CANVAS_SIZE + 50; startY = Math.random() * CANVAS_SIZE; }
             else if (edge === 2) { startX = Math.random() * CANVAS_SIZE; startY = CANVAS_SIZE + 50; }
             else { startX = -50; startY = Math.random() * CANVAS_SIZE; }
             delay = Math.random();
             break;
        case EffectType.SCANWAVE:
            startX = pt.x;
            startY = pt.y;
            delay = pt.y / CANVAS_SIZE;
            break;
        default: // ASSEMBLE
            startX = Math.random() * CANVAS_SIZE;
            startY = Math.random() * CANVAS_SIZE;
            break;
      }

      return {
        startX,
        startY,
        currentX: startX,
        currentY: startY,
        targetX: pt.x,
        targetY: pt.y,
        size: 2 * particleSizeMultiplier, 
        delay: delay,
      };
    });
  };

  const drawStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (coloredImageRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.drawImage(coloredImageRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.restore();
    }
    
    // Static Draw: show all particles at target
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
        // For GLITCH, show target. For others, show target.
        if (effect === EffectType.SCANWAVE) return; 
        ctx.fillRect(p.targetX, p.targetY, p.size, p.size);
    });
  };

  const startAnimationLoop = useCallback((isRecording: boolean) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let startTime: number | null = null;
    const duration = 2500 / speed; // 2.5s base duration

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const rawProgress = (timestamp - startTime) / duration;
      const progress = Math.min(rawProgress, 1.0); // Cap at 1

      // 1. Trail Effect (Fade previous frame)
      // Glitch effect needs less trails to look snappy
      ctx.fillStyle = effect === EffectType.GLITCH ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 2. Prepare Style
      let fillStyle: string | CanvasGradient = colorConfig.colorA;
      if (colorConfig.mode === 'gradient') {
          const g = ctx.createLinearGradient(0,0, CANVAS_SIZE, CANVAS_SIZE);
          g.addColorStop(0, colorConfig.colorA);
          g.addColorStop(1, colorConfig.colorB);
          fillStyle = g;
      }
      ctx.fillStyle = fillStyle;

      // 3. Update & Draw Particles
      particlesRef.current.forEach(p => {
         // Calculate individual particle progress based on its delay
         // We map the global progress (0->1) to the particle's timeline
         // Let's say particles start appearing from t=0.0 to t=0.6
         // And take 0.4 time to settle.
         const staggerWindow = 0.6;
         const moveDuration = 0.4;
         
         // When does this particle start moving?
         const myStart = p.delay * staggerWindow;
         
         let t = 0;
         if (progress > myStart) {
             t = (progress - myStart) / moveDuration;
         }
         t = Math.max(0, Math.min(1, t)); // Clamp 0-1

         if (t === 0 && effect !== EffectType.SCANWAVE) {
             // Not started yet
             // Optionally draw at start pos
             // ctx.fillRect(p.startX, p.startY, p.size, p.size);
             return; 
         }

         let ease = t;
         // Apply Easing based on Effect
         switch (effect) {
            case EffectType.ELASTIC: ease = Easing.easeOutElastic(t); break;
            case EffectType.ASSEMBLE: ease = Easing.easeOutExpo(t); break;
            case EffectType.VORTEX: ease = Easing.easeOutCubic(t); break;
            case EffectType.GALACTIC: ease = Easing.easeOutCubic(t); break;
            case EffectType.LIQUID: ease = Easing.easeOutBack(t); break;
            case EffectType.GLITCH: 
                // Step function
                ease = t < 0.2 ? 0 : t < 0.5 ? 0.2 : t < 0.8 ? 0.8 : 1; 
                break;
            case EffectType.SCANWAVE: ease = t; break; // Linear is fine, controlled by delay
         }

         // Interpolate Position
         if (effect === EffectType.GALACTIC) {
            // Spiral math
            const angleOffset = (1 - ease) * Math.PI * 2; // Spin 1 full rotation
            const currentX = p.targetX + (p.startX - p.targetX) * (1-ease);
            const currentY = p.targetY + (p.startY - p.targetY) * (1-ease);
            
            // Rotate around center
            const cx = CANVAS_SIZE/2; 
            const cy = CANVAS_SIZE/2;
            const cos = Math.cos(angleOffset);
            const sin = Math.sin(angleOffset);
            
            p.currentX = cx + (currentX - cx) * cos - (currentY - cy) * sin;
            p.currentY = cy + (currentX - cx) * sin + (currentY - cy) * cos;

         } else if (effect === EffectType.GLITCH) {
            if (t < 1) {
                // Random jitter
                p.currentX = p.targetX + (Math.random()-0.5) * 50 * (1-t);
                p.currentY = p.targetY + (Math.random()-0.5) * 50 * (1-t);
                // Randomly hide
                if (Math.random() > 0.8) return;
            } else {
                p.currentX = p.targetX;
                p.currentY = p.targetY;
            }
         } else if (effect === EffectType.SCANWAVE) {
             if (t > 0 && t < 0.2) {
                 // Flash white line
                 ctx.fillStyle = '#ffffff';
                 p.currentX = p.targetX;
                 p.currentY = p.targetY;
             } else if (t >= 0.2) {
                 ctx.fillStyle = fillStyle;
                 p.currentX = p.targetX;
                 p.currentY = p.targetY;
             } else {
                 return; // Invisible
             }
         } else {
             // Standard Interpolation
             p.currentX = p.startX + (p.targetX - p.startX) * ease;
             p.currentY = p.startY + (p.targetY - p.startY) * ease;
         }

         ctx.fillRect(p.currentX, p.currentY, p.size, p.size);
         
         // Restore fill style if changed (e.g. Scanwave)
         if (effect === EffectType.SCANWAVE) ctx.fillStyle = fillStyle;
      });

      // 4. Fade in final clean image at the end for scanability
      if (progress > 0.8 && coloredImageRef.current) {
          const alpha = (progress - 0.8) / 0.2;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.drawImage(coloredImageRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
          ctx.restore();
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        onStatusChange('finished');
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
      }
    };

    onStatusChange(isRecording ? 'recording' : 'playing');
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [speed, effect, colorConfig, onStatusChange]);

  // Trigger Logic (Same as before)
  useEffect(() => {
    if (triggerRecording > 0 && canvasRef.current) {
      resetParticles(points);
      const stream = canvasRef.current.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'; 
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12000000 }); // High bitrate
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-magic-${effect.toLowerCase()}.webm`;
        a.click();
        onStatusChange('idle');
      };
      recorder.start();
      startAnimationLoop(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRecording]);

  useEffect(() => {
    if (triggerAnimation > 0) {
        resetParticles(points);
        startAnimationLoop(false);
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
      />
      {triggerRecording > 0 && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full animate-pulse z-20">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span className="text-xs font-bold uppercase tracking-wider">REC</span>
        </div>
      )}
    </div>
  );
};

export default CanvasRenderer;
