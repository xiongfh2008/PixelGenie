
export enum AppMode {
  FORENSICS = 'FORENSICS',     // Deepfake & ELA
  EDITOR = 'EDITOR',           // Remove BG, Enhance, Magic Eraser
  TRANSLATOR = 'TRANSLATOR',   // OCR & Translate
  LOGO = 'LOGO',               // Sketch to Logo
  COMPRESSOR = 'COMPRESSOR',   // Local Image Compression
  DEWATERMARK = 'DEWATERMARK', // Magic Eraser / Watermark Removal
  AI_DETECTOR = 'AI_DETECTOR', // AI Generation Detection
}

export type Language = 'en' | 'zh' | 'es' | 'ja' | 'fr' | 'de' | 'pt';

export interface IntegrityData {
  is_suspected_fake: boolean;
  confidence_score: number; // 0-100
  reasoning: string;
  methods_analyzed: string[];
  ai_generated_probability?: number; // Specific probability for AI generation
  ai_analysis?: {
    unnatural_textures: boolean;
    inconsistent_lighting: boolean;
    semantic_inconsistencies: boolean;
  };
}

export interface AnalysisData {
  description: string;
  tags: string[];
  objects: string[];
  sentiment: string;
  colors: string[];
  integrity: IntegrityData;
}

export interface TextBlock {
  original: string;
  translated: string;
  box_2d: [number, number, number, number]; // ymin, xmin, ymax, xmax (0-1000 scale)
}

export interface TranslationData {
  detected_language: string;
  original_text: string;
  translated_text: string;
  blocks?: TextBlock[];
}

export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
  width?: number;
  height?: number;
}

export interface ApiError {
  message: string;
  details?: string;
}
