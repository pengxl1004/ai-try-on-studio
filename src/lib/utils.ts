import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ImageItem } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function getBlobFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch blob: ${response.status}`);
  return response.blob();
}

export function convertToJpgDataUrl(imgUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = imgUrl;
  });
}

export function compressImageForPreview(
  imgUrl: string,
  maxSize = 768,
  quality = 0.7
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxEdge = Math.max(img.naturalWidth, img.naturalHeight);
        const scale = Math.min(1, maxSize / maxEdge);
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = imgUrl;
  });
}

export function deepSearchForUrl(
  obj: Record<string, unknown>,
  depth = 0,
  visited = new WeakSet()
): string | null {
  if (depth > 5 || !obj || typeof obj !== 'object') return null;
  if (visited.has(obj)) return null;
  visited.add(obj);
  const urlFields = ['url', 'image_url', 'imageUrl', 'image', 'src'];
  for (const field of urlFields) {
    const val = obj[field];
    if (typeof val === 'string' && val.startsWith('http')) return val;
  }
  if (Array.isArray(obj) && obj.length > 0) {
    const result = deepSearchForUrl(obj[0] as Record<string, unknown>, depth + 1, visited);
    if (result) return result;
  }
  for (const key in obj) {
    if (Object.hasOwn(obj, key) && !urlFields.includes(key)) {
      const val = obj[key];
      if (val && typeof val === 'object') {
        const result = deepSearchForUrl(val as Record<string, unknown>, depth + 1, visited);
        if (result) return result;
      }
    }
  }
  return null;
}

export function sanitizeSubfolder(folder: string): string {
  if (!folder) return '';
  return folder.replace(/\.\./g, '').replace(/^\/+/, '').replace(/[<>:"|?*]/g, '').trim();
}

export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  const blob = await getBlobFromUrl(imageUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadImagesSequentially(
  items: { url: string; name: string }[],
  delayMs = 300
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await downloadImage(item.url, item.name || `image_${i + 1}.jpg`);
    if (i < items.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

export function createImageItem(url: string, name: string): ImageItem {
  return { id: generateId(), url, name };
}
