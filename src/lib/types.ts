export interface ImageItem {
  id: string;
  url: string;
  name: string;
}

export interface ImageGroup {
  id: string;
  name: string;
  clothingImages: ImageItem[];
  modelImages: ImageItem[];
  collapsed: boolean;
}

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Task {
  id: string;
  clothingImg: ImageItem;
  modelImg: ImageItem;
  status: TaskStatus;
  progress: number;
  resultUrl: string | null;
  error: string | null;
}

export type PairingMode = 'pair' | 'fixedModel' | 'fixedClothing';

export type SaveMode = 'download' | 'local' | 'server';

export type GenerationMode = 'headOnly' | 'clothingOnly' | 'both' | 'backgroundOnly';

export const GENERATION_MODE_LABELS: Record<GenerationMode, string> = {
  headOnly: '仅生成头部',
  clothingOnly: '仅替换衣服',
  both: '头部和衣服一起替换',
  backgroundOnly: '仅换背景',
};

export const GENERATION_MODE_PROMPTS: Record<GenerationMode, string> = {
  headOnly: '仅替换模特的头部/面部，保持服装和背景不变',
  clothingOnly: '用图1的服装替换图2模特身上的服装，保持图2的其他元素不变',
  both: '用图1的服装替换图2模特身上的服装，同时优化模特的头部/面部，保持背景不变',
  backgroundOnly: '保持模特和服装不变，仅替换背景环境',
};

export interface AppSettings {
  baseUrl: string;
  apiKey: string;
  concurrency: number;
  prompt: string;
  model: string;
  responseFormat: string;
  imageSize: string;
  aspectRatio: string;
  pairingMode: PairingMode;
  generationMode: GenerationMode;
  autoSave: boolean;
  saveMode: SaveMode;
  serverUrl: string;
  subfolder: string;
  previewCompress: boolean;
  previewMaxSize: number;
  previewQuality: number;
}

export interface GalleryItem {
  id: string;
  name: string;
  url: string;
  createdAt: number;
  clothingName: string;
  modelName: string;
  clothingUrl: string;
  modelUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  baseUrl: 'https://ai.comfly.chat',
  apiKey: '',
  concurrency: 5,
  prompt: '用图1的服装替换图2模特身上的服装，保持图2的其他元素不变',
  model: 'nano-banana-2',
  responseFormat: 'url',
  imageSize: '',
  aspectRatio: '',
  pairingMode: 'pair',
  generationMode: 'clothingOnly',
  autoSave: false,
  saveMode: 'download',
  serverUrl: '',
  subfolder: '',
  previewCompress: false,
  previewMaxSize: 768,
  previewQuality: 0.7,
};

export const MAX_CONCURRENCY = 10;
