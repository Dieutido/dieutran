import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StoryAsset } from '../types';
import { DownloadIcon, FilmIcon, LoadingSpinner, UploadIcon, YoutubeIcon } from './icons';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  assets: StoryAsset[];
}

type FontStyle = 'Arial' | 'Verdana' | 'Georgia' | 'Times New Roman' | 'Courier New';
type Resolution = 'original' | '1080p' | '720p';

interface SubtitleStyle {
  color: string;
  fontSize: number;
  fontFamily: FontStyle;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, images, assets }) => {
  const [backgroundAudio, setBackgroundAudio] = useState<File | null>(null);
  const [voiceoverAudio, setVoiceoverAudio] = useState<File | null>(null);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [endScreenImage, setEndScreenImage] = useState<File | null>(null);

  const [vietnameseStyle, setVietnameseStyle] = useState<SubtitleStyle>({ color: '#FFFFFF', fontSize: 28, fontFamily: 'Arial' });
  const [englishStyle, setEnglishStyle] = useState<SubtitleStyle>({ color: '#E5E7EB', fontSize: 22, fontFamily: 'Arial' });
  
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<Resolution>('original');

  const backgroundAudioInputRef = useRef<HTMLInputElement>(null);
  const voiceoverAudioInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const endScreenInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setBackgroundAudio(null);
      setVoiceoverAudio(null);
      setThumbnailImage(null);
      setEndScreenImage(null);
      setIsRendering(false);
      setRenderProgress(0);
      setVideoUrl(null);
    }
  }, [isOpen]);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };
  
  // Helper function to calculate the wrapped text height without drawing it
  const measureTextHeight = (context: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): number => {
    if (!text) return 0;
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;
    
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            line = words[n] + ' ';
            lineCount++;
        } else {
            line = testLine;
        }
    }
    lineCount++; // Account for the last line
    return lineCount * lineHeight;
  };

  // Helper function to draw wrapped text, starting from a top Y coordinate
  const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    context.textBaseline = 'top';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line.trim(), x, currentY);
  };


  const handleRenderVideo = useCallback(async () => {
    if (isRendering || images.length === 0) return;
    setIsRendering(true);
    setRenderProgress(0);
    setVideoUrl(null);

    try {
        const imageElements: HTMLImageElement[] = await Promise.all(
            images.map(src => new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = `data:image/jpeg;base64,${src}`;
            }))
        );

        const thumbnailImgEl = thumbnailImage ? await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(thumbnailImage);
        }) : null;

        const endScreenImgEl = endScreenImage ? await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(endScreenImage);
        }) : null;
        
        let canvasWidth = imageElements[0].naturalWidth;
        let canvasHeight = imageElements[0].naturalHeight;
        
        if (selectedResolution === '1080p') {
            canvasWidth = 1920;
            canvasHeight = 1080;
        } else if (selectedResolution === '720p') {
            canvasWidth = 1280;
            canvasHeight = 720;
        }

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        const audioContext = new AudioContext();
        let backgroundBuffer: AudioBuffer | null = null;
        let voiceoverBuffer: AudioBuffer | null = null;

        if (backgroundAudio) backgroundBuffer = await audioContext.decodeAudioData(await backgroundAudio.arrayBuffer());
        if (voiceoverAudio) voiceoverBuffer = await audioContext.decodeAudioData(await voiceoverAudio.arrayBuffer());
        
        const mainDuration = Math.max(backgroundBuffer?.duration || 0, voiceoverBuffer?.duration || 0);
        if (mainDuration === 0) throw new Error("At least one audio file is required to set video duration.");

        const THUMBNAIL_DURATION = 3; // seconds
        const END_SCREEN_DURATION = 4; // seconds
        const totalDuration = THUMBNAIL_DURATION + mainDuration + END_SCREEN_DURATION;
        const durationPerSlide = mainDuration / images.length;
        
        const stream = canvas.captureStream(30);
        const audioDestination = audioContext.createMediaStreamDestination();
        if (backgroundBuffer) {
            const source = audioContext.createBufferSource();
            source.buffer = backgroundBuffer;
            source.connect(audioDestination);
            source.start(THUMBNAIL_DURATION);
        }
        if (voiceoverAudio) {
            const source = audioContext.createBufferSource();
            source.buffer = voiceoverBuffer;
            source.connect(audioDestination);
            source.start(THUMBNAIL_DURATION);
        }

        const combinedStream = new MediaStream([...stream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()]);
        const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp9,opus' });
        const chunks: Blob[] = [];

        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setVideoUrl(URL.createObjectURL(blob));
            setIsRendering(false);
        };
        recorder.start();

        let frame = 0;
        const totalFrames = totalDuration * 30; // 30 FPS

        const drawFrame = () => {
            const currentTime = frame / 30;
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // STAGE 1: Thumbnail
            if (currentTime < THUMBNAIL_DURATION) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                if (thumbnailImgEl) {
                    const hRatio = canvasWidth / thumbnailImgEl.width;
                    const vRatio = canvasHeight / thumbnailImgEl.height;
                    const ratio = Math.min(hRatio, vRatio);
                    const centerShift_x = (canvasWidth - thumbnailImgEl.width * ratio) / 2;
                    const centerShift_y = (canvasHeight - thumbnailImgEl.height * ratio) / 2;
                    ctx.drawImage(thumbnailImgEl, 0, 0, thumbnailImgEl.width, thumbnailImgEl.height, centerShift_x, centerShift_y, thumbnailImgEl.width * ratio, thumbnailImgEl.height * ratio);
                }
            } 
            // STAGE 2: Main Content
            else if (currentTime < THUMBNAIL_DURATION + mainDuration) {
                const contentTime = currentTime - THUMBNAIL_DURATION;
                const index = Math.min(Math.floor(contentTime / durationPerSlide), images.length - 1);
                const img = imageElements[index];
                const asset = assets[index];

                const hRatio = canvasWidth / img.width;
                const vRatio = canvasHeight / img.height;
                const ratio = Math.min(hRatio, vRatio);
                const centerShift_x = (canvasWidth - img.width * ratio) / 2;
                const centerShift_y = (canvasHeight - img.height * ratio) / 2;
                ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
                
                // --- REVISED SUBTITLE LOGIC ---
                ctx.textAlign = 'center';
                const maxWidth = canvasWidth * 0.9;
                const bottomMargin = canvasHeight * 0.05;
                const interlinePadding = 8; // Pixels between the two subtitle blocks

                // 1. Configure styles and measure heights
                ctx.font = `italic ${englishStyle.fontSize}px ${englishStyle.fontFamily}`;
                const englishLineHeight = englishStyle.fontSize * 1.2;
                const englishHeight = measureTextHeight(ctx, asset.englishPart, maxWidth, englishLineHeight);
                
                ctx.font = `bold ${vietnameseStyle.fontSize}px ${vietnameseStyle.fontFamily}`;
                const vietnameseLineHeight = vietnameseStyle.fontSize * 1.2;
                const vietnameseHeight = measureTextHeight(ctx, asset.vietnamesePart, maxWidth, vietnameseLineHeight);

                // 2. Calculate drawing positions from the bottom up
                const englishStartY = canvasHeight - bottomMargin - englishHeight;
                const vietnameseStartY = englishStartY - interlinePadding - vietnameseHeight;

                // 3. Draw with shadow for readability
                ctx.shadowColor = "black";
                ctx.shadowBlur = 5;

                // 4. Draw English subtitle
                ctx.font = `italic ${englishStyle.fontSize}px ${englishStyle.fontFamily}`;
                ctx.fillStyle = englishStyle.color;
                wrapText(ctx, asset.englishPart, canvasWidth / 2, englishStartY, maxWidth, englishLineHeight);

                // 5. Draw Vietnamese subtitle
                ctx.font = `bold ${vietnameseStyle.fontSize}px ${vietnameseStyle.fontFamily}`;
                ctx.fillStyle = vietnameseStyle.color;
                wrapText(ctx, asset.vietnamesePart, canvasWidth / 2, vietnameseStartY, maxWidth, vietnameseLineHeight);
                 
                ctx.shadowBlur = 0; // Reset shadow for next frame
            } 
            // STAGE 3: End Screen
            else {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                if (endScreenImgEl) {
                    const hRatio = canvasWidth / endScreenImgEl.width;
                    const vRatio = canvasHeight / endScreenImgEl.height;
                    const ratio = Math.min(hRatio, vRatio);
                    const centerShift_x = (canvasWidth - endScreenImgEl.width * ratio) / 2;
                    const centerShift_y = (canvasHeight - endScreenImgEl.height * ratio) / 2;
                    ctx.drawImage(endScreenImgEl, 0, 0, endScreenImgEl.width, endScreenImgEl.height, centerShift_x, centerShift_y, endScreenImgEl.width * ratio, endScreenImgEl.height * ratio);
                } else {
                    // Default CTA
                    ctx.fillStyle = '#111827';
                    ctx.fillRect(0,0, canvasWidth, canvasHeight);
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const logoSize = canvasHeight * 0.2;
                    // This is a placeholder for the SVG icon logic
                    ctx.font = `${canvasHeight * 0.1}px Arial`;
                    ctx.fillText('Echo Tales', canvasWidth / 2, canvasHeight * 0.4);
                    ctx.font = `${canvasHeight * 0.05}px Arial`;
                    ctx.fillText('Like & Subscribe', canvasWidth / 2, canvasHeight * 0.55);
                    ctx.fillStyle = '#a0a0a0';
                    ctx.font = `${canvasHeight * 0.04}px Arial`;
                    ctx.fillText('youtube.com/@EchoTales-rich86', canvasWidth / 2, canvasHeight * 0.65);
                }
            }

            frame++;
            setRenderProgress(frame / totalFrames * 100);
            if (frame < totalFrames) {
                requestAnimationFrame(drawFrame);
            } else {
                recorder.stop();
            }
        };

        requestAnimationFrame(drawFrame);

    } catch (error) {
        console.error("Video rendering failed:", error);
        setIsRendering(false);
    }
  }, [isRendering, images, assets, backgroundAudio, voiceoverAudio, thumbnailImage, endScreenImage, vietnameseStyle, englishStyle, selectedResolution]);


  if (!isOpen) return null;
  
  const renderSubtitleEditor = (style: SubtitleStyle, setStyle: (style: SubtitleStyle) => void, label: string) => (
    <div className="p-3 border border-gray-700 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">{label}</h4>
        <div className="grid grid-cols-3 gap-2">
            <div>
                <label className="text-xs text-gray-400">Màu</label>
                <input type="color" value={style.color} onChange={e => setStyle({...style, color: e.target.value})} className="w-full h-8 bg-gray-900 border-none cursor-pointer" />
            </div>
            <div>
                <label className="text-xs text-gray-400">Cỡ chữ</label>
                <input type="number" value={style.fontSize} onChange={e => setStyle({...style, fontSize: Number(e.target.value)})} className="w-full p-1 bg-gray-900 border border-gray-600 rounded" />
            </div>
            <div>
                <label className="text-xs text-gray-400">Font</label>
                <select value={style.fontFamily} onChange={e => setStyle({...style, fontFamily: e.target.value as FontStyle})} className="w-full p-1 bg-gray-900 border border-gray-600 rounded text-xs">
                    <option>Arial</option>
                    <option>Verdana</option>
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                    <option>Courier New</option>
                </select>
            </div>
        </div>
    </div>
  );
  
  const renderFileInput = (label: string, file: File | null, ref: React.RefObject<HTMLInputElement>, accept: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
      <div className="text-center">
        <button onClick={() => ref.current?.click()} className="w-full text-sm p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center gap-2">
            <UploadIcon /> {label}
        </button>
        <input type="file" ref={ref} onChange={onChange} accept={accept} className="hidden" />
        {file && <p className="text-xs text-gray-400 mt-1 truncate" title={file.name}>{file.name}</p>}
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl w-full max-w-5xl h-full max-h-[95vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold">Tạo & Chỉnh sửa Video</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">&times;</button>
        </header>

        <div className="flex-grow p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
            {/* Left Panel: Controls */}
            <div className="md:col-span-1 space-y-4 overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2">Tùy chỉnh</h3>
                <div className="space-y-3">
                    {renderFileInput("Tải lên Nhạc nền", backgroundAudio, backgroundAudioInputRef, "audio/*", handleFileChange(setBackgroundAudio))}
                    {renderFileInput("Tải lên Lời thoại", voiceoverAudio, voiceoverAudioInputRef, "audio/*", handleFileChange(setVoiceoverAudio))}
                    {renderFileInput("Ảnh Bìa (Đầu video)", thumbnailImage, thumbnailInputRef, "image/*", handleFileChange(setThumbnailImage))}
                    {renderFileInput("Ảnh Kết thúc (Cuối video)", endScreenImage, endScreenInputRef, "image/*", handleFileChange(setEndScreenImage))}
                </div>

                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 pt-2">Phụ đề</h3>
                <div className="space-y-3">
                    {renderSubtitleEditor(vietnameseStyle, setVietnameseStyle, "Phụ đề tiếng Việt")}
                    {renderSubtitleEditor(englishStyle, setEnglishStyle, "Phụ đề tiếng Anh")}
                </div>

                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 pt-2">Chất lượng Video</h3>
                <div>
                     <label className="text-sm text-gray-400">Độ phân giải</label>
                     <select value={selectedResolution} onChange={e => setSelectedResolution(e.target.value as Resolution)} className="w-full mt-1 p-2 bg-gray-900 border border-gray-600 rounded">
                        <option value="original">Chất lượng gốc</option>
                        <option value="1080p">1080p (Full HD)</option>
                        <option value="720p">720p (HD)</option>
                     </select>
                </div>
            </div>

            {/* Right Panel: Preview/Render */}
            <div className="md:col-span-2 bg-black rounded-lg flex items-center justify-center flex-col relative aspect-video">
                {!isRendering && !videoUrl && <div className="text-gray-500">Video sẽ được tạo ở đây</div>}
                {isRendering && (
                    <div className="text-center">
                        <LoadingSpinner className="h-12 w-12 mx-auto" />
                        <p className="mt-4 text-lg">Đang tạo video...</p>
                        <p className="text-2xl font-bold">{Math.round(renderProgress)}%</p>
                    </div>
                )}
                {videoUrl && (
                    <video src={videoUrl} controls autoPlay className="w-full h-full object-contain"></video>
                )}
            </div>
        </div>

        <footer className="p-4 border-t border-gray-700 flex justify-end items-center gap-4">
            {videoUrl ? (
                <a href={videoUrl} download={`echo_tales_video_${Date.now()}.webm`} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold">
                    <DownloadIcon /> Tải Video
                </a>
            ) : (
                <button onClick={handleRenderVideo} disabled={isRendering || (!backgroundAudio && !voiceoverAudio)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded-lg font-bold">
                    {isRendering ? <LoadingSpinner /> : <FilmIcon />}
                    {isRendering ? 'Đang xử lý...' : 'Tạo Video'}
                </button>
            )}
        </footer>
      </div>
    </div>
  );
};

export default VideoPlayerModal;