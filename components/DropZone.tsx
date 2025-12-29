import React, { useCallback, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = () => {
      setIsDragOver(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative group transition-all duration-300 rounded-xl overflow-hidden cursor-pointer
        ${isDragOver 
            ? 'bg-blue-500/10 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
            : 'bg-glass-100 border-glass-border hover:bg-glass-200 hover:border-white/30'
        }
        border border-dashed backdrop-blur-sm
      `}
    >
      <input
        type="file"
        id="fileInput"
        accept="image/png, image/jpeg"
        className="hidden"
        onChange={handleChange}
      />
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-white/50 group-hover:border-neon-blue transition-colors"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-white/50 group-hover:border-neon-blue transition-colors"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-white/50 group-hover:border-neon-blue transition-colors"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-white/50 group-hover:border-neon-blue transition-colors"></div>

      <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center py-10 px-4 relative z-10">
        <div className={`w-12 h-12 mb-4 rounded-full flex items-center justify-center transition-all duration-500
            ${isDragOver ? 'bg-blue-500 text-white scale-110' : 'bg-glass-200 text-gray-300 group-hover:text-neon-blue'}
        `}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-neon-blue transition-colors">
            INITIALIZE UPLOAD
        </h3>
        <p className="text-gray-400 text-xs font-mono mt-2 uppercase tracking-widest opacity-70">
            Drag Drop or Click to Scan
        </p>
      </label>
      
      {/* Scanning animation line */}
      <div className={`absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-0 transition-opacity duration-300 ${isDragOver ? 'opacity-100 animate-scan' : ''}`} style={{top: '0%'}}></div>
    </div>
  );
};

export default DropZone;
