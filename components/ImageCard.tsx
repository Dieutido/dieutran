
import React from 'react';
import { DownloadIcon } from './icons';

interface ImageCardProps {
  base64Image: string;
  prompt: string;
  index: number;
}

const ImageCard: React.FC<ImageCardProps> = ({ base64Image, prompt, index }) => {
  const imageUrl = `data:image/jpeg;base64,${base64Image}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${prompt.slice(0, 30).replace(/\s+/g, '_')}_${index + 1}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg shadow-lg bg-gray-700">
      <img src={imageUrl} alt={prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <button
          onClick={handleDownload}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition-transform transform scale-90 group-hover:scale-100"
        >
          <DownloadIcon />
          <span className="ml-2">Tải xuống</span>
        </button>
      </div>
    </div>
  );
};

export default ImageCard;
