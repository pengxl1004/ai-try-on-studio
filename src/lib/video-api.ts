import type { VideoTask, VideoSettings, VideoPosition, VideoAngle, VideoScene } from './types';
import { generateId } from './utils';

const FAL_API_BASE = 'https://queue.fal.run';
const FAL_MODEL = 'fal-ai/pika/v2.2/image-to-video';

export async function generateVideo(
  clothingImg: { data: string; name: string },
  modelImg: { data: string; name: string },
  settings: VideoSettings
): Promise<string> {
  const { falApiKey, duration, resolution, modelPosition = 'center', modelAngle = 'front', scene = 'indoor', keywords = '', prompt = '' } = settings;

  if (!falApiKey) {
    throw new Error('请先在设置中配置 Fal API Key');
  }

  // 构建完整的提示词，包含坑位和关键词信息
  const sceneDesc = scene === 'indoor' ? '室内摄影棚' : scene === 'outdoor' ? '户外自然光' : scene === 'runway' ? '时装秀 T 台' : '纯色背景';
  const positionDesc = modelPosition === 'left' ? '左侧' : modelPosition === 'right' ? '右侧' : '中间';
  const angleDesc = modelAngle === 'front' ? '正面' : modelAngle === 'side' ? '侧面' : '背面';

  const fullPrompt = `A fashion model wearing the clothing, posing naturally. The model should showcase the outfit with subtle movements like turning slightly or adjusting the pose. High quality, realistic, professional fashion photography style.\n\n场景：${sceneDesc}，模特位置：${positionDesc}，展示角度：${angleDesc}${keywords ? `\n关键词：${keywords}` : ''}${prompt ? `\n自定义描述：${prompt}` : ''}`;

  // 将 base64 图片转换为 data URI（如果还不是）
  const imageDataUri = modelImg.data.startsWith('data:') ? modelImg.data : `data:image/png;base64,${modelImg.data}`;

  // 创建视频生成任务
  const createResponse = await fetch(`${FAL_API_BASE}/${FAL_MODEL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${falApiKey}`,
    },
    body: JSON.stringify({
      image_url: imageDataUri,
      prompt: fullPrompt,
      resolution: resolution === '1024x576' ? '720p' : '1080p',
      duration: duration >= 7 ? 10 : 5,
      negative_prompt: 'low quality, blurry, distorted, unrealistic',
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`视频生成请求失败 (${createResponse.status}): ${errorText}`);
  }

  const createData = await createResponse.json();
  const requestId = createData.request_id;

  if (!requestId) {
    throw new Error('未能获取视频任务 ID');
  }

  // 轮询任务状态
  return await pollVideoStatus(requestId, falApiKey);
}

async function pollVideoStatus(requestId: string, apiKey: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 每 5 秒检查一次

    const statusResponse = await fetch(`${FAL_API_BASE}/${FAL_MODEL}/requests/${requestId}/status`, {
      headers: {
        'Authorization': `Key ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      continue;
    }

    const statusData = await statusResponse.json();
    const status = statusData.status;

    if (status === 'COMPLETED') {
      // 获取结果
      const resultResponse = await fetch(`${FAL_API_BASE}/${FAL_MODEL}/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${apiKey}`,
        },
      });

      if (!resultResponse.ok) {
        throw new Error('获取视频结果失败');
      }

      const resultData = await resultResponse.json();
      const videoUrl = resultData.video?.url;

      if (videoUrl) {
        return videoUrl;
      }
      throw new Error('视频生成完成但未返回视频 URL');
    }

    if (status === 'FAILED') {
      const errorMsg = statusData.error || '视频生成失败';
      throw new Error(errorMsg);
    }

    // 继续等待 (status === 'IN_QUEUE' || status === 'IN_PROGRESS')
  }

  throw new Error('视频生成超时，请稍后重试');
}

export function createVideoTask(
  clothingImg: { data: string; name: string },
  modelImg: { data: string; name: string },
  settings?: {
    modelPosition?: VideoPosition;
    modelAngle?: VideoAngle;
    scene?: VideoScene;
    keywords?: string;
    prompt?: string;
  }
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
    position: settings?.modelPosition || 'center',
    angle: settings?.modelAngle || 'front',
    scene: settings?.scene || 'indoor',
    keywords: settings?.keywords || '',
    customPrompt: settings?.prompt || '',
  };
}
