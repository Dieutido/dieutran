export interface ImageConfig {
  numberOfImages: number;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface GeneratedImage {
  prompt: string;
  base64Images: string[];
}

export interface StoryAsset {
  prompt: string;
  vietnamesePart: string;
  englishPart: string;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
