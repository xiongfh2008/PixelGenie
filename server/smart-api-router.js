/**
 * 智能API路由器 - 自动故障转移和负载均衡
 * 对用户完全透明的多API提供商管理
 */

/**
 * 执行带自动故障转移的API请求
 * 当某个API失败时，自动尝试下一个可用的API
 * 
 * @param {Object} options 配置选项
 * @param {Function} options.selectApiProvider - 选择API提供商的函数
 * @param {Function} options.updateApiHealth - 更新健康状态的函数
 * @param {Function} options.buildRequest - 构建请求的函数 (provider, params) => requestConfig
 * @param {Function} options.executeRequest - 执行请求的函数 (requestConfig) => Promise<response>
 * @param {Function} options.parseResponse - 解析响应的函数 (response, provider) => result
 * @param {Object} options.params - 请求参数
 * @param {string} options.capability - 所需能力
 * @param {number} options.maxAttempts - 最大尝试次数
 * @returns {Promise<Object>} 请求结果
 */
export async function smartApiRequest({
  selectApiProvider,
  updateApiHealth,
  buildRequest,
  executeRequest,
  parseResponse,
  params,
  capability,
  maxAttempts = 3
}) {
  const attemptedProviders = [];
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let currentProvider = null;
    
    try {
      // 选择下一个可用的API提供商
      currentProvider = selectApiProvider(capability);
      
      // 检查是否已经尝试过这个提供商
      if (attemptedProviders.includes(currentProvider)) {
        console.log(`⏭️  Provider ${currentProvider} already attempted, selecting next...`);
        // 标记为不健康，以便选择下一个
        updateApiHealth(currentProvider, false, 'Already attempted in this request');
        continue;
      }
      
      attemptedProviders.push(currentProvider);
      console.log(`🔄 Attempt ${attempt}/${maxAttempts}: Using ${currentProvider} for ${capability}`);
      
      // 构建请求配置
      const requestConfig = buildRequest(currentProvider, params);
      
      // 执行请求
      const response = await executeRequest(requestConfig);
      
      // 解析响应
      const result = await parseResponse(response, currentProvider);
      
      // 成功！更新健康状态
      updateApiHealth(currentProvider, true);
      console.log(`✅ Success with ${currentProvider} (attempt ${attempt}/${maxAttempts})`);
      
      // 记录成功事件
      logEvent({
        type: 'success',
        provider: currentProvider,
        capability,
        attempt,
        totalAttempts: attempt,
        attemptedProviders
      });
      
      return {
        success: true,
        data: result,
        meta: {
          provider: currentProvider,
          attempts: attempt,
          attemptedProviders
        }
      };
      
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || 'Unknown error';
      
      console.error(`❌ Attempt ${attempt} failed with ${currentProvider}:`, errorMessage);
      
      // 更新健康状态
      if (currentProvider) {
        updateApiHealth(currentProvider, false, errorMessage);
      }
      
      // 记录失败事件
      logEvent({
        type: 'failure',
        provider: currentProvider,
        capability,
        attempt,
        error: errorMessage,
        attemptedProviders
      });
      
      // 如果还有重试机会，等待后继续
      if (attempt < maxAttempts) {
        const waitTime = calculateBackoff(attempt);
        console.log(`⏳ Waiting ${waitTime}ms before next attempt...`);
        await sleep(waitTime);
      }
    }
  }
  
  // 所有尝试都失败了
  const errorSummary = {
    message: 'All API providers failed',
    attemptedProviders,
    totalAttempts: maxAttempts,
    lastError: lastError?.message || 'Unknown error',
    capability
  };
  
  console.error('❌ All attempts exhausted:', errorSummary);
  
  // 记录完全失败事件
  logEvent({
    type: 'all_failed',
    ...errorSummary
  });
  
  throw new Error(
    `Failed to complete request after ${maxAttempts} attempts. ` +
    `Tried providers: ${attemptedProviders.join(', ')}. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * 计算指数退避时间
 */
function calculateBackoff(attempt) {
  const baseDelay = 1000; // 1秒
  const maxDelay = 5000;  // 5秒
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  // 添加随机抖动，避免雷鸣群效应
  return delay + Math.random() * 1000;
}

/**
 * 睡眠函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 记录事件（用于监控和分析）
 */
function logEvent(event) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event
  };
  
  // 根据事件类型使用不同的日志级别
  switch (event.type) {
    case 'success':
      console.log('📊 [SUCCESS]', JSON.stringify(logEntry));
      break;
    case 'failure':
      console.warn('⚠️  [FAILURE]', JSON.stringify(logEntry));
      break;
    case 'all_failed':
      console.error('🚨 [ALL_FAILED]', JSON.stringify(logEntry));
      break;
    default:
      console.log('📊 [EVENT]', JSON.stringify(logEntry));
  }
  
  // 在生产环境中，可以发送到监控服务
  // sendToMonitoring(logEntry);
}

/**
 * 创建一个简化的API请求包装器
 * 用于快速集成到现有代码中
 */
export function createApiWrapper({
  selectApiProvider,
  updateApiHealth,
  getApiKeys
}) {
  return {
    /**
     * 执行图像分析请求
     */
    async analyzeImage(parts, capability = 'imageAnalysis') {
      return smartApiRequest({
        selectApiProvider,
        updateApiHealth,
        capability,
        params: { parts },
        
        buildRequest: (provider, { parts }) => {
          const apiKeys = getApiKeys();
          let url, requestBody, headers;
          
          switch (provider) {
            case 'google':
              url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
              requestBody = {
                contents: [{ parts }],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 4096
                }
              };
              headers = {
                'X-goog-api-key': apiKeys.google,
                'Content-Type': 'application/json'
              };
              break;
              
            case 'cloudflare':
              url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;
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
              headers = {
                'Authorization': `Bearer ${apiKeys.cloudflare}`,
                'Content-Type': 'application/json'
              };
              break;
              
            case 'huggingface':
              // HuggingFace 实现
              throw new Error('HuggingFace image analysis not implemented in wrapper');
              
            default:
              throw new Error(`Unsupported provider: ${provider}`);
          }
          
          return { url, requestBody, headers, provider };
        },
        
        executeRequest: async ({ url, requestBody, headers }) => {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(30000)
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
          }
          
          return response.json();
        },
        
        parseResponse: (data, provider) => {
          let text;
          
          if (provider === 'google') {
            text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          } else if (provider === 'cloudflare') {
            text = data.result?.response || data.result?.content;
          }
          
          if (!text) {
            throw new Error('No response from model');
          }
          
          // 提取JSON
          let jsonString = text.trim();
          if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7);
          }
          if (jsonString.endsWith('```')) {
            jsonString = jsonString.substring(0, jsonString.length - 3);
          }
          jsonString = jsonString.trim();
          
          return JSON.parse(jsonString);
        }
      });
    },
    
    /**
     * 执行图像修改请求
     */
    async modifyImage(base64, mimeType, prompt, capability = 'imageModification') {
      return smartApiRequest({
        selectApiProvider,
        updateApiHealth,
        capability,
        params: { base64, mimeType, prompt },
        
        buildRequest: (provider, { base64, mimeType, prompt }) => {
          const apiKeys = getApiKeys();
          const parts = [];
          
          if (base64 && mimeType) {
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64
              }
            });
          }
          parts.push({ text: prompt });
          
          let url, requestBody, headers;
          
          if (provider === 'google') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
            requestBody = {
              contents: [{ parts }]
            };
            headers = {
              'X-goog-api-key': apiKeys.google,
              'Content-Type': 'application/json'
            };
          } else {
            throw new Error(`Image modification not supported for provider: ${provider}`);
          }
          
          return { url, requestBody, headers, provider };
        },
        
        executeRequest: async ({ url, requestBody, headers }) => {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(30000)
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
          }
          
          return response.json();
        },
        
        parseResponse: (data, provider) => {
          if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
            const firstCandidate = data.candidates[0];
            
            if (firstCandidate.content && firstCandidate.content.parts) {
              const responseParts = firstCandidate.content.parts;
              
              for (const part of responseParts) {
                if (part.inlineData && part.inlineData.data) {
                  return { imageData: part.inlineData.data };
                }
              }
            }
          }
          
          throw new Error('No image generated in response');
        }
      });
    }
  };
}

export default {
  smartApiRequest,
  createApiWrapper,
  calculateBackoff,
  sleep,
  logEvent
};

