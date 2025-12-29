import React, { useCallback } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
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
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center hover:border-blue-500 hover:bg-gray-900 transition-colors cursor-pointer group"
    >
      <input
        type="file"
        id="fileInput"
        accept="image/png, image/jpeg"
        className="hidden"
        onChange={handleChange}
      />
      <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
        <div className="bg-gray-800 p-4 rounded-full mb-4 group-hover:bg-blue-900/50 transition-colors">
          <svg
            className="w-8 h-8 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">Upload QR Code</h3>
        <p className="text-gray-400 text-sm mt-2">Drag & drop or click to select</p>
        <p className="text-gray-500 text-xs mt-1">PNG or JPG recommended</p>
      </label>
    </div>
  );
};

export default DropZone;
