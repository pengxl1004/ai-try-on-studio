'use client';

import { useState } from 'react';
import { X, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { AppSettings, SaveMode } from '@/lib/types';
import { MAX_CONCURRENCY } from '@/lib/types';
import { testServerConnection } from '@/lib/api';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, onSettingsChange }: SettingsDialogProps) {
  const [serverTestStatus, setServerTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const update = (partial: Partial<AppSettings>) => {
    onSettingsChange(prev => ({ ...prev, ...partial }));
  };

  const handleTestServer = async () => {
    if (!settings.serverUrl) return;
    setServerTestStatus('testing');
    const ok = await testServerConnection(settings.serverUrl);
    setServerTestStatus(ok ? 'success' : 'error');
    setTimeout(() => setServerTestStatus('idle'), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">系统设置</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">API Base URL</Label>
            <Input
              value={settings.baseUrl}
              onChange={e => update({ baseUrl: e.target.value })}
              placeholder="https://api.example.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">API Key</Label>
            <Input
              type="password"
              value={settings.apiKey}
              onChange={e => update({ apiKey: e.target.value })}
              placeholder="输入你的 API Key"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider">
              并发数: {settings.concurrency}
            </Label>
            <Slider
              value={[settings.concurrency]}
              onValueChange={([v]) => update({ concurrency: v })}
              min={1}
              max={MAX_CONCURRENCY}
              step={1}
              className="py-1"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>1</span>
              <span>{MAX_CONCURRENCY}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">系统提示词</Label>
            <Textarea
              value={settings.prompt}
              onChange={e => update({ prompt: e.target.value })}
              className="h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">模型 ID</Label>
            <Input
              value={settings.model}
              onChange={e => update({ model: e.target.value })}
              placeholder="nano-banana-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">输出尺寸</Label>
              <Input
                value={settings.imageSize}
                onChange={e => update({ imageSize: e.target.value })}
                placeholder="1024x1024"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">宽高比</Label>
              <Input
                value={settings.aspectRatio}
                onChange={e => update({ aspectRatio: e.target.value })}
                placeholder="3:4"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider">客户端压缩</Label>
              <Switch
                checked={settings.previewCompress}
                onCheckedChange={v => update({ previewCompress: v })}
              />
            </div>
            {settings.previewCompress && (
              <div className="grid grid-cols-2 gap-3 pl-1">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">最大尺寸 (px)</Label>
                  <Input
                    type="number"
                    value={settings.previewMaxSize}
                    onChange={e => update({ previewMaxSize: Number(e.target.value) })}
                    min={256}
                    max={2048}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">质量 (0-1)</Label>
                  <Input
                    type="number"
                    step={0.1}
                    min={0.1}
                    max={1}
                    value={settings.previewQuality}
                    onChange={e => update({ previewQuality: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider">自动保存结果</Label>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={v => update({ autoSave: v })}
              />
            </div>
            {settings.autoSave && (
              <div className="space-y-3 pl-1">
                <Select
                  value={settings.saveMode}
                  onValueChange={(v: SaveMode) => update({ saveMode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="download">浏览器下载</SelectItem>
                    <SelectItem value="server">服务器 API</SelectItem>
                  </SelectContent>
                </Select>

                {settings.saveMode === 'server' && (
                  <div className="space-y-2">
                    <Input
                      value={settings.serverUrl}
                      onChange={e => update({ serverUrl: e.target.value })}
                      placeholder="http://localhost:3000"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestServer}
                      disabled={serverTestStatus === 'testing'}
                    >
                      <TestTube className="w-3 h-3 mr-1.5" />
                      {serverTestStatus === 'testing' ? '测试中...' :
                       serverTestStatus === 'success' ? '连接成功' :
                       serverTestStatus === 'error' ? '连接失败' : '测试连接'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
