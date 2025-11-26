/**
 * API 智能故障转移系统
 * 实现自动模型切换，对用户完全透明
 */

import { updateApiHealth, selectApiProvider } from './api-health.js';

/**
 * 带自动重试和故障转移的 API 调用包装器
 * @param {Function} apiCallFunction - API 调用函数
 * @param {string} requiredCapability - 所需能力（如 'imageModification'）
 * @param {Object} params - API 调用参数
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<Object>} API 响应
 */
export async function callWithFailover(apiCallFunction, requiredCapability, params, maxRetries = 3) {
  let lastError = null;
  let attemptedProviders = new Set();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 选择可用的 API 提供商
      const provider = selectApiProvider(requiredCapability, attemptedProviders);
      
      if (!provider) {
        throw new Error(`No available providers for ${requiredCapability} after trying: ${Array.from(attemptedProviders).join(', ')}`);
      }
      
      attemptedProviders.add(provider);
      
      console.log(`🔄 Attempt ${attempt + 1}/${maxRetries}: Using provider ${provider} for ${requiredCapability}`);
      
      // 调用 API
      const result = await apiCallFunction(provider, params);
      
      // 成功 - 更新健康状态
      updateApiHealth(provider, true);
      
      console.log(`✅ Success with provider: ${provider}`);
      return {
        success: true,
        data: result,
        provider: provider,
        attempts: attempt + 1
      };
      
    } catch (error) {
      lastError = error;
      const currentProvider = Array.from(attemptedProviders).pop();
      
      console.error(`❌ Error with provider ${currentProvider}:`, error.message);
      
      // 更新健康状态
      if (currentProvider) {
        updateApiHealth(currentProvider, false, error.message);
      }
      
      // 如果还有重试机会，继续
      if (attempt < maxRetries - 1) {
        console.log(`🔄 Switching to next available provider...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒
        continue;
      }
    }
  }
  
  // 所有尝试都失败了
  console.error(`❌ All providers failed for ${requiredCapability}`);
  console.error(`   Attempted providers: ${Array.from(attemptedProviders).join(', ')}`);
  
  throw new Error(`All API providers failed: ${lastError?.message || 'Unknown error'}`);
}

/**
 * 执行 API 调用的包装器，带超时和错误处理
 * @param {Function} fetchFunction - fetch 函数
 * @param {string} url - API URL
 * @param {Object} options - fetch 选项
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<Response>} fetch 响应
 */
export async function fetchWithTimeout(fetchFunction, url, options, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetchFunction(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * 解析 API 响应，统一处理不同提供商的响应格式
 * @param {string} provider - API 提供商
 * @param {Object} data - 响应数据
 * @returns {Object} 标准化的响应
 */
export function parseApiResponse(provider, data) {
  switch (provider) {
    case 'google':
      return {
        text: data.candidates?.[0]?.content?.parts?.[0]?.text,
        imageData: data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data,
        finishReason: data.candidates?.[0]?.finishReason
      };
      
    case 'cloudflare':
      return {
        text: data.result?.response || data.result?.content,
        imageData: null, // Cloudflare 不支持图像生成
        finishReason: 'STOP'
      };
      
    case 'huggingface':
      return {
        text: data.generated_text || data.text,
        imageData: data.generated_image,
        finishReason: 'STOP'
      };
      
    default:
      return {
        text: data.text || data.response,
        imageData: data.image || data.imageData,
        finishReason: 'STOP'
      };
  }
}

/**
 * 检测是否为可重试的错误
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否可重试
 */
export function isRetryableError(error) {
  const retryablePatterns = [
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'network',
    'fetch failed',
    '503', // Service Unavailable
    '502', // Bad Gateway
    '429', // Too Many Requests (可以重试其他提供商)
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  return retryablePatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
}

/**
 * 检测是否为致命错误（不应重试）
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否为致命错误
 */
export function isFatalError(error) {
  const fatalPatterns = [
    'API key was reported as leaked',
    'invalid authentication',
    'unauthorized',
    '401',
    '403',
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  return fatalPatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
}

export default {
  callWithFailover,
  fetchWithTimeout,
  parseApiResponse,
  isRetryableError,
  isFatalError
};
