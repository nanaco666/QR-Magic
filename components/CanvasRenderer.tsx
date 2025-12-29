import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EffectType, Particle, Point, AnimationStatus, ColorTheme } from '../types';
import { processImage } from '../services/imageProcessor';

interface CanvasRendererProps {
  imageSrc: string;
  effect: EffectType;
  colorTheme: ColorTheme;
  speed: number;
  particleSizeMultiplier: number;
  onStatusChange: (status: AnimationStatus) => void;
  triggerAnimation: number;
  triggerRecording: number;
}

const CANVAS_SIZE = 600;

// Helper to create a pre-colored version of the QR code
const generateColoredImage = (
    img: HTMLImageElement,
    width: number,
    height: number,
    theme: ColorTheme
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
  
    // 1. Fill background black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Inverted Image (Assuming standard QR: Black on White -> White on Black)
    ctx.filter = 'invert(1)';
    ctx.drawImage(img, 0, 0, width, height);
    ctx.filter = 'none';
  
    // 3. Multiply with Theme Color to tint the white parts
    ctx.globalCompositeOperation = 'multiply';
    
    if (theme === 'white') {
       ctx.fillStyle = '#ffffff';
       ctx.fillRect(0,0,width,height);
    } else if (theme === 'matrix') {
       ctx.fillStyle = '#00ff00';
       ctx.fillRect(0,0,width,height);
    } else if (theme === 'neon') {
       const grad = ctx.createLinearGradient(0, 0, width, height);
       grad.addColorStop(0, '#00ffff');
       grad.addColorStop(1, '#ff00ff');
       ctx.fillStyle = grad;
       ctx.fillRect(0,0,width,height);
    } else if (theme === 'fire') {
       const grad = ctx.createLinearGradient(0, 0, width, height);
       grad.addColorStop(0, '#ffff00');
       grad.addColorStop(0.5, '#ff8800');
       grad.addColorStop(1, '#ff0000');
       ctx.fillStyle = grad;
       ctx.fillRect(0,0,width,height);
    } else if (theme === 'rainbow') {
       const grad = ctx.createLinearGradient(0, 0, width, height);
       grad.addColorStop(0, '#ff0000');
       grad.addColorStop(0.17, '#ff7f00');
       grad.addColorStop(0.33, '#ffff00');
       grad.addColorStop(0.5, '#00ff00');
       grad.addColorStop(0.67, '#0000ff');
       grad.addColorStop(0.83, '#4b0082');
       grad.addColorStop(1, '#9400d3');
       ctx.fillStyle = grad;
       ctx.fillRect(0,0,width,height);
    }
  
    // 4. Reset
    ctx.globalCompositeOperation = 'source-over';
    return canvas;
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  imageSrc,
  effect,
  colorTheme,
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

  // Initialize: Process image and get points
  useEffect(() => {
    if (!imageSrc) return;

    processImage(imageSrc, CANVAS_SIZE, CANVAS_SIZE, 3)
      .then((extractedPoints) => {
        setPoints(extractedPoints);
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          originalImageRef.current = img;
          // Generate initial colored image
          coloredImageRef.current = generateColoredImage(img, CANVAS_SIZE, CANVAS_SIZE, colorTheme);
          
          resetParticles(extractedPoints, effect);
          drawStatic();
        };
      })
      .catch((err) => console.error(err));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  // Handle color theme change specifically to regenerate the static image
  useEffect(() => {
      if (originalImageRef.current) {
          coloredImageRef.current = generateColoredImage(originalImageRef.current, CANVAS_SIZE, CANVAS_SIZE, colorTheme);
          // If idle, redraw to show new color immediately
          drawStatic();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorTheme]);

  // Handle visual parameter changes (soft reset)
  useEffect(() => {
    if (points.length > 0) {
      resetParticles(points, effect);
      drawStatic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, points, colorTheme, particleSizeMultiplier]); 

  const getThemeColor = (x: number, y: number, theme: ColorTheme): string => {
    switch (theme) {
      case 'matrix': return '#00ff00';
      case 'fire': return `rgb(255, ${Math.floor(Math.random() * 150)}, 0)`;
      case 'neon': 
        // Gradient from cyan to purple
        const ratio = x / CANVAS_SIZE;
        const r = Math.floor(0 + ratio * 200);
        const g = Math.floor(255 - ratio * 100);
        const b = 255;
        return `rgb(${r},${g},${b})`;
      case 'rainbow':
        return `hsl(${(x + y) / 5 % 360}, 80%, 60%)`;
      case 'white':
      default: return '#ffffff';
    }
  };

  const resetParticles = (pts: Point[], currentEffect: EffectType) => {
    particlesRef.current = pts.map((pt) => {
      let startX = 0, startY = 0, delay = 0;

      switch (currentEffect) {
        case EffectType.CONVERGE:
          startX = Math.random() * CANVAS_SIZE;
          startY = Math.random() * CANVAS_SIZE;
          delay = Math.random() * 60;
          break;
        case EffectType.SPIRAL:
           const angle = Math.random() * Math.PI * 2;
           const radius = Math.random() * CANVAS_SIZE * 0.1;
           startX = CANVAS_SIZE / 2 + Math.cos(angle) * radius;
           startY = CANVAS_SIZE / 2 + Math.sin(angle) * radius;
           const dist = Math.sqrt(Math.pow(pt.x - CANVAS_SIZE/2, 2) + Math.pow(pt.y - CANVAS_SIZE/2, 2));
           delay = dist / 2;
          break;
        case EffectType.MATRIX:
          startX = pt.x;
          startY = -Math.random() * CANVAS_SIZE; 
          delay = pt.x / 10 + Math.random() * 20;
          break;
        case EffectType.EXPLOSION:
          startX = CANVAS_SIZE / 2;
          startY = CANVAS_SIZE / 2;
          delay = Math.random() * 30;
          break;
        case EffectType.VORTEX:
          const vAngle = Math.random() * Math.PI * 2;
          // Start far outside
          startX = CANVAS_SIZE / 2 + Math.cos(vAngle) * CANVAS_SIZE;
          startY = CANVAS_SIZE / 2 + Math.sin(vAngle) * CANVAS_SIZE;
          delay = Math.random() * 50;
          break;
        case EffectType.RAINDROP:
          startX = pt.x;
          startY = -10;
          delay = (pt.y / CANVAS_SIZE) * 100 + Math.random() * 20;
          break;
        case EffectType.SCANWAVE:
          startX = pt.x + (Math.random() - 0.5) * 20; // Slight jitter
          startY = pt.y; 
          // Delay purely based on Y to simulate a scanline
          delay = (pt.y / CANVAS_SIZE) * 120;
          break;
      }

      // Base size logic
      let baseSize = 2;
      if (currentEffect === EffectType.MATRIX) baseSize = 3;
      
      return {
        x: startX,
        y: startY,
        targetX: pt.x,
        targetY: pt.y,
        vx: 0,
        vy: 0,
        color: getThemeColor(pt.x, pt.y, colorTheme),
        size: baseSize * particleSizeMultiplier, 
        delay: delay,
        active: false,
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

    // Draw the COLORED ghost image
    if (coloredImageRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        // No filter needed, coloredImage is already processed
        ctx.drawImage(coloredImageRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.restore();
    }

    particlesRef.current.forEach(p => {
        // Hide particles that are supposed to start "off screen" or hidden for certain effects
        if (effect === EffectType.SCANWAVE) return; // Start invisible
        if (effect === EffectType.MATRIX && p.y < 0) return;

        if (p.x >= 0 && p.x <= CANVAS_SIZE && p.y >= 0 && p.y <= CANVAS_SIZE) {
            ctx.fillStyle = p.color; 
            ctx.globalAlpha = 0.5;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1.0;
        }
    });
  };

  const startAnimationLoop = useCallback((isRecording: boolean) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let progress = 0;
    
    // Base duration is approx 300 units.
    const finishThreshold = 250; 
    const fadeStart = 200;
    const totalDuration = 320; 

    const animate = () => {
      progress += 1 * speed; // Speed multiplier controls time flow

      // Clear with trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; 
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      particlesRef.current.forEach((p) => {
        // Activate based on progress
        if (progress > p.delay) {
          p.active = true;
        }

        if (p.active) {
          // Special logic for SCANWAVE: particles appear in place, maybe flash
          if (effect === EffectType.SCANWAVE) {
             p.x = p.targetX;
             p.y = p.targetY;
             // Flash effect when just activated
             const age = progress - p.delay;
             if (age < 10) {
                 ctx.fillStyle = '#ffffff';
                 ctx.shadowBlur = 10;
                 ctx.shadowColor = '#ffffff';
             } else {
                 ctx.fillStyle = p.color;
                 ctx.shadowBlur = 0;
             }
             ctx.fillRect(p.x, p.y, p.size, p.size);
             return; 
          }

          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          
          let ease = 0.05;
          if (effect === EffectType.EXPLOSION) ease = 0.08;
          if (effect === EffectType.MATRIX) ease = 0.1;
          if (effect === EffectType.RAINDROP) ease = 0.15;
          if (effect === EffectType.VORTEX) ease = 0.04;

          const adjustedEase = Math.min(ease * speed, 0.9); // Cap ease

          p.x += dx * adjustedEase;
          p.y += dy * adjustedEase;

          // Snap to grid
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
            p.x = p.targetX;
            p.y = p.targetY;
          }

          // Dynamic color during flight
          const isMoving = Math.abs(dx) > 1 || Math.abs(dy) > 1;
          
          if (isMoving) {
             ctx.fillStyle = p.color;
             if (colorTheme === 'neon' || colorTheme === 'fire') {
                 ctx.shadowBlur = 5;
                 ctx.shadowColor = p.color;
             }
          } else {
             ctx.shadowBlur = 0;
             ctx.fillStyle = p.color;
          }

          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.shadowBlur = 0; // Reset
        }
      });

      // Fade in the COLORED image at the end
      if (progress > fadeStart && coloredImageRef.current) {
        const opacity = (progress - fadeStart) / (finishThreshold - fadeStart);
        ctx.save();
        ctx.globalAlpha = Math.min(opacity, 1);
        // Direct draw, no invert, because generated image is already correct color
        ctx.drawImage(coloredImageRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.restore();
      }

      if (progress < totalDuration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        onStatusChange('finished');
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
      }
    };

    onStatusChange(isRecording ? 'recording' : 'playing');
    animate();
  }, [effect, speed, colorTheme, onStatusChange]);

  // Handle Recording Trigger
  useEffect(() => {
    if (triggerRecording > 0 && canvasRef.current) {
      resetParticles(points, effect);
      
      const stream = canvasRef.current.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm'; 

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 }); // Increased bitrate
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

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

  // Handle Preview Trigger
  useEffect(() => {
    if (triggerAnimation > 0) {
        resetParticles(points, effect);
        startAnimationLoop(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAnimation]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full h-auto max-w-[400px] md:max-w-[600px] aspect-square block mx-auto"
      />
      {triggerRecording > 0 && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full animate-pulse">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span className="text-xs font-bold uppercase tracking-wider">Recording</span>
        </div>
      )}
    </div>
  );
};

export default CanvasRenderer;
