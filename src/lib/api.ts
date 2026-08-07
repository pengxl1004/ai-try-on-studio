import type { AppSettings } from './types';
import { GENERATION_MODE_PROMPTS } from './types';
import { convertToJpgDataUrl, deepSearchForUrl, getBlobFromUrl } from './utils';

export async function callTryonAPI(
  clothingImg: { url: string },
  modelImg: { url: string },
  settings: AppSettings,
  signal: AbortSignal
): Promise<string> {
  const clothingDataUrl = await convertToJpgDataUrl(clothingImg.url);
  const modelDataUrl = await convertToJpgDataUrl(modelImg.url);
  if (!clothingDataUrl || !modelDataUrl) {
    throw new Error('图片转换失败');
  }

  const clothingBlob = await fetch(clothingDataUrl).then(r => r.blob());
  const modelBlob = await fetch(modelDataUrl).then(r => r.blob());

  const effectivePrompt = GENERATION_MODE_PROMPTS[settings.generationMode] || settings.prompt;

  const buildFormData = (imageField: string) => {
    const fd = new FormData();
    fd.append(imageField, clothingBlob, 'clothing.jpg');
    fd.append(imageField, modelBlob, 'model.jpg');
    fd.append('model', settings.model || 'nano-banana-2');
    fd.append('prompt', effectivePrompt);
    if (settings.responseFormat) fd.append('response_format', settings.responseFormat);
    if (settings.aspectRatio) fd.append('aspect_ratio', settings.aspectRatio);
    if (settings.imageSize) fd.append('image_size', settings.imageSize);
    return fd;
  };

  const requestOnce = async (imageField: string) => {
    const response = await fetch(`${settings.baseUrl}/v1/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      body: buildFormData(imageField),
      signal,
    });
    return response;
  };

  let response = await requestOnce('image');
  if (!response.ok && (response.status === 400 || response.status === 422)) {
    response = await requestOnce('image[]');
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`API错误: ${response.status} ${errText}`);
    }
  } else if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API错误: ${response.status} ${errText}`);
  }

  const data = await response.json().catch(() => ({}));
  const imageUrl = deepSearchForUrl(data);
  if (imageUrl) return imageUrl;
  const b64 = data?.data?.[0]?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error('未找到结果图片URL');
}

export async function saveImageToServer(
  imageUrl: string,
  filename: string,
  serverUrl: string,
  subfolder: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const blob = await getBlobFromUrl(imageUrl);
    const formData = new FormData();
    formData.append('image', blob, filename);
    if (subfolder) formData.append('subfolder', subfolder);
    const response = await fetch(`${serverUrl}/api/save-image`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000),
    });
    return { success: response.ok };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function testServerConnection(serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
