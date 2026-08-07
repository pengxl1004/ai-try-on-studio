'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ImageItem } from '@/lib/types';

interface ImageDropzoneProps {
  type: 'clothing' | 'model';
  images: ImageItem[];
  title: string;
  groupId: string;
  maxImages?: number; // 限制最大图片数量，undefined 表示不限制
  onAddImages: (groupId: string, type: 'clothing' | 'model', files: File[]) => void;
  onRemoveImage: (groupId: string, type: 'clothing' | 'model', imageId: string) => void;
  onClearImages: (groupId: string, type: 'clothing' | 'model') => void;
  onReorder: (groupId: string, type: 'clothing' | 'model', fromIndex: number, toIndex: number) => void;
  onCrop?: (imageId: string, imageUrl: string) => void;
}

export function ImageDropzone({
  type, images, title, groupId, maxImages,
  onAddImages, onRemoveImage, onClearImages, onReorder, onCrop,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const isAtMax = maxImages !== undefined && images.length >= maxImages;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (isAtMax) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      // 如果限制了最大数量，只取第一张
      const filesToAdd = maxImages === 1 ? [files[0]] : files;
      onAddImages(groupId, type, filesToAdd);
    }
  }, [groupId, type, onAddImages, isAtMax, maxImages]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && !isAtMax) {
      // 如果限制了最大数量，只取第一张
      const filesToAdd = maxImages === 1 ? [files[0]] : files;
      onAddImages(groupId, type, filesToAdd);
    }
    e.target.value = '';
  }, [groupId, type, onAddImages, isAtMax, maxImages]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropOnImage = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      onReorder(groupId, type, dragIndex, toIndex);
    }
    setDragIndex(null);
  }, [dragIndex, groupId, type, onReorder]);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title} <span className="text-slate-400">({images.length}{maxImages ? `/${maxImages}` : ''})</span>
        </h3>
        {images.length > 0 && (
          <button
            onClick={() => onClearImages(groupId, type)}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
            清空
          </button>
        )}
      </div>

      <div
        className={`rounded-lg border-2 border-dashed transition-all duration-200 min-h-[140px] p-4 ${
          isAtMax
            ? 'border-emerald-200 bg-emerald-50/30'
            : dragOver
            ? 'border-indigo-400 bg-indigo-50/50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); if (!isAtMax) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {images.length === 0 ? (
          <label className={`flex flex-col items-center justify-center py-8 ${isAtMax ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'}`}>
            <div className="p-3 rounded-lg bg-slate-50 group-hover:bg-indigo-50 transition-colors mb-3">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">
              {isAtMax ? '已达上限' : '拖拽或点击上传'}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {maxImages === 1 ? '仅支持 1 张图片' : 'JPG, PNG, WEBP'}
            </span>
            <input
              ref={inputRef}
              type="file"
              multiple={maxImages !== 1}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        ) : (
          <div className="space-y-3">
            <div className={`grid gap-2 ${maxImages === 1 ? 'grid-cols-1 max-w-[120px]' : 'grid-cols-4 sm:grid-cols-5'}`}>
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  draggable={maxImages !== 1}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDropOnImage(e, idx)}
                  onDragEnd={() => setDragIndex(null)}
                  className={`relative group/item aspect-square rounded-lg overflow-hidden border border-slate-200 ${maxImages === 1 ? '' : 'cursor-grab active:cursor-grabbing'} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    dragIndex === idx ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/80 font-mono">{idx + 1}</span>
                      <div className="flex gap-1">
                        {onCrop && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onCrop(img.id, img.url); }}
                            className="p-1 rounded bg-white/20 hover:bg-indigo-500 text-white transition-colors"
                            title="裁剪"
                          >
                            <Crop className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveImage(groupId, type, img.id); }}
                          className="p-1 rounded bg-white/20 hover:bg-red-500 text-white transition-colors"
                          title="删除"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {maxImages !== 1 && !isAtMax && (
              <label className="flex items-center justify-center py-2 border border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                <Upload className="w-4 h-4 text-slate-400 mr-1.5" />
                <span className="text-xs text-slate-500">继续添加</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
            {isAtMax && maxImages === 1 && (
              <div className="text-center py-2 text-xs text-emerald-600 font-medium">
                ✓ 已选择服装图片
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
