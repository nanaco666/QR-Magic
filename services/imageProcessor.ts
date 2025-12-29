import { Point } from '../types';

export const processImage = (
  imageSrc: string,
  width: number,
  height: number,
  density: number = 3 // Sample every Nth pixel for performance
): Promise<Point[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw image to fit canvas, maintaining aspect ratio usually, 
      // but for QR codes we often want square.
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const points: Point[] = [];

      for (let y = 0; y < height; y += density) {
        for (let x = 0; x < width; x += density) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const alpha = data[index + 3];

          // Threshold for "dark" pixels which form the QR code
          // We ignore white/transparent background pixels
          if (alpha > 128 && (r + g + b) / 3 < 100) {
            points.push({
              x,
              y,
              color: `rgb(${r},${g},${b})`,
            });
          }
        }
      }
      resolve(points);
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
};
