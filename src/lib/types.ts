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

export type GenerationMode = 'headOnly' | 'topOnly' | 'bottomOnly' | 'both' | 'backgroundOnly';

export const GENERATION_MODE_LABELS: Record<GenerationMode, string> = {
  headOnly: '仅生成头部',
  topOnly: '仅替换上衣',
  bottomOnly: '仅替换下装',
  both: '头部和衣服一起替换',
  backgroundOnly: '仅换背景',
};

export const GENERATION_MODE_PROMPTS: Record<GenerationMode, string> = {
  headOnly: '第一张图是参考图，第二张图是模特图。仅替换第二张模特图中模特的头部/面部，保持服装和背景不变。注意光影匹配：新生成的头部必须与模特身体的光照方向、阴影强度、色温完全一致，确保自然过渡。',
  topOnly: '第一张图是服装参考图（上衣），第二张图是模特图。仅替换第二张模特图中模特的上衣/上装，保持下装、头部和背景不变。关键要求：1) 用第一张图的上衣样式替换模特的上衣；2) 上衣的光影必须根据模特身体的光照重新渲染；3) 上衣与下装、颈部的衔接处要自然融合；4) 服装褶皱和材质质感要真实；5) 光照方向、阴影强度、色温与模特一致。',
  bottomOnly: '第一张图是服装参考图（下装），第二张图是模特图。仅替换第二张模特图中模特的下装/裤子/裙子，保持上衣、头部和背景不变。关键要求：1) 用第一张图的下装样式替换模特的下装；2) 下装的光影必须根据模特身体的光照重新渲染；3) 下装与上衣、腿部的衔接处要自然融合；4) 服装褶皱和材质质感要真实；5) 光照方向、阴影强度、色温与模特一致。',
  both: '第一张图是服装参考图，第二张图是模特图。用第一张图的服装替换第二张模特图中模特身上的服装，同时优化模特的头部/面部，保持背景不变。关键要求：1) 服装光影根据模特光照重新渲染；2) 头部光影与身体一致；3) 整体色调、色温、光照方向统一；4) 所有元素自然融合。',
  backgroundOnly: '第一张图是模特图，第二张图是背景参考图。保持第一张图中模特和服装不变，仅替换背景环境为第二张图的背景。关键要求：1) 模特和服装的光影必须根据新背景的光照重新调整；2) 模特边缘与新背景自然融合；3) 环境光反射要匹配新背景的光源方向。',
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
  generationMode: 'topOnly',
  autoSave: false,
  saveMode: 'download',
  serverUrl: '',
  subfolder: '',
  previewCompress: false,
  previewMaxSize: 768,
  previewQuality: 0.7,
};

export const MAX_CONCURRENCY = 10;

// 视频生成相关类型
export type VideoTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type VideoPosition = 'left' | 'center' | 'right';
export type VideoAngle = 'front' | 'side' | 'back';
export type VideoScene = 'indoor' | 'outdoor' | 'runway' | 'solid';

export interface VideoTask {
  id: string;
  clothingImg: ImageItem;
  modelImg: ImageItem;
  status: VideoTaskStatus;
  progress: number;
  videoUrl: string | null;
  error: string | null;
  createdAt: number;
  // 坑位设置
  position: VideoPosition;
  angle: VideoAngle;
  scene: VideoScene;
  // 关键词
  keywords: string;
  customPrompt: string;
}

export interface VideoSettings {
  pikaApiKey: string;
  duration: number; // 视频时长（秒）
  fps: number; // 帧率
  resolution: string; // 分辨率
  // 默认坑位设置
  defaultPosition: VideoPosition;
  defaultAngle: VideoAngle;
  defaultScene: VideoScene;
  // 当前选择（用于 UI）
  modelPosition: VideoPosition;
  modelAngle: VideoAngle;
  scene: VideoScene;
  // 关键词和提示词
  prompt: string;
  keywords: string;
  customPrompt: string;
}

export const VIDEO_POSITIONS: { value: VideoPosition; label: string }[] = [
  { value: 'left', label: '左侧' },
  { value: 'center', label: '中间' },
  { value: 'right', label: '右侧' },
];

export const VIDEO_ANGLES: { value: VideoAngle; label: string }[] = [
  { value: 'front', label: '正面' },
  { value: 'side', label: '侧面' },
  { value: 'back', label: '背面' },
];

export const VIDEO_SCENES: { value: VideoScene; label: string; desc: string }[] = [
  { value: 'indoor', label: '室内', desc: '室内摄影棚' },
  { value: 'outdoor', label: '室外', desc: '户外自然光' },
  { value: 'runway', label: 'T 台', desc: '时装秀 T 台' },
  { value: 'solid', label: '纯色', desc: '纯色背景' },
];

export const QUICK_KEYWORDS = [
  '模特转身',
  '模特走动',
  '360 度旋转',
  '展示服装细节',
  '微风效果',
  '自然摆动',
  '优雅姿态',
  '时尚走秀',
];

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  pikaApiKey: '',
  duration: 4,
  fps: 24,
  resolution: '1024x576',
  defaultPosition: 'center',
  defaultAngle: 'front',
  defaultScene: 'indoor',
};
