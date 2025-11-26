/**
 * 统一的 API 调用器
 * 处理所有 API 提供商的请求构建和响应解析
 */

/**
 * 为图像分析构建请求
 */
export function buildAnalyzeImageRequest(provider, params, apiKeys) {
  const { parts } = params;
  let url, requestBody, headers = { 'Content-Type': 'application/json' };

  switch (provider) {
    case 'google':
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
      headers['X-goog-api-key'] = apiKeys.google;
      requestBody = {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      };
      break;

    case 'cloudflare':
      url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;
      headers['Authorization'] = `Bearer ${apiKeys.cloudflare}`;
      requestBody = {
        messages: [{
          role: 'user',
          content: parts.map(part => {
            if (part.text) return { type: 'text', text: part.text };
            if (part.inlineData) {
              return {
                type: 'image_url',
                image_url: {
                  url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                }
              };
            }
            return null;
          }).filter(Boolean)
        }],
        max_tokens: 4096
      };
      break;

    case 'xunfei':
    case 'deepseek':
    case 'baidu':
    case 'tencent':
    case 'alibaba':
      throw new Error(`Provider ${provider} not fully implemented for image analysis`);

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  return { url, requestBody, headers };
}

/**
 * 解析图像分析响应
 */
export function parseAnalyzeImageResponse(data, provider) {
  let text;

  switch (provider) {
    case 'google':
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      break;

    case 'cloudflare':
      text = data.result?.response || data.result?.content;
      break;

    default:
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  if (!text) {
    throw new Error('No response from model');
  }

  // 提取 JSON
  let jsonString = text.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.substring(7);
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.substring(0, jsonString.length - 3);
  }
  jsonString = jsonString.trim();

  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    throw new Error(`Invalid JSON response: ${parseError.message}`);
  }
}

/**
 * 为图像修改构建请求
 */
export function buildModifyImageRequest(provider, params, apiKeys) {
  const { parts } = params;
  let url, requestBody, headers = { 'Content-Type': 'application/json' };

  switch (provider) {
    case 'google':
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
      headers['X-goog-api-key'] = apiKeys.google;
      requestBody = {
        contents: [{ parts }]
      };
      break;

    default:
      throw new Error(`Image modification not supported for provider: ${provider}`);
  }

  return { url, requestBody, headers };
}

/**
 * 解析图像修改响应
 */
export function parseModifyImageResponse(data, provider) {
  if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
    const firstCandidate = data.candidates[0];

    // 检查是否被阻止
    if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
      throw new Error(`Generation stopped: ${firstCandidate.finishReason}`);
    }

    if (firstCandidate.content && firstCandidate.content.parts && Array.isArray(firstCandidate.content.parts)) {
      const responseParts = firstCandidate.content.parts;

      // 查找图像数据
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          return { imageData: part.inlineData.data };
        }
      }
    }
  }

  throw new Error('No image generated in response');
}

/**
 * 为文本翻译构建请求
 */
export function buildTranslateRequest(provider, params, apiKeys) {
  const { parts } = params;
  let url, requestBody, headers = { 'Content-Type': 'application/json' };

  switch (provider) {
    case 'google':
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
      headers['X-goog-api-key'] = apiKeys.google;
      requestBody = {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096
        }
      };
      break;

    case 'cloudflare':
      url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;
      headers['Authorization'] = `Bearer ${apiKeys.cloudflare}`;
      requestBody = {
        messages: [{
          role: 'user',
          content: parts.map(part => {
            if (part.text) return { type: 'text', text: part.text };
            if (part.inlineData) {
              return {
                type: 'image_url',
                image_url: {
                  url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                }
              };
            }
            return null;
          }).filter(Boolean)
        }],
        max_tokens: 4096
      };
      break;

    default:
      throw new Error(`Text translation not supported for provider: ${provider}`);
  }

  return { url, requestBody, headers };
}

/**
 * 解析文本翻译响应
 */
export function parseTranslateResponse(data, provider) {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from translation service');
  }

  return JSON.parse(text);
}

export default {
  buildAnalyzeImageRequest,
  parseAnalyzeImageResponse,
  buildModifyImageRequest,
  parseModifyImageResponse,
  buildTranslateRequest,
  parseTranslateResponse
};

