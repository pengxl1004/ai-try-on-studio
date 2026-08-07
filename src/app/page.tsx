'use client';

import { useState, useCallback } from 'react';
import { Settings, Zap, Layers, Play, Square, Plus, GalleryHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageGroupCard } from '@/components/image-group-card';
import { TaskQueue } from '@/components/task-queue';
import { SettingsDialog } from '@/components/settings-dialog';
import { Gallery } from '@/components/gallery';
import { PreviewModal } from '@/components/preview-modal';
import { useSettings } from '@/hooks/use-settings';
import { useImageGroups } from '@/hooks/use-image-groups';
import { useTaskQueue } from '@/hooks/use-task-queue';
import type { GalleryItem, Task, GenerationMode } from '@/lib/types';
import { GENERATION_MODE_LABELS } from '@/lib/types';
import { generateId, downloadImagesSequentially } from '@/lib/utils';

type ActiveTab = 'workspace' | 'gallery';

export default function HomePage() {
  const [settings, setSettings] = useSettings();
  const {
    groups, addGroup, removeGroup, renameGroup, toggleGroupCollapse, moveGroup,
    addImages, removeImage, clearImages, reorderImages,
  } = useImageGroups();
  const { tasks, isRunning, stats, dispatch, startBatch, stopBatch, retryFailed } = useTaskQueue();

  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [showSettings, setShowSettings] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const addToGallery = useCallback((resultUrl: string, clothingName: string, modelName: string) => {
    const item: GalleryItem = {
      id: generateId(),
      name: `tryon_${clothingName}_${modelName}_${Date.now()}.jpg`,
      url: resultUrl,
      createdAt: Date.now(),
      clothingName,
      modelName,
      clothingUrl: '',
      modelUrl: '',
    };
    setGalleryItems(prev => [item, ...prev]);
  }, []);

  const handleStartBatch = useCallback(async () => {
    const result = await startBatch(groups, settings);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.results) {
      result.results.forEach(({ task, resultUrl }) => {
        if (resultUrl) {
          addToGallery(resultUrl, task.clothingImg.name, task.modelImg.name);
        }
      });
    }
  }, [groups, settings, startBatch, addToGallery]);

  const handleRunGroup = useCallback(async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const result = await startBatch([group], settings);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.results) {
      result.results.forEach(({ task, resultUrl }) => {
        if (resultUrl) {
          addToGallery(resultUrl, task.clothingImg.name, task.modelImg.name);
        }
      });
    }
  }, [groups, settings, startBatch, addToGallery]);

  const handleRetryFailed = useCallback(async () => {
    await retryFailed(settings);
  }, [retryFailed, settings]);

  const handleDownloadAll = useCallback(async () => {
    const completed = tasks.filter(t => t.status === 'completed' && t.resultUrl);
    await downloadImagesSequentially(
      completed.map((t, i) => ({
        url: t.resultUrl!,
        name: `tryon_${i + 1}_${Date.now()}.jpg`,
      }))
    );
  }, [tasks]);

  const handlePreview = useCallback((url: string) => {
    setPreviewUrl(url);
  }, []);

  const handleRegenerate = useCallback(async (clothingUrl: string, modelUrl: string) => {
    if (!clothingUrl || !modelUrl) return;
    const task: Task = {
      id: generateId(),
      clothingImg: { id: generateId(), url: clothingUrl, name: 'clothing' },
      modelImg: { id: generateId(), url: modelUrl, name: 'model' },
      status: 'pending',
      progress: 0,
      resultUrl: null,
      error: null,
    };
    dispatch({ type: 'SET_TASKS', tasks: [...tasks, task] });

    const result = await startBatch(
      [{
        id: generateId(),
        name: 'regen',
        clothingImages: [task.clothingImg],
        modelImages: [task.modelImg],
        collapsed: false,
      }],
      settings
    );
    if (result.results) {
      result.results.forEach(({ task: t, resultUrl }) => {
        if (resultUrl) addToGallery(resultUrl, t.clothingImg.name, t.modelImg.name);
      });
    }
  }, [tasks, settings, dispatch, startBatch, addToGallery]);

  const handleGalleryRegenerate = useCallback(async (clothingUrl: string, modelUrl: string, clothingName: string, modelName: string) => {
    await handleRegenerate(clothingUrl, modelUrl);
  }, [handleRegenerate]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  AI Try-on <span className="text-xs font-medium text-slate-400 ml-1">Studio</span>
                </h1>
              </div>
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('workspace')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'workspace'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  工作台
                </button>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'gallery'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GalleryHorizontal className="w-4 h-4" />
                  画廊
                  {galleryItems.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === 'gallery' ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {galleryItems.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {/* Quick Mode Selector */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {(Object.entries(GENERATION_MODE_LABELS) as [GenerationMode, string][]).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSettings(prev => ({ ...prev, generationMode: mode }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      settings.generationMode === mode
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="border-slate-200 hover:bg-slate-50"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            {/* Groups Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-400" />
                图片分组
              </h2>
              <Button onClick={addGroup} variant="outline" className="border-slate-200">
                <Plus className="w-4 h-4 mr-1.5" />
                新建分组
              </Button>
            </div>

            {/* Group Cards */}
            <div className="space-y-4">
              {groups.map((group, idx) => (
                <ImageGroupCard
                  key={group.id}
                  group={group}
                  index={idx}
                  total={groups.length}
                  onRename={renameGroup}
                  onRemove={removeGroup}
                  onToggle={toggleGroupCollapse}
                  onMove={moveGroup}
                  onRunGroup={handleRunGroup}
                  onAddImages={addImages}
                  onRemoveImage={removeImage}
                  onClearImages={clearImages}
                  onReorder={reorderImages}
                />
              ))}
            </div>

            {/* Control Bar */}
            <div className="sticky bottom-6 z-30">
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 flex items-center gap-4">
                <Button
                  onClick={handleStartBatch}
                  disabled={isRunning || !groups.some(g => g.clothingImages.length > 0 && g.modelImages.length > 0)}
                  className="flex-1 h-14 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-base rounded-lg disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" fill="currentColor" />
                      开始批量生成
                    </>
                  )}
                </Button>

                {isRunning && (
                  <Button
                    onClick={stopBatch}
                    variant="outline"
                    className="h-14 px-6 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Square className="w-4 h-4 mr-2" fill="currentColor" />
                    停止
                  </Button>
                )}
              </div>
            </div>

            {/* Task Queue */}
            <TaskQueue
              tasks={tasks}
              stats={stats}
              onPreview={handlePreview}
              onRegenerate={handleRegenerate}
              onDownloadAll={handleDownloadAll}
              onRetryFailed={handleRetryFailed}
            />
          </div>
        )}

        {activeTab === 'gallery' && (
          <Gallery
            items={galleryItems}
            onPreview={handlePreview}
            onRegenerate={handleGalleryRegenerate}
            onRemoveItem={(id) => setGalleryItems(prev => prev.filter(i => i.id !== id))}
            onClearAll={() => setGalleryItems([])}
          />
        )}
      </main>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Preview Modal */}
      <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-slate-400">
            AI Virtual Try-on Studio &middot; Powered by AI Image Generation
          </p>
        </div>
      </footer>
    </div>
  );
}
