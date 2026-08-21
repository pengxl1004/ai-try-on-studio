'use client';

import { useState, useCallback, useEffect } from 'react';
import { Video, Upload, Play, Download, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { VideoTask, VideoSettings, VideoScene } from '@/lib/types';
import { DEFAULT_VIDEO_SETTINGS } from '@/lib/types';
import { generateVideo, createVideoTask } from '@/lib/video-api';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'ai-try-on-video-settings';
const TASKS_KEY = 'ai-try-on-video-tasks';

function loadVideoSettings(): VideoSettings {
  if (typeof window === 'undefined') return DEFAULT_VIDEO_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_VIDEO_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_VIDEO_SETTINGS;
}

function loadVideoTasks(): VideoTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(TASKS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function VideoPage() {
  const [clothingImg, setClothingImg] = useState<{ data: string; name: string } | null>(null);
  const [modelImg, setModelImg] = useState<{ data: string; name: string } | null>(null);
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [settings, setSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
  const [initialized, setInitialized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 初始化加载
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      setSettings(loadVideoSettings());
      setTasks(loadVideoTasks());
    }
  }, [initialized]);

  const handleImageUpload = useCallback(
    (type: 'clothing' | 'model', file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        if (type === 'clothing') {
          setClothingImg({ data, name: file.name });
        } else {
          setModelImg({ data, name: file.name });
        }
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!clothingImg || !modelImg) {
      alert('请先上传服装图和模特图');
      return;
    }

    if (!settings.falApiKey) {
      alert('请先在设置中配置 Fal API Key');
      return;
    }

    setIsGenerating(true);

    const task = createVideoTask(clothingImg, modelImg, {
      modelPosition: settings.modelPosition,
      modelAngle: settings.modelAngle,
      scene: settings.scene,
      keywords: settings.keywords,
      prompt: settings.prompt,
    });
    const newTasks = [task, ...tasks];
    setTasks(newTasks);

    try {
      // 更新状态为处理中
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: 'processing' as const, progress: 10 } : t))
      );

      const videoUrl = await generateVideo(clothingImg, modelImg, settings);

      // 更新为完成
      setTasks(prev => {
        const updated = prev.map(t =>
          t.id === task.id
            ? { ...t, status: 'completed' as const, progress: 100, videoUrl }
            : t
        );
        localStorage.setItem(TASKS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '视频生成失败';
      setTasks(prev => {
        const updated = prev.map(t =>
          t.id === task.id
            ? { ...t, status: 'failed' as const, progress: 0, error: errorMsg }
            : t
        );
        localStorage.setItem(TASKS_KEY, JSON.stringify(updated));
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  }, [clothingImg, modelImg, settings, tasks]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      localStorage.setItem(TASKS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSaveSettings = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    alert('设置已保存');
  }, [settings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Video className="w-8 h-8 text-indigo-600" />
            AI 试衣视频生成
          </h1>
          <p className="text-slate-600 mt-2">上传服装图和模特图，生成模特展示视频</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：上传区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 图片上传 */}
            <Card>
              <CardHeader>
                <CardTitle>上传图片</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* 服装图上传 */}
                  <div>
                    <Label className="mb-2 block">服装图</Label>
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('clothing-upload')?.click()}
                    >
                      {clothingImg ? (
                        <div className="space-y-2">
                          <img
                            src={clothingImg.data}
                            alt={clothingImg.name}
                            className="max-h-48 mx-auto rounded"
                          />
                          <p className="text-sm text-slate-600 truncate">{clothingImg.name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClothingImg(null);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-slate-400" />
                          <p className="text-sm text-slate-600">点击上传服装图</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="clothing-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('clothing', file);
                      }}
                    />
                  </div>

                  {/* 模特图上传 */}
                  <div>
                    <Label className="mb-2 block">模特图</Label>
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('model-upload')?.click()}
                    >
                      {modelImg ? (
                        <div className="space-y-2">
                          <img
                            src={modelImg.data}
                            alt={modelImg.name}
                            className="max-h-48 mx-auto rounded"
                          />
                          <p className="text-sm text-slate-600 truncate">{modelImg.name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModelImg(null);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-slate-400" />
                          <p className="text-sm text-slate-600">点击上传模特图</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="model-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('model', file);
                      }}
                    />
                  </div>
                </div>

                {/* 生成按钮 */}
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!clothingImg || !modelImg || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      生成视频
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 任务列表 */}
            <Card>
              <CardHeader>
                <CardTitle>生成任务</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">暂无生成任务</p>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="border border-slate-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                task.status === 'completed'
                                  ? 'default'
                                  : task.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {task.status === 'completed'
                                ? '已完成'
                                : task.status === 'failed'
                                ? '失败'
                                : task.status === 'processing'
                                ? '生成中'
                                : '等待中'}
                            </Badge>
                            <span className="text-sm text-slate-600">
                              {new Date(task.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {task.status === 'processing' && (
                          <Progress value={task.progress} className="w-full" />
                        )}

                        {task.error && (
                          <p className="text-sm text-red-600">{task.error}</p>
                        )}

                        {task.videoUrl && (
                          <div className="space-y-2">
                            <video
                              src={task.videoUrl}
                              controls
                              className="w-full rounded-lg"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => task.videoUrl && window.open(task.videoUrl, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              下载视频
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：设置面板 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  视频设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Fal API Key</Label>
                  <Input
                    type="password"
                    value={settings.falApiKey}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, falApiKey: e.target.value }))
                    }
                    placeholder="输入你的 Fal API Key (从 fal.ai 获取)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    从{' '}
                    <a
                      href="https://fal.ai/dashboard/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      fal.ai/dashboard/keys
                    </a>
                    {' '}获取 API Key
                  </p>
                </div>

                <div>
                  <Label>视频时长</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[5, 10].map((dur) => (
                      <Button
                        key={dur}
                        variant={settings.duration === dur ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setSettings((prev) => ({ ...prev, duration: dur }))
                        }
                      >
                        {dur} 秒
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>分辨率</Label>
                  <select
                    className="w-full mt-1 p-2 border border-slate-300 rounded"
                    value={settings.resolution}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, resolution: e.target.value }))
                    }
                  >
                    <option value="1024x576">720p (16:9)</option>
                    <option value="1920x1080">1080p (16:9)</option>
                  </select>
                </div>

                {/* 坑位选择 */}
                <div>
                  <Label>模特位置</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(['left', 'center', 'right'] as const).map((pos) => (
                      <Button
                        key={pos}
                        variant={settings.modelPosition === pos ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setSettings((prev) => ({ ...prev, modelPosition: pos }))
                        }
                      >
                        {pos === 'left' ? '左侧' : pos === 'center' ? '中间' : '右侧'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>展示角度</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(['front', 'side', 'back'] as const).map((angle) => (
                      <Button
                        key={angle}
                        variant={settings.modelAngle === angle ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setSettings((prev) => ({ ...prev, modelAngle: angle }))
                        }
                      >
                        {angle === 'front' ? '正面' : angle === 'side' ? '侧面' : '背面'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>场景</Label>
                  <select
                    className="w-full mt-1 p-2 border border-slate-300 rounded"
                    value={settings.scene}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, scene: e.target.value as VideoScene }))
                    }
                  >
                    <option value="indoor">室内</option>
                    <option value="outdoor">室外</option>
                    <option value="runway">T 台</option>
                    <option value="studio">纯色背景</option>
                  </select>
                </div>

                {/* 关键词输入 */}
                <div>
                  <Label>视频描述关键词</Label>
                  <textarea
                    className="w-full mt-1 p-2 border border-slate-300 rounded min-h-[80px]"
                    value={settings.prompt}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, prompt: e.target.value }))
                    }
                    placeholder="描述你想要的视频效果，例如：模特转身展示服装、微风效果、时尚优雅..."
                  />
                </div>

                <div>
                  <Label>快速选择</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['模特转身', '模特走动', '360 度旋转', '微风效果', '时尚展示', '优雅姿态'].map(
                      (keyword) => (
                        <Button
                          key={keyword}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              prompt: prev.prompt ? `${prev.prompt} ${keyword}` : keyword,
                            }))
                          }
                        >
                          {keyword}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={handleSaveSettings}>
                  保存设置
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
