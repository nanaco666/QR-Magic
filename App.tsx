import React, { useState } from 'react';
import { EffectType, AnimationStatus, ColorTheme } from './types';
import DropZone from './components/DropZone';
import CanvasRenderer from './components/CanvasRenderer';
import { generateSocialCaption } from './services/geminiService';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [effect, setEffect] = useState<EffectType>(EffectType.CONVERGE);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('white');
  const [speed, setSpeed] = useState(1);
  const [particleSize, setParticleSize] = useState(1);
  const [status, setStatus] = useState<AnimationStatus>('idle');
  const [triggerAnim, setTriggerAnim] = useState(0);
  const [triggerRec, setTriggerRec] = useState(0);
  
  // AI Feature State
  const [contextInput, setContextInput] = useState('');
  const [caption, setCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

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

  const handlePreview = () => {
    setTriggerAnim(prev => prev + 1);
  };

  const handleDownload = () => {
    setTriggerRec(prev => prev + 1);
  };

  const handleGenerateCaption = async () => {
    if (!contextInput) return;
    setIsGeneratingCaption(true);
    setCaption('');
    const result = await generateSocialCaption(contextInput);
    setCaption(result);
    setIsGeneratingCaption(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h1 className="text-xl font-bold tracking-tight">QR Particle Magic</h1>
            </div>
            <div className="text-sm text-gray-400">
                Created with Gemini API
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Controls & Inputs */}
        <div className="lg:col-span-4 space-y-8">
            
            {/* Step 1: Upload */}
            <section>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center text-xs">1</span>
                    Upload QR
                </h2>
                {!imageSrc ? (
                    <DropZone onFileSelect={handleFileSelect} />
                ) : (
                    <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
                        <img src={imageSrc} alt="Preview" className="w-16 h-16 rounded bg-white p-1" />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-white">QR Code Loaded</p>
                            <button 
                                onClick={() => setImageSrc(null)}
                                className="text-xs text-red-400 hover:text-red-300 hover:underline mt-1"
                            >
                                Remove & Upload New
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Step 2: Choose Effect */}
            <section className={!imageSrc ? 'opacity-50 pointer-events-none' : ''}>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center text-xs">2</span>
                    Select Animation
                </h2>
                <div className="grid grid-cols-3 gap-2">
                    {Object.values(EffectType).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setEffect(t)}
                            className={`px-2 py-3 rounded-lg border text-xs font-medium transition-all ${
                                effect === t 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'
                            }`}
                        >
                            {t.charAt(0) + t.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </section>

             {/* Step 3: Fine Tune (The "Joystick") */}
            <section className={!imageSrc ? 'opacity-50 pointer-events-none' : ''}>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center text-xs">3</span>
                    Fine Tune
                </h2>
                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 space-y-5">
                    
                    {/* Color Theme Selector */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block font-semibold">Particle Color</label>
                        <div className="flex gap-2">
                             {(['white', 'matrix', 'neon', 'fire', 'rainbow'] as ColorTheme[]).map(theme => (
                                 <button
                                    key={theme}
                                    onClick={() => setColorTheme(theme)}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                        colorTheme === theme ? 'border-white scale-110 ring-2 ring-blue-500/50' : 'border-transparent'
                                    }`}
                                    style={{
                                        background: theme === 'white' ? '#fff' 
                                            : theme === 'matrix' ? '#0f0' 
                                            : theme === 'fire' ? 'linear-gradient(to bottom right, #f00, #ff0)' 
                                            : theme === 'neon' ? 'linear-gradient(to bottom right, #0ff, #f0f)'
                                            : 'linear-gradient(to right, red,orange,yellow,green,blue,indigo,violet)'
                                    }}
                                    title={theme.charAt(0).toUpperCase() + theme.slice(1)}
                                 />
                             ))}
                        </div>
                    </div>

                    {/* Speed Slider */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-gray-400 font-semibold">Animation Speed</label>
                            <span className="text-xs text-blue-400 font-mono">{speed.toFixed(1)}x</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="3.0" 
                            step="0.1" 
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                        />
                    </div>

                    {/* Size Slider */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-gray-400 font-semibold">Particle Size</label>
                            <span className="text-xs text-blue-400 font-mono">{particleSize.toFixed(1)}x</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="3.0" 
                            step="0.5" 
                            value={particleSize}
                            onChange={(e) => setParticleSize(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                        />
                    </div>
                </div>
            </section>

             {/* Step 4: AI Caption */}
             <section className={!imageSrc ? 'opacity-50 pointer-events-none' : ''}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-900 text-purple-300 flex items-center justify-center text-xs">AI</span>
                        Gemini Caption
                    </h2>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                    <p className="text-xs text-gray-400 mb-3">Tell Gemini what this QR is for to get a viral caption.</p>
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            placeholder="e.g. My Portfolio"
                            className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            value={contextInput}
                            onChange={(e) => setContextInput(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={handleGenerateCaption}
                            disabled={isGeneratingCaption || !contextInput}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                            {isGeneratingCaption ? '...' : 'Generate'}
                        </button>
                    </div>
                    {caption && (
                        <div className="bg-gray-950 p-3 rounded border border-gray-800 relative group">
                            <p className="text-sm text-gray-200 italic">"{caption}"</p>
                            <button 
                                type="button"
                                onClick={() => navigator.clipboard.writeText(caption)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-800 text-xs px-2 py-1 rounded hover:bg-gray-700 transition-opacity"
                            >
                                Copy
                            </button>
                        </div>
                    )}
                </div>
            </section>

             {/* Step 5: Actions */}
             <section className={!imageSrc ? 'opacity-50 pointer-events-none' : ''}>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center text-xs">4</span>
                    Export
                </h2>
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handlePreview}
                        disabled={status === 'recording' || status === 'playing'}
                        className="w-full py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium border border-gray-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Preview Animation
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={status === 'recording' || status === 'playing'}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {status === 'recording' ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Rendering Video...
                            </span>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Record & Download
                            </>
                        )}
                    </button>
                </div>
            </section>
        </div>

        {/* Right Column: Canvas/Preview */}
        <div className="lg:col-span-8 bg-gray-900/30 rounded-3xl border border-gray-800 p-8 flex items-center justify-center min-h-[500px] backdrop-blur-sm relative">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-gray-950/0 to-gray-950/0 pointer-events-none" />
             
             {!imageSrc ? (
                 <div className="text-center text-gray-500">
                     <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     <p>Upload a QR Code to begin</p>
                 </div>
             ) : (
                 <CanvasRenderer 
                    imageSrc={imageSrc} 
                    effect={effect}
                    colorTheme={colorTheme}
                    speed={speed}
                    particleSizeMultiplier={particleSize}
                    onStatusChange={setStatus}
                    triggerAnimation={triggerAnim} 
                    triggerRecording={triggerRec} 
                 />
             )}
        </div>
      </main>
    </div>
  );
}
