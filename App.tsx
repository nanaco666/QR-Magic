
import React, { useState } from 'react';
import { EffectType, AnimationStatus, ColorConfig, OutputFormat } from './types';
import DropZone from './components/DropZone';
import CanvasRenderer from './components/CanvasRenderer';

// --- Presets ---
const COLOR_PRESETS: { name: string, config: ColorConfig }[] = [
    { name: 'Whiteout', config: { mode: 'solid', colorA: '#ffffff', colorB: '#ffffff' } },
    { name: 'Matrix', config: { mode: 'solid', colorA: '#00ff00', colorB: '#00ff00' } },
    { name: 'Cyberpunk', config: { mode: 'gradient', colorA: '#00f3ff', colorB: '#bc13fe' } },
    { name: 'Sunset', config: { mode: 'gradient', colorA: '#ff512f', colorB: '#dd2476' } },
    { name: 'Gold', config: { mode: 'gradient', colorA: '#FDC830', colorB: '#F37335' } },
    { name: 'Deep Sea', config: { mode: 'gradient', colorA: '#2b5876', colorB: '#4e4376' } },
];

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [effect, setEffect] = useState<EffectType>(EffectType.ASSEMBLE);
  const [colorConfig, setColorConfig] = useState<ColorConfig>(COLOR_PRESETS[2].config);
  const [speed, setSpeed] = useState(1);
  const [particleSize, setParticleSize] = useState(1);
  const [density, setDensity] = useState(3); // Default to 3px stride
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('webm');
  
  const [status, setStatus] = useState<AnimationStatus>('idle');
  const [triggerAnim, setTriggerAnim] = useState(0);
  const [triggerRec, setTriggerRec] = useState(0);

  // UI State for Export Menu
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
        setStatus('idle');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePreview = () => setTriggerAnim(prev => prev + 1);
  
  const handleExportSelection = (format: OutputFormat) => {
      setOutputFormat(format);
      setTriggerRec(prev => prev + 1);
      setIsExportMenuOpen(false);
  };

  const StepLabel = ({ num, title }: { num: string, title: string }) => (
      <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-xs text-black bg-neon-blue px-1.5 py-0.5 rounded font-bold">{num}</span>
          <h2 className="text-sm font-bold text-gray-200 tracking-wider uppercase">{title}</h2>
      </div>
  );

  return (
    <div className="min-h-screen text-white selection:bg-neon-blue selection:text-black flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
         <div className="flex items-center gap-2 pointer-events-auto">
             <div className="w-2 h-8 bg-neon-blue rounded-full shadow-[0_0_15px_#00f3ff]"></div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight leading-none">QR MAGIC</h1>
                <p className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">Particle System v1.1</p>
             </div>
         </div>
         <div className="pointer-events-auto">
             <a href="https://github.com/nanaco666/nana" target="_blank" rel="noreferrer" className="text-xs font-mono text-gray-500 hover:text-white transition-colors border border-white/10 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md">
                 GITHUB REPO
             </a>
         </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 pt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* Left Column: Control Deck */}
        <div className="lg:col-span-4 flex flex-col gap-6 relative z-20">
            <div className="bg-glass-100 backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-2xl flex flex-col gap-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                
                {/* 1. UPLOAD */}
                <section>
                    <StepLabel num="01" title="Data Input" />
                    {!imageSrc ? (
                        <DropZone onFileSelect={handleFileSelect} />
                    ) : (
                        <div className="flex items-center gap-4 bg-glass-200 p-3 rounded-xl border border-white/5 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <img src={imageSrc} alt="Preview" className="w-12 h-12 rounded border border-white/20 p-0.5 bg-black" />
                            <div className="flex-1 z-10">
                                <p className="text-xs font-mono text-neon-blue mb-0.5">STATUS: LOADED</p>
                                <button 
                                    onClick={() => setImageSrc(null)}
                                    className="text-xs text-gray-400 hover:text-white underline decoration-gray-600 hover:decoration-white transition-all"
                                >
                                    EJECT CARTRIDGE
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <div className={`space-y-8 transition-all duration-500 ${!imageSrc ? 'opacity-30 pointer-events-none blur-[2px]' : ''}`}>
                    
                    {/* 2. EFFECT SELECTOR */}
                    <section>
                        <StepLabel num="02" title="Animation Engine" />
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(EffectType).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setEffect(t)}
                                    className={`px-3 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all border relative overflow-hidden group text-left
                                        ${effect === t 
                                        ? 'bg-neon-blue/10 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.2)]' 
                                        : 'bg-glass-200 border-transparent text-gray-400 hover:bg-glass-300 hover:text-white'
                                    }`}
                                >
                                    <span className="relative z-10">{t}</span>
                                    {effect === t && <div className="absolute inset-0 bg-neon-blue/5 animate-pulse"></div>}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 3. TUNING */}
                    <section>
                        <StepLabel num="03" title="Visual Style" />
                        <div className="bg-black/20 rounded-xl p-5 border border-white/5 space-y-6">
                            
                            {/* Color Palette */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] uppercase text-gray-500 font-mono tracking-widest">Color Mode</label>
                                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                                        {(['solid', 'gradient'] as const).map(m => (
                                            <button 
                                                key={m}
                                                onClick={() => setColorConfig(prev => ({ ...prev, mode: m }))}
                                                className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${colorConfig.mode === m ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                     {/* Color Inputs */}
                                     <div className="relative group">
                                         <input type="color" value={colorConfig.colorA} onChange={(e) => setColorConfig(prev => ({...prev, colorA: e.target.value}))} className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent opacity-0 absolute inset-0 z-10" />
                                         <div className="w-10 h-10 rounded border border-white/20" style={{backgroundColor: colorConfig.colorA}}></div>
                                         <span className="text-[10px] text-gray-500 font-mono mt-1 block text-center">A</span>
                                     </div>
                                     
                                     {colorConfig.mode === 'gradient' && (
                                         <>
                                            <span className="text-gray-600">→</span>
                                            <div className="relative group">
                                                <input type="color" value={colorConfig.colorB} onChange={(e) => setColorConfig(prev => ({...prev, colorB: e.target.value}))} className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent opacity-0 absolute inset-0 z-10" />
                                                <div className="w-10 h-10 rounded border border-white/20" style={{backgroundColor: colorConfig.colorB}}></div>
                                                <span className="text-[10px] text-gray-500 font-mono mt-1 block text-center">B</span>
                                            </div>
                                         </>
                                     )}
                                     
                                     <div className="flex-1 h-10 rounded border border-white/10 ml-4 overflow-hidden relative">
                                         <div className="absolute inset-0" style={{
                                             background: colorConfig.mode === 'solid' 
                                                ? colorConfig.colorA 
                                                : `linear-gradient(90deg, ${colorConfig.colorA}, ${colorConfig.colorB})`
                                         }}></div>
                                         <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-black/50 mix-blend-overlay uppercase tracking-widest">Preview</div>
                                     </div>
                                </div>

                                {/* Presets */}
                                <div className="grid grid-cols-6 gap-2">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => setColorConfig(preset.config)}
                                            className="aspect-square rounded-full border border-white/10 hover:scale-110 transition-transform relative overflow-hidden group"
                                            title={preset.name}
                                        >
                                            <div className="absolute inset-0" style={{
                                                background: preset.config.mode === 'solid' 
                                                    ? preset.config.colorA 
                                                    : `linear-gradient(135deg, ${preset.config.colorA}, ${preset.config.colorB})`
                                            }}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sliders Section */}
                            
                            {/* 1. Time Dilation (Speed) */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-mono tracking-widest">Time Dilation</label>
                                    <span className="text-xs font-mono text-neon-blue">{speed.toFixed(1)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.5" max="3.0" step="0.1"
                                    value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-neon-blue hover:accent-white transition-all"
                                />
                            </div>

                            {/* 2. Particle Scale (Size) */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-mono tracking-widest">Particle Scale</label>
                                    <span className="text-xs font-mono text-neon-blue">{particleSize.toFixed(1)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.5" max="3.0" step="0.1"
                                    value={particleSize} onChange={(e) => setParticleSize(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-neon-blue hover:accent-white transition-all"
                                />
                            </div>

                            {/* 3. Grid Density (Sampling) */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-mono tracking-widest">Grid Density</label>
                                    <span className="text-xs font-mono text-neon-blue">
                                        {density === 1 ? 'ULTRA' : density === 6 ? 'LOW' : `LVL ${7-density}`}
                                    </span>
                                </div>
                                <input 
                                    type="range" min="1" max="6" step="1"
                                    value={density} onChange={(e) => setDensity(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-neon-blue hover:accent-white transition-all"
                                />
                                <div className="flex justify-between text-[8px] text-gray-600 font-mono mt-1">
                                    <span>FINE (1px)</span>
                                    <span>COARSE (6px)</span>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* REMOVED: Section 04 Export Format (Now integrated into button) */}
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className={`grid grid-cols-2 gap-4 ${!imageSrc ? 'opacity-30 pointer-events-none' : ''}`}>
                 <button
                    onClick={handlePreview}
                    disabled={status === 'recording' || status === 'playing'}
                    className="py-4 rounded-xl bg-glass-100 hover:bg-glass-200 border border-glass-border text-white font-mono text-xs uppercase tracking-widest transition-all hover:border-white/30 disabled:opacity-50"
                >
                    Run Simulation
                </button>
                
                {/* Export Button with Popover Menu */}
                <div className="relative">
                    {isExportMenuOpen && status !== 'recording' && (
                        <div className="absolute bottom-full left-0 right-0 mb-3 bg-[#0a0a0a] border border-glass-border rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 flex flex-col origin-bottom animate-popup">
                             <div className="text-[9px] text-gray-500 font-mono p-2 bg-white/5 uppercase tracking-widest border-b border-white/5">Select Format</div>
                             <button 
                                onClick={() => handleExportSelection('webm')}
                                className="p-3 hover:bg-neon-blue/20 hover:text-white text-gray-300 text-left text-xs font-mono font-bold transition-colors flex justify-between group"
                             >
                                 <span>.WEBM</span>
                                 <span className="opacity-0 group-hover:opacity-100 text-neon-blue">→</span>
                             </button>
                             <div className="h-[1px] bg-white/5"></div>
                             <button 
                                onClick={() => handleExportSelection('mp4')}
                                className="p-3 hover:bg-neon-purple/20 hover:text-white text-gray-300 text-left text-xs font-mono font-bold transition-colors flex justify-between group"
                             >
                                 <span>.MP4 <span className="text-[8px] bg-neon-purple/20 text-neon-purple px-1 rounded ml-1">BETA</span></span>
                                 <span className="opacity-0 group-hover:opacity-100 text-neon-purple">→</span>
                             </button>
                        </div>
                    )}
                    
                    <button
                        onClick={() => {
                            if (status !== 'recording') {
                                setIsExportMenuOpen(!isExportMenuOpen);
                            }
                        }}
                        disabled={status === 'recording' || status === 'playing'}
                        className="w-full h-full py-4 rounded-xl bg-gradient-to-r from-neon-blue to-blue-600 text-black font-bold font-mono text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {status === 'recording' ? (
                            <>
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"/>
                                RECORDING
                            </>
                        ) : (
                            <>
                                EXPORT VIDEO
                                <span className={`transition-transform duration-300 ${isExportMenuOpen ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </>
                        )}
                    </button>
                    
                    {/* Backdrop to close menu when clicking outside */}
                    {isExportMenuOpen && (
                        <div 
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setIsExportMenuOpen(false)}
                        ></div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: The Stage */}
        <div className="lg:col-span-8 flex items-center justify-center relative min-h-[500px] lg:h-auto">
             
             {/* Decorative Background Elements behind Canvas */}
             <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-neon-blue/5 rounded-full blur-[100px]"></div>
                 <div className="absolute top-10 right-10 w-24 h-24 border-t-2 border-r-2 border-white/10 rounded-tr-3xl"></div>
                 <div className="absolute bottom-10 left-10 w-24 h-24 border-b-2 border-l-2 border-white/10 rounded-bl-3xl"></div>
             </div>

             <div className="relative z-10 group">
                {/* Holographic Frame */}
                <div className={`
                    relative p-1 rounded-2xl transition-all duration-500
                    ${status === 'recording' 
                        ? 'bg-gradient-to-b from-red-500 via-transparent to-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]' 
                        : 'bg-gradient-to-b from-gray-700 via-gray-900 to-gray-700 shadow-2xl'
                    }
                `}>
                     {/* Inner Black Box */}
                    <div className="bg-black rounded-xl overflow-hidden relative">
                         {/* Scanline Overlay */}
                         <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
                         
                         {!imageSrc ? (
                            <div className="w-[350px] md:w-[600px] h-[350px] md:h-[600px] flex flex-col items-center justify-center text-gray-600 space-y-4 border border-white/5">
                                <div className="w-16 h-16 border border-gray-700 rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
                                </div>
                                <p className="font-mono text-xs uppercase tracking-[0.2em]">System Standby</p>
                            </div>
                        ) : (
                             <CanvasRenderer 
                                imageSrc={imageSrc} 
                                effect={effect}
                                colorConfig={colorConfig}
                                speed={speed}
                                particleSizeMultiplier={particleSize}
                                density={density}
                                onStatusChange={setStatus}
                                triggerAnimation={triggerAnim} 
                                triggerRecording={triggerRec} 
                                outputFormat={outputFormat}
                             />
                        )}
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                    <span className={status === 'idle' ? 'text-neon-green' : ''}>Ready</span>
                    <span className="text-gray-700">/</span>
                    <span className={status === 'playing' ? 'text-neon-blue' : ''}>Active</span>
                    <span className="text-gray-700">/</span>
                    <span className={status === 'recording' ? 'text-red-500 animate-pulse' : ''}>REC</span>
                </div>
             </div>
        </div>
      </main>
    </div>
  );
}
