
import React, { useState } from 'react';
import { generateStoryAssets, generateImagesFromPrompt, generateThumbnailPrompt } from '../services/geminiService';
import type { StoryAsset, GeneratedImage, ImageConfig, AspectRatio } from '../types';
import { LoadingSpinner, MagicWandIcon, VideoIcon, ThumbnailIcon } from './icons';
import ImageCard from './ImageCard';
import VideoPlayerModal from './VideoPlayerModal';

const ImageGenerator: React.FC = () => {
  const [story, setStory] = useState<string>('');
  const [assets, setAssets] = useState<StoryAsset[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [thumbnailImage, setThumbnailImage] = useState<GeneratedImage | null>(null);
  const [imageConfig, setImageConfig] = useState<ImageConfig>({
    numberOfImages: 1,
    aspectRatio: '16:9',
  });
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState<boolean>(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story.trim()) {
      setError("Vui lòng nhập một câu chuyện.");
      return;
    }
    setIsLoadingAssets(true);
    setError(null);
    setThumbnailError(null);
    setAssets([]);
    setGeneratedImages([]);
    setThumbnailImage(null);
    setImageGenerationProgress(0);
    try {
      const generatedAssets = await generateStoryAssets(story);
      setAssets(generatedAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!story) return;
    setIsGeneratingThumbnail(true);
    setThumbnailError(null);
    try {
      const prompt = await generateThumbnailPrompt(story, "Echo Tales");
      const base64Images = await generateImagesFromPrompt(prompt, { ...imageConfig, aspectRatio: '16:9' });
      setThumbnailImage({ prompt, base64Images });
    } catch (err) {
        setThumbnailError(err instanceof Error ? err.message : 'Lỗi tạo thumbnail.');
    } finally {
        setIsGeneratingThumbnail(false);
    }
  };

  const handleGenerateAllImages = async () => {
    if (assets.length === 0) return;
    setIsLoadingImages(true);
    setError(null);
    setGeneratedImages([]);

    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 2500;
    
    try {
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        setImageGenerationProgress(i + 1);
        
        let success = false;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const base64Images = await generateImagesFromPrompt(asset.prompt, imageConfig);
                const newImage: GeneratedImage = { prompt: asset.prompt, base64Images };
                
                setGeneratedImages(prevImages => [...prevImages, newImage]);
                success = true;
                break; // Exit retry loop on success
            } catch (err: any) {
                const isRateLimitError = err.message?.includes('429') || err.message?.toUpperCase().includes('RESOURCE_EXHAUSTED');
                
                if (isRateLimitError && attempt < MAX_RETRIES - 1) {
                    const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt);
                    console.warn(`Rate limit hit. Retrying in ${delayMs}ms... (Attempt ${attempt + 2})`);
                    await delay(delayMs);
                } else {
                    throw err; // Re-throw the error if it's not a rate limit error or retries are exhausted
                }
            }
        }
        
        if (!success) {
           throw new Error(`Không thể tạo ảnh cho lời nhắc "${asset.prompt}" sau ${MAX_RETRIES} lần thử.`);
        }
        
        // Keep a base delay between successful generations to not hit the limit again
        if (i < assets.length - 1) {
          await delay(INITIAL_DELAY_MS);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi tạo hình ảnh.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoadingImages(false);
      setImageGenerationProgress(0);
    }
  };
  
  const allImagesGenerated = generatedImages.length === assets.length && assets.length > 0;
  const flatImages = generatedImages.flatMap(g => g.base64Images);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Story to Image AI
        </h1>
        <p className="text-gray-400 mt-2">
          Biến câu chuyện của bạn thành một bộ phim ngắn tuyệt đẹp.
        </p>
      </header>

      <main>
        <section className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <form onSubmit={handleStorySubmit}>
            <label htmlFor="story-input" className="block text-lg font-semibold mb-2 text-gray-200">
              1. Nhập câu chuyện của bạn (bằng tiếng Việt)
            </label>
            <textarea
              id="story-input"
              rows={8}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Ngày xửa ngày xưa, ở một vương quốc xa xôi..."
              className="w-full p-4 bg-gray-900 rounded-md border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isLoadingAssets}
            />
            <button
              type="submit"
              disabled={isLoadingAssets || !story.trim()}
              className="mt-4 w-full md:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded-lg font-bold transition-colors"
            >
              {isLoadingAssets ? <LoadingSpinner /> : <MagicWandIcon />}
              <span className="ml-2">
                {isLoadingAssets ? 'Đang phân tích...' : 'Tạo lời nhắc & Phụ đề'}
              </span>
            </button>
          </form>
          {error && !isLoadingImages && <p className="text-red-400 mt-4">{error}</p>}
        </section>

        {assets.length > 0 && (
          <section className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">
              2. Tùy chỉnh và tạo hình ảnh
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div>
                <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-1">Tỷ lệ khung hình</label>
                <select
                  id="aspect-ratio"
                  value={imageConfig.aspectRatio}
                  onChange={(e) => setImageConfig({ ...imageConfig, aspectRatio: e.target.value as AspectRatio })}
                  className="w-full p-2 bg-gray-900 rounded-md border border-gray-700 focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoadingImages}
                >
                  <option value="16:9">16:9 (Widescreen for YouTube)</option>
                  <option value="9:16">9:16 (Portrait for Shorts/TikTok)</option>
                  <option value="1:1">1:1 (Square for Instagram)</option>
                  <option value="4:3">4:3 (Classic TV)</option>
                  <option value="3:4">3:4 (Classic Portrait)</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleGenerateThumbnail}
                  disabled={isGeneratingThumbnail || isLoadingImages}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-bold transition-colors"
                >
                  {isGeneratingThumbnail ? <LoadingSpinner /> : <ThumbnailIcon />}
                  <span className="ml-2">
                    {isGeneratingThumbnail ? 'Đang tạo...' : 'Tạo Thumbnail'}
                  </span>
                </button>

                <button
                  onClick={handleGenerateAllImages}
                  disabled={isLoadingImages}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-bold transition-colors"
                >
                  {isLoadingImages ? <LoadingSpinner /> : <MagicWandIcon />}
                  <span className="ml-2">
                    {isLoadingImages ? `Đang tạo ảnh ${imageGenerationProgress}/${assets.length}...` : `Tạo tất cả ${assets.length} hình ảnh`}
                  </span>
                </button>
            </div>
            {thumbnailError && <p className="text-red-400 mt-4">{thumbnailError}</p>}
            {error && isLoadingImages && <p className="text-red-400 mt-4">{error}</p>}
          </section>
        )}
        
        {thumbnailImage && (
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">Ảnh Thumbnail Video</h2>
                <div className="max-w-md">
                    <ImageCard
                        base64Image={thumbnailImage.base64Images[0]}
                        prompt={thumbnailImage.prompt}
                        index={99} // Use a unique index
                    />
                </div>
            </section>
        )}

        {generatedImages.length > 0 && (
          <section>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-200">
                Kết quả hình ảnh
                </h2>
                {allImagesGenerated && !isLoadingImages && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors"
                    >
                        <VideoIcon />
                        <span className="ml-2">Tạo Video</span>
                    </button>
                )}
             </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {generatedImages.map((imgGroup, groupIndex) =>
                imgGroup.base64Images.map((base64Image, imgIndex) => (
                  <ImageCard
                    key={`${groupIndex}-${imgIndex}`}
                    base64Image={base64Image}
                    prompt={imgGroup.prompt}
                    index={groupIndex * imageConfig.numberOfImages + imgIndex}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {isModalOpen && allImagesGenerated && (
        <VideoPlayerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          images={flatImages}
          assets={assets}
        />
      )}
    </div>
  );
};

export default ImageGenerator;
