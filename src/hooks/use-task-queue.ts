'use client';

import { useReducer, useRef, useCallback, useMemo, useState } from 'react';
import type { Task, ImageGroup, AppSettings, PairingMode } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { callTryonAPI } from '@/lib/api';

type TaskAction =
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'UPDATE_TASK'; id: string; updates: Partial<Task> }
  | { type: 'CLEAR_TASKS' };

function taskReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'SET_TASKS': return action.tasks;
    case 'UPDATE_TASK': return state.map(t => t.id === action.id ? { ...t, ...action.updates } : t);
    case 'CLEAR_TASKS': return [];
    default: return state;
  }
}

class Semaphore {
  private max: number;
  private count = 0;
  private queue: (() => void)[] = [];

  constructor(max: number) { this.max = max; }

  acquire(): Promise<void> {
    return new Promise(resolve => {
      if (this.count < this.max) { this.count++; resolve(); }
      else { this.queue.push(resolve); }
    });
  }

  release() {
    this.count--;
    if (this.queue.length > 0) { this.count++; this.queue.shift()!(); }
  }
}

function buildTasksForGroup(group: ImageGroup, pairingMode: PairingMode): Task[] {
  const { clothingImages: c, modelImages: m } = group;
  
  // 自动模式：1张服装图 + 多张模特图 = 多张结果
  if (c.length === 1 && m.length > 0) {
    return m.map(model => ({
      id: generateId(), clothingImg: c[0], modelImg: model,
      status: 'pending' as const, progress: 0, resultUrl: null, error: null,
    }));
  }
  
  if (pairingMode === 'fixedModel') {
    return c.map(clothing => ({
      id: generateId(), clothingImg: clothing, modelImg: m[0],
      status: 'pending' as const, progress: 0, resultUrl: null, error: null,
    }));
  }
  if (pairingMode === 'fixedClothing') {
    return m.map(model => ({
      id: generateId(), clothingImg: c[0], modelImg: model,
      status: 'pending' as const, progress: 0, resultUrl: null, error: null,
    }));
  }
  return c.map((clothing, i) => ({
    id: generateId(), clothingImg: clothing, modelImg: m[i],
    status: 'pending' as const, progress: 0, resultUrl: null, error: null,
  })).filter(t => t.modelImg); // 过滤掉没有对应模特图的任务
}

export function useTaskQueue() {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [isRunning, setIsRunning] = useState(false);
  const semaphoreRef = useRef<Semaphore | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const processTask = useCallback(async (task: Task, settings: AppSettings, signal: AbortSignal) => {
    dispatch({ type: 'UPDATE_TASK', id: task.id, updates: { status: 'processing', progress: 30 } });
    try {
      const resultUrl = await callTryonAPI(task.clothingImg, task.modelImg, settings, signal);
      dispatch({ type: 'UPDATE_TASK', id: task.id, updates: { status: 'completed', progress: 100, resultUrl } });
      return resultUrl;
    } catch (e) {
      if ((e as Error).message !== '已取消') {
        dispatch({ type: 'UPDATE_TASK', id: task.id, updates: { status: 'failed', error: (e as Error).message } });
      }
      return null;
    }
  }, []);

  const startBatch = useCallback(async (groups: ImageGroup[], settings: AppSettings) => {
    if (!settings.apiKey) return { error: '请先在设置中填写 API Key' };

    const errors: string[] = [];
    groups.forEach((g, idx) => {
      const c = g.clothingImages.length;
      const m = g.modelImages.length;
      if (c === 0 || m === 0) errors.push(`${g.name}: 请先添加服装和模特图片`);
      else if (settings.pairingMode === 'pair' && c !== m) errors.push(`${g.name}: 1:1 模式下服装和模特图片数量必须相同`);
      else if (settings.pairingMode === 'fixedModel' && m < 1) errors.push(`${g.name}: 固定模特模式需要至少 1 张模特图`);
      else if (settings.pairingMode === 'fixedClothing' && c < 1) errors.push(`${g.name}: 固定服装模式需要至少 1 张服装图`);
    });
    if (errors.length > 0) return { error: errors.join('\n') };

    const newTasks = groups.flatMap(g => buildTasksForGroup(g, settings.pairingMode));
    dispatch({ type: 'SET_TASKS', tasks: newTasks });
    setIsRunning(true);

    abortControllerRef.current = new AbortController();
    semaphoreRef.current = new Semaphore(settings.concurrency);
    const signal = abortControllerRef.current.signal;

    const results: { task: Task; resultUrl: string | null }[] = [];

    const promises = newTasks.map(task =>
      semaphoreRef.current!.acquire().then(async () => {
        try {
          if (!signal.aborted) {
            const resultUrl = await processTask(task, settings, signal);
            results.push({ task, resultUrl });
          }
        } finally {
          semaphoreRef.current!.release();
        }
      })
    );

    await Promise.allSettled(promises);
    setIsRunning(false);
    return { error: null, results };
  }, [processTask]);

  const stopBatch = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsRunning(false);
  }, []);

  const retryFailed = useCallback(async (settings: AppSettings) => {
    const failedTasks = tasks.filter(t => t.status === 'failed');
    if (failedTasks.length === 0) return;

    failedTasks.forEach(t => {
      dispatch({ type: 'UPDATE_TASK', id: t.id, updates: { status: 'pending', progress: 0, error: null } });
    });

    setIsRunning(true);
    abortControllerRef.current = new AbortController();
    semaphoreRef.current = new Semaphore(settings.concurrency);
    const signal = abortControllerRef.current.signal;

    const promises = failedTasks.map(task =>
      semaphoreRef.current!.acquire().then(async () => {
        try {
          if (!signal.aborted) await processTask(task, settings, signal);
        } finally {
          semaphoreRef.current!.release();
        }
      })
    );

    await Promise.allSettled(promises);
    setIsRunning(false);
  }, [tasks, processTask]);

  const stats = useMemo(() => {
    const pending = tasks.filter(t => t.status === 'pending').length;
    const processing = tasks.filter(t => t.status === 'processing').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const total = tasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { pending, processing, completed, failed, total, percent };
  }, [tasks]);

  return {
    tasks,
    isRunning,
    stats,
    dispatch,
    startBatch,
    stopBatch,
    retryFailed,
  };
}
