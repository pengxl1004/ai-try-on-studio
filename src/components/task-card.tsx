'use client';

import { Eye, RefreshCw, Download, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  index: number;
  onPreview: (url: string) => void;
  onRegenerate: (clothingUrl: string, modelUrl: string) => void;
}

export function TaskCard({ task, index, onPreview, onRegenerate }: TaskCardProps) {
  const statusStyles = {
    pending: 'bg-slate-100 text-slate-500',
    processing: 'bg-amber-50 text-amber-600',
    completed: 'bg-emerald-50 text-emerald-600',
    failed: 'bg-red-50 text-red-500',
  };

  const statusLabels = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-mono text-slate-400">#{index + 1}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[task.status]}`}>
          {task.status === 'processing' && <Loader2 className="w-2.5 h-2.5 inline mr-1 animate-spin" />}
          {statusLabels[task.status]}
        </span>
      </div>

      <div className="relative aspect-[3/4] bg-slate-50 border-t border-slate-100">
        {task.resultUrl ? (
          <>
            <img src={task.resultUrl} alt="result" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => onPreview(task.resultUrl!)}
                className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-sm"
                title="预览"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRegenerate(task.clothingImg.url, task.modelImg.url)}
                className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-sm"
                title="重新生成"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : task.status === 'processing' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-3 border-slate-200 rounded-full" />
              <div className="absolute inset-0 border-3 border-t-indigo-500 rounded-full animate-spin" />
            </div>
            <span className="text-xs text-slate-400 mt-2 font-mono">{task.progress}%</span>
          </div>
        ) : task.status === 'failed' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
            <span className="text-xs text-red-500 text-center line-clamp-3">{task.error}</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-xs text-slate-400 font-mono">{index + 1}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
