'use client';

import { ChevronDown, ChevronUp, GripVertical, Trash2, Play, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageDropzone } from './image-dropzone';
import type { ImageGroup } from '@/lib/types';

interface ImageGroupCardProps {
  group: ImageGroup;
  index: number;
  total: number;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onRunGroup: (id: string) => void;
  onAddImages: (groupId: string, type: 'clothing' | 'model', files: File[]) => void;
  onRemoveImage: (groupId: string, type: 'clothing' | 'model', imageId: string) => void;
  onClearImages: (groupId: string, type: 'clothing' | 'model') => void;
  onReorder: (groupId: string, type: 'clothing' | 'model', fromIndex: number, toIndex: number) => void;
  onCrop?: (imageId: string, imageUrl: string) => void;
}

export function ImageGroupCard({
  group, index, total,
  onRename, onRemove, onToggle, onMove, onRunGroup,
  onAddImages, onRemoveImage, onClearImages, onReorder, onCrop,
}: ImageGroupCardProps) {
  const hasImages = group.clothingImages.length > 0 || group.modelImages.length > 0;
  // 计算将生成的任务数量：1张服装图 × N张模特图
  const taskCount = group.clothingImages.length > 0 ? group.modelImages.length : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />

        <button
          onClick={() => onToggle(group.id)}
          className="p-1 rounded hover:bg-slate-100 transition-colors"
        >
          {group.collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <input
          value={group.name}
          onChange={e => onRename(group.id, e.target.value)}
          className="flex-1 bg-transparent text-base font-semibold text-slate-800 outline-none border-b border-transparent hover:border-slate-200 focus:border-indigo-400 transition-colors px-1 py-0.5"
        />

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(group.id, 'up')}
            disabled={index === 0}
            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="上移"
          >
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button
            onClick={() => onMove(group.id, 'down')}
            disabled={index === total - 1}
            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="下移"
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {hasImages && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRunGroup(group.id)}
              className="ml-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            >
              <Play className="w-3 h-3 mr-1" />
              运行此组
            </Button>
          )}

          {total > 1 && (
            <button
              onClick={() => onRemove(group.id)}
              className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors ml-1"
              title="删除分组"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!group.collapsed && (
        <div className="p-5">
          <div className="flex gap-6">
            <ImageDropzone
              type="clothing"
              images={group.clothingImages}
              title="服装图片"
              groupId={group.id}
              maxImages={1}
              onAddImages={onAddImages}
              onRemoveImage={onRemoveImage}
              onClearImages={onClearImages}
              onReorder={onReorder}
              onCrop={onCrop}
            />
            <div className="w-px bg-slate-200 self-stretch" />
            <ImageDropzone
              type="model"
              images={group.modelImages}
              title="模特图片"
              groupId={group.id}
              onAddImages={onAddImages}
              onRemoveImage={onRemoveImage}
              onClearImages={onClearImages}
              onReorder={onReorder}
              onCrop={onCrop}
            />
          </div>
          {/* 任务数量预览 */}
          {taskCount > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-50 border border-indigo-100">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-indigo-700 font-medium">
                将生成 <span className="font-bold">{taskCount}</span> 张AI图片
              </span>
              <span className="text-xs text-indigo-400">（1 服装 × {taskCount} 模特）</span>
            </div>
          )}
        </div>
      )}

      {group.collapsed && (
        <div className="px-5 py-3 text-xs text-slate-400 flex items-center gap-4">
          <span>{group.clothingImages.length} 件服装</span>
          <span>{group.modelImages.length} 位模特</span>
        </div>
      )}
    </div>
  );
}
