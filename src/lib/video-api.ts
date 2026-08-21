import type { VideoTask, VideoSettings } from './types';
import { generateId } from './utils';

const PIKA_API_BASE = 'https://api.pika.art';

export async function generateVideo(
  clothingImg: { data: string; name: string },
  modelImg: { data: string; name: string },
  settings: VideoSettings
): Promise<string> {
  const { pikaApiKey, duration, fps, resolution } = settings;

  if (!pikaApiKey) {
    throw new Error('请先在设置中配置 Pika API Key');
  }

  // 创建视频生成任务
  const createResponse = await fetch(`${PIKA_API_BASE}/v1/video/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pikaApiKey}`,
    },
    body: JSON.stringify({
      model: 'pika-2',
      prompt: `A fashion model wearing the clothing from the first image, posing naturally. The model should showcase the outfit with subtle movements like turning slightly or adjusting the pose. High quality, realistic, professional fashion photography style.`,
      images: [clothingImg.data, modelImg.data],
      duration: duration,
      fps: fps,
      resolution: resolution,
      negative_prompt: 'low quality, blurry, distorted, unrealistic',
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`视频生成请求失败 (${createResponse.status}): ${errorText}`);
  }

  const createData = await createResponse.json();
  const taskId = createData.data?.id || createData.id;

  if (!taskId) {
    throw new Error('未能获取视频任务 ID');
  }

  // 轮询任务状态
  return await pollVideoStatus(taskId, pikaApiKey);
}

async function pollVideoStatus(taskId: string, apiKey: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 每 5 秒检查一次

    const statusResponse = await fetch(`${PIKA_API_BASE}/v1/video/generation/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      continue;
    }

    const statusData = await statusResponse.json();
    const status = statusData.data?.status || statusData.status;

    if (status === 'completed' || status === 'succeeded') {
      const videoUrl = statusData.data?.video_url || statusData.video_url || statusData.data?.url || statusData.url;
      if (videoUrl) {
        return videoUrl;
      }
      throw new Error('视频生成完成但未返回视频 URL');
    }

    if (status === 'failed' || status === 'error') {
      const errorMsg = statusData.data?.error || statusData.error || '视频生成失败';
      throw new Error(errorMsg);
    }

    // 继续等待 (status === 'processing' || status === 'pending')
  }

  throw new Error('视频生成超时，请稍后重试');
}

export function createVideoTask(
  clothingImg: { data: string; name: string },
  modelImg: { data: string; name: string }
): VideoTask {
  return {
    id: generateId(),
    clothingImg: {
      id: generateId(),
      name: clothingImg.name,
      url: clothingImg.data,
    },
    modelImg: {
      id: generateId(),
      name: modelImg.name,
      url: modelImg.data,
    },
    status: 'pending',
    progress: 0,
    videoUrl: null,
    error: null,
    createdAt: Date.now(),
  };
}
