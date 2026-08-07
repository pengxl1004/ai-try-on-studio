'use client';

import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TaskCard } from './task-card';
import type { Task } from '@/lib/types';

interface TaskQueueProps {
  tasks: Task[];
  stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
    percent: number;
  };
  onPreview: (url: string) => void;
  onRegenerate: (clothingUrl: string, modelUrl: string) => void;
  onDownloadAll: () => void;
  onRetryFailed: () => void;
}

export function TaskQueue({ tasks, stats, onPreview, onRegenerate, onDownloadAll, onRetryFailed }: TaskQueueProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-800">任务队列</h2>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <span className="text-slate-400">等待 {stats.pending}</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-500">运行 {stats.processing}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-500">完成 {stats.completed}</span>
            <span className="text-slate-300">|</span>
            <span className="text-red-400">失败 {stats.failed}</span>
          </div>
        </div>
        <span className="text-2xl font-bold font-mono text-slate-800">{stats.percent}%</span>
      </div>

      <Progress value={stats.percent} className="h-2 mb-6" />

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {tasks.map((task, idx) => (
          <TaskCard key={task.id} task={task} index={idx} onPreview={onPreview} onRegenerate={onRegenerate} />
        ))}
      </div>

      {stats.completed > 0 && (
        <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
          <Button onClick={onDownloadAll} variant="outline" className="border-slate-200">
            <Download className="w-4 h-4 mr-2" />
            下载全部 ({stats.completed})
          </Button>
          {stats.failed > 0 && (
            <Button onClick={onRetryFailed} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试失败 ({stats.failed})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
