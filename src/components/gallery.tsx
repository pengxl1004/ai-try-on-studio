'use client';

import { useState, useCallback } from 'react';
import { Eye, RefreshCw, Download, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GalleryItem } from '@/lib/types';
import { downloadImagesSequentially } from '@/lib/utils';

interface GalleryProps {
  items: GalleryItem[];
  onPreview: (url: string) => void;
  onRegenerate: (clothingUrl: string, modelUrl: string, clothingName: string, modelName: string) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export function Gallery({ items, onPreview, onRegenerate, onRemoveItem, onClearAll }: GalleryProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(items.map(i => i.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const downloadSelected = useCallback(async () => {
    const selectedItems = items.filter(i => selected.has(i.id));
    if (selectedItems.length === 0) return;
    await downloadImagesSequentially(selectedItems.map(i => ({ url: i.url, name: i.name })));
  }, [items, selected]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          画廊 <span className="text-slate-400 font-normal">({items.length})</span>
        </h2>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClearAll} className="text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            清空画廊
          </Button>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">操作</span>
          <Button variant="outline" size="sm" onClick={selectAll}>全选</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>取消选择</Button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSelected}
            disabled={selected.size === 0}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            下载选中 ({selected.size})
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 opacity-30" />
          </div>
          <p className="font-medium">暂无生成结果</p>
          <p className="text-sm mt-1">生成的图片会自动保存在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`relative group aspect-[3/4] rounded-lg overflow-hidden border cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                selected.has(item.id) ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
              onClick={() => toggleSelect(item.id)}
            >
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />

              <div className={`absolute inset-0 transition-opacity duration-200 ${
                selected.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <div className="absolute inset-0 bg-white/80" />
                <div className="absolute top-2 left-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selected.has(item.id) ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300'
                  }`}>
                    {selected.has(item.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-2 flex justify-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onPreview(item.url); }}
                    className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-sm"
                    title="预览"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRegenerate(item.clothingUrl, item.modelUrl, item.clothingName, item.modelName); }}
                    className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-sm"
                    title="重新生成"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                    className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
