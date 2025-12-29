
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EffectType, Particle, Point, AnimationStatus, ColorConfig, OutputFormat } from '../types';
import { processImage } from '../services/imageProcessor';
// @ts-ignore
import * as Mp4Muxer from "mp4-muxer";

interface CanvasRendererProps {
  imageSrc: string;
  effect: EffectType;
  colorConfig: ColorConfig;
  speed: number;
  particleSizeMultiplier: number; // Controls visual scale (0.5x - 3.0x)
  density: number; // Controls sampling stride (1 - 6)
  onStatusChange: (status: AnimationStatus) => void;
  triggerAnimation: number;
  triggerRecording: number;
  outputFormat: OutputFormat;
}

const CANVAS_SIZE = 600;

// --- Easing Functions ---
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
  density,
  onStatusChange,
  triggerAnimation,
  triggerRecording,
  outputFormat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  // Guard to prevent multiple recordings starting simultaneously
  const isRecordingRef = useRef(false);
  // UI State for the REC badge visibility
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

  // 2. React to Color/Effect changes immediately
  useEffect(() => {
    if (points.length > 0) {
        resetParticles(points);
        drawStatic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, colorConfig, particleSizeMultiplier]);

  const resetParticles = (pts: Point[]) => {
    particlesRef.current = pts.map((pt) => {
      let startX = 0, startY = 0;
      let delay = Math.random(); 

      switch (effect) {
        case EffectType.GALACTIC:
           const angle = Math.random() * Math.PI * 2;
           const r = CANVAS_SIZE * 0.8; 
           startX = CANVAS_SIZE / 2 + Math.cos(angle) * r;
           startY = CANVAS_SIZE / 2 + Math.sin(angle) * r;
           const dist = Math.sqrt(Math.pow(pt.x - CANVAS_SIZE/2, 2) + Math.pow(pt.y - CANVAS_SIZE/2, 2));
           delay = dist / (CANVAS_SIZE * 0.7); 
           break;
        case EffectType.LIQUID:
            startX = pt.x + Math.sin(pt.y * 0.05) * 50;
            startY = CANVAS_SIZE + 100;
            delay = (CANVAS_SIZE - pt.y) / CANVAS_SIZE;
            break;
        case EffectType.GLITCH:
            startX = pt.x + (Math.random() - 0.5) * 200;
            startY = pt.y + (Math.random() - 0.5) * 200;
            delay = Math.random();
            break;
        case EffectType.ELASTIC:
        case EffectType.VORTEX:
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
        startX, startY, currentX: startX, currentY: startY,
        targetX: pt.x, targetY: pt.y,
        size: density * particleSizeMultiplier, 
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
        if (effect === EffectType.SCANWAVE) return; 
        ctx.fillRect(p.targetX, p.targetY, p.size, p.size);
    });
  };

  const finishRecording = async () => {
      try {
          // 1. MP4 Flush
          if (videoEncoderRef.current && muxerRef.current) {
              await videoEncoderRef.current.flush();
              muxerRef.current.finalize();
              const buffer = muxerRef.current.target.buffer;
              const blob = new Blob([buffer], { type: 'video/mp4' });
              downloadBlob(blob, 'mp4');
          }
          // 2. WebM Stop
          else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              // The download logic is in the onstop handler, so we just stop here
              mediaRecorderRef.current.stop();
          }
      } catch (e) {
          console.error("Encoding/Recording failed", e);
          alert("Recording failed. Please try again.");
          // Ensure state resets even on error
          cleanupRecordingState();
      }
      
      // Cleanup refs immediately
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
      a.download = `qr-magic-${effect.toLowerCase()}.${ext}`;
      a.click();
      cleanupRecordingState();
  };

  const startAnimationLoop = useCallback((isRecordingActive: boolean) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let startTime: number | null = null;
    const duration = 2500 / speed; 
    let frameCount = 0;

    const animate = async (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const rawProgress = (timestamp - startTime) / duration;
      const progress = Math.min(rawProgress, 1.0); 

      // --- Drawing Logic ---
      
      // Clear with trail effect
      ctx.fillStyle = effect === EffectType.GLITCH ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)';
      // If finished (progress === 1), force solid black background to remove trails for a clean final frame
      if (progress === 1.0) {
          ctx.fillStyle = '#000000';
      }
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      let fillStyle: string | CanvasGradient = colorConfig.colorA;
      if (colorConfig.mode === 'gradient') {
          const g = ctx.createLinearGradient(0,0, CANVAS_SIZE, CANVAS_SIZE);
          g.addColorStop(0, colorConfig.colorA);
          g.addColorStop(1, colorConfig.colorB);
          fillStyle = g;
      }
      ctx.fillStyle = fillStyle;

      particlesRef.current.forEach(p => {
         const staggerWindow = 0.6;
         const moveDuration = 0.4;
         const myStart = p.delay * staggerWindow;
         
         let t = 0;
         if (progress > myStart) t = (progress - myStart) / moveDuration;
         t = Math.max(0, Math.min(1, t));

         if (t === 0 && effect !== EffectType.SCANWAVE) return; 

         let ease = t;
         switch (effect) {
            case EffectType.ELASTIC: ease = Easing.easeOutElastic(t); break;
            case EffectType.ASSEMBLE: ease = Easing.easeOutExpo(t); break;
            case EffectType.VORTEX: ease = Easing.easeOutCubic(t); break;
            case EffectType.GALACTIC: ease = Easing.easeOutCubic(t); break;
            case EffectType.LIQUID: ease = Easing.easeOutBack(t); break;
            case EffectType.GLITCH: ease = t < 0.2 ? 0 : t < 0.5 ? 0.2 : t < 0.8 ? 0.8 : 1; break;
            case EffectType.SCANWAVE: ease = t; break;
         }

         if (effect === EffectType.GALACTIC) {
            const angleOffset = (1 - ease) * Math.PI * 2;
            const currentX = p.targetX + (p.startX - p.targetX) * (1-ease);
            const currentY = p.targetY + (p.startY - p.targetY) * (1-ease);
            
            const cx = CANVAS_SIZE/2; 
            const cy = CANVAS_SIZE/2;
            const cos = Math.cos(angleOffset);
            const sin = Math.sin(angleOffset);
            
            p.currentX = cx + (currentX - cx) * cos - (currentY - cy) * sin;
            p.currentY = cy + (currentX - cx) * sin + (currentY - cy) * cos;
         } else if (effect === EffectType.GLITCH) {
            if (t < 1) {
                p.currentX = p.targetX + (Math.random()-0.5) * 50 * (1-t);
                p.currentY = p.targetY + (Math.random()-0.5) * 50 * (1-t);
                if (Math.random() > 0.8) return;
            } else {
                p.currentX = p.targetX; p.currentY = p.targetY;
            }
         } else if (effect === EffectType.SCANWAVE) {
             if (t > 0 && t < 0.2) {
                 ctx.fillStyle = '#ffffff'; p.currentX = p.targetX; p.currentY = p.targetY;
             } else if (t >= 0.2) {
                 ctx.fillStyle = fillStyle; p.currentX = p.targetX; p.currentY = p.targetY;
             } else { return; }
         } else {
             p.currentX = p.startX + (p.targetX - p.startX) * ease;
             p.currentY = p.startY + (p.targetY - p.startY) * ease;
         }

         ctx.fillRect(p.currentX, p.currentY, p.size, p.size);
         if (effect === EffectType.SCANWAVE) ctx.fillStyle = fillStyle;
      });
      
      // --- End Drawing Logic ---

      // --- Encoding Logic ---
      if (isRecordingActive) {
          if (videoEncoderRef.current && muxerRef.current) {
              const timeMicroseconds = (timestamp - startTime) * 1000;
              const frame = new VideoFrame(canvasRef.current, { timestamp: timeMicroseconds });
              videoEncoderRef.current.encode(frame, { keyFrame: frameCount % 30 === 0 });
              frame.close();
          }
      }

      frameCount++;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation Finished
        if (isRecordingActive) {
            // Encode the very last frame to ensure we capture the final state
            if (videoEncoderRef.current) {
                 const timeMicroseconds = (timestamp - startTime + 33) * 1000;
                 const frame = new VideoFrame(canvasRef.current, { timestamp: timeMicroseconds });
                 videoEncoderRef.current.encode(frame, { keyFrame: true });
                 frame.close();
            }
            // STOP RECORDING - This will trigger the download and then reset state to 'idle'
            await finishRecording();
        } else {
            // Just playing mode
            drawStatic();
            onStatusChange('finished');
        }
      }
    };

    onStatusChange(isRecordingActive ? 'recording' : 'playing');
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [speed, effect, colorConfig, onStatusChange]);

  // Handle Trigger Recording
  useEffect(() => {
    if (triggerRecording > 0 && canvasRef.current) {
      // PREVENT DOUBLE TRIGGER: If we are already recording, ignore this trigger.
      if (isRecordingRef.current) {
          return;
      }
      isRecordingRef.current = true;
      setIsRecording(true); // Activate badge

      resetParticles(points);
      
      const useMp4 = outputFormat === 'mp4';
      const supportsVideoEncoder = typeof window.VideoEncoder === 'function' && typeof window.VideoFrame === 'function';

      if (useMp4 && supportsVideoEncoder) {
          // --- SETUP MP4 MUXER ---
          try {
              const muxer = new Mp4Muxer.Muxer({
                  target: new Mp4Muxer.ArrayBufferTarget(),
                  video: {
                      codec: 'avc', // H.264
                      width: CANVAS_SIZE,
                      height: CANVAS_SIZE,
                  },
                  fastStart: 'in-memory', 
              });

              const encoder = new VideoEncoder({
                  output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                  error: (e) => {
                      console.error("Encoder error", e);
                      cleanupRecordingState();
                  },
              });

              encoder.configure({
                  codec: 'avc1.42E01E', 
                  width: CANVAS_SIZE,
                  height: CANVAS_SIZE,
                  bitrate: 5_000_000, 
                  framerate: 60,
              });

              muxerRef.current = muxer;
              videoEncoderRef.current = encoder;
              startAnimationLoop(true);
              return; 
          } catch (e) {
              console.warn("MP4 Setup failed, falling back to WebM", e);
              // Do not fallback automatically to prevent confusion, just error out cleanly
              alert("MP4 initialization failed.");
              cleanupRecordingState();
              return;
          }
      } 
      
      // --- SETUP WEBM ---
      const stream = canvasRef.current.captureStream(60);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
      }
      
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      
      // Crucial: The download triggers ONLY when onstop fires.
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        downloadBlob(blob, 'webm');
      };

      recorder.onerror = (e) => {
          console.error("Recorder error", e);
          cleanupRecordingState();
      };
      
      recorder.start();
      startAnimationLoop(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRecording]);

  useEffect(() => {
    if (triggerAnimation > 0) {
        // If recording is active, do not allow preview to interrupt
        if (isRecordingRef.current) return;
        
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
