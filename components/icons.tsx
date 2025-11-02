
import React from 'react';

// Spinner Icon for loading states
export const LoadingSpinner: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg className={`animate-spin text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Magic Wand Icon for generate buttons
export const MagicWandIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v1.046a1 1 0 01-1.333.949l-.8-2.4a1 1 0 01.433-1.249zM10 18a1 1 0 011-1h.046a1 1 0 01.949 1.333l-2.4.8a1 1 0 01-1.249-.433zM17.954 8.7a1 1 0 01-1.333-.949l.8-2.4a1 1 0 011.249.433l-2.4.8a1 1 0 01-.949 1.333zM3.38 12.62a1 1 0 01.433 1.249l-2.4.8A1 1 0 01.08 13.333l.8-2.4a1 1 0 011.333.949.997.997 0 011.167-.215z" clipRule="evenodd" />
    <path d="M10 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zM4 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM16 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM9 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
    <path d="M7 1a1 1 0 000 2h6a1 1 0 100-2H7zM3 7a1 1 0 000 2h2a1 1 0 100-2H3zM15 7a1 1 0 000 2h2a1 1 0 100-2h-2z" />
  </svg>
);

// Download Icon
export const DownloadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// Video Icon
export const VideoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106A1 1 0 0016 8v4a1 1 0 00.553.894l2 1A1 1 0 0020 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
);

// Upload Icon for audio files
export const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

// Film Icon for rendering/downloading video
export const FilmIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm2 2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V6a1 1 0 00-1-1H6zm5 0a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V6a1 1 0 00-1-1h-2zM6 11a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1H6zm5 0a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2z" clipRule="evenodd" />
    </svg>
);

// Thumbnail Icon
export const ThumbnailIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
);


// YouTube Icon
export const YoutubeIcon: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size * 0.7} viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M27.424 3.1222C27.098 1.8982 26.118 0.9162 24.9 0.5922C22.72 0 14 0 14 0C14 0 5.28 0 3.1 0.5922C1.882 0.9162 0.902 1.8982 0.576 3.1222C0 5.3482 0 10.0002 0 10.0002C0 10.0002 0 14.6522 0.576 16.8782C0.902 18.1022 1.882 19.0842 3.1 19.4082C5.28 20.0002 14 20.0002 14 20.0002C14 20.0002 22.72 20.0002 24.9 19.4082C26.118 19.0842 27.098 18.1022 27.424 16.8782C28 14.6522 28 10.0002 28 10.0002C28 10.0002 28 5.3482 27.424 3.1222Z" fill="#FF0000"/>
        <path d="M11 14.2852V5.71418L18 9.99918L11 14.2852Z" fill="white"/>
    </svg>
);
