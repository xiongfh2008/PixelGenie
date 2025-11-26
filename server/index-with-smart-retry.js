/**
 * 集成智能重试机制的示例代码
 * 展示如何在现有端点中使用自动切换功能
 */

import { executeApiRequest } from './api-request-handler.js';

// ============================================================================
// 示例 1: 图像分析端点（analyze-image）的智能重试版本
// ============================================================================

/**
 * 图像分析 API 调用 - 带智能重试
 */
async function analyzeImageWithSmartRetry(req, res, dependencies) {
  const { selectApiProvider, updateApiHealth, apiHealthStatus, getApiKeys } = dependencies;
  
  try {
    const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;
    
    // 参数验证...
    if (!originalBase64 || !elaBase64) {
      return res.status(400).json({ error: 'Missing required image data' });
    }
    
    // 准备请求数据
    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
      { inlineData: { mimeType: 'image/png', data: elaBase64 } }
    ];
    
    if (mfrBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
    }
    
    const langMap = {
      en: 'English',
      zh: 'Simplified Chinese (zh-CN)',
      es: 'Spanish',
      ja: 'Japanese',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese'
    };
    
    const targetLang = langMap[lang] || 'English';
    const prompt = `Analyze this image and return JSON with description, tags, objects, sentiment, colors, and integrity analysis. Output must be in ${targetLang}.`;
    
    parts.push({ text: prompt });
    
    // 构建请求配置的函数
    const buildRequestConfig = (provider, requestData, apiKeys) => {
      const { parts } = requestData;
      
      switch (provider) {
        case 'google':
          return {
            url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
            headers: {
              'X-goog-api-key': apiKeys.google,
              'Content-Type': 'application/json'
            },
            requestBody: {
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096
              }
            }
          };
          
        case 'cloudflare':
          return {
            url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
            headers: {
              'Authorization': `Bearer ${apiKeys.cloudflare}`,
              'Content-Type': 'application/json'
            },
            requestBody: {
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
            }
          };
          
        case 'xunfei':
        case 'huggingface':
        case 'deepseek':
          // 其他提供商的配置...
          throw new Error(`Provider ${provider} not fully implemented in this example`);
          
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    };
    
    // 解析响应的函数
    const parseResponse = (provider, data) => {
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
        throw new Error('No response text from model');
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
      
      return JSON.parse(jsonString);
    };
    
    // 执行带智能重试的 API 请求
    const result = await executeApiRequest({
      requestData: { parts },
      requiredCapability: 'imageAnalysis',
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      getApiKeys,
      buildRequestConfig,
      parseResponse,
      maxRetries: 3  // 最多尝试 3 个不同的提供商
    });
    
    // 返回成功响应
    res.json(result.data);
    
    // 可选：在响应头中添加使用的提供商信息（用于调试）
    res.set('X-API-Provider', result.provider);
    res.set('X-API-Attempts', result.attempts.toString());
    
  } catch (error) {
    console.error('Analyze image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// ============================================================================
// 示例 2: 图像修改端点（modify-image）的智能重试版本
// ============================================================================

/**
 * 图像修改 API 调用 - 带智能重试
 */
async function modifyImageWithSmartRetry(req, res, dependencies) {
  const { selectApiProvider, updateApiHealth, apiHealthStatus, getApiKeys } = dependencies;
  
  try {
    const { base64, mimeType, prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
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
    
    // 构建请求配置
    const buildRequestConfig = (provider, requestData, apiKeys) => {
      const { parts } = requestData;
      
      switch (provider) {
        case 'google':
          return {
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`,
            headers: {
              'Content-Type': 'application/json'
            },
            requestBody: {
              contents: [{ parts }]
            }
          };
          
        default:
          throw new Error(`Image modification not supported for provider: ${provider}`);
      }
    };
    
    // 解析响应
    const parseResponse = (provider, data) => {
      if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const firstCandidate = data.candidates[0];
        
        if (firstCandidate.content && firstCandidate.content.parts) {
          for (const part of firstCandidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              return { imageData: part.inlineData.data };
            }
          }
        }
      }
      
      throw new Error('No image generated in response');
    };
    
    // 执行带智能重试的请求
    const result = await executeApiRequest({
      requestData: { parts },
      requiredCapability: 'imageModification',
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      getApiKeys,
      buildRequestConfig,
      parseResponse,
      maxRetries: 3
    });
    
    res.json(result.data);
    res.set('X-API-Provider', result.provider);
    
  } catch (error) {
    console.error('Modify image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to modify image'
    });
  }
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 如何在 Express 路由中使用
 */
function setupRoutes(app, dependencies) {
  // 图像分析端点
  app.post('/api/analyze-image', (req, res) => {
    analyzeImageWithSmartRetry(req, res, dependencies);
  });
  
  // 图像修改端点
  app.post('/api/modify-image', (req, res) => {
    modifyImageWithSmartRetry(req, res, dependencies);
  });
}

export {
  analyzeImageWithSmartRetry,
  modifyImageWithSmartRetry,
  setupRoutes
};

