/**
 * 集成智能API路由器的示例代码
 * 展示如何将现有的API端点升级为支持自动故障转移
 */

import { createApiWrapper } from './smart-api-router.js';

/**
 * 示例: 升级 /api/analyze-image 端点
 * 
 * 这个示例展示了如何将现有的图像分析端点改造为
 * 支持自动故障转移的版本
 */

// ============================================
// 方法 1: 使用 createApiWrapper (推荐)
// ============================================

export function setupAnalyzeImageWithWrapper(app, selectApiProvider, updateApiHealth, getApiKeys) {
  // 创建API包装器
  const apiWrapper = createApiWrapper({
    selectApiProvider,
    updateApiHealth,
    getApiKeys
  });

  app.post('/api/analyze-image', async (req, res) => {
    try {
      const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;

      // 验证输入...
      if (!originalBase64 || !elaBase64) {
        return res.status(400).json({ error: 'Missing required image data' });
      }

      // 构建请求parts
      const parts = [
        { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
        { inlineData: { mimeType: 'image/png', data: elaBase64 } }
      ];
      
      if (mfrBase64) {
        parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
      }

      // 添加提示词
      const langMap = {
        en: 'English',
        zh: 'Simplified Chinese (zh-CN)',
        // ... 其他语言
      };
      const targetLang = langMap[lang] || 'English';
      const prompt = `Analyze this image... (in ${targetLang})`;
      parts.push({ text: prompt });

      // 🎯 使用智能路由器执行请求
      // 自动处理故障转移，对用户完全透明
      const result = await apiWrapper.analyzeImage(parts, 'imageAnalysis');

      // 返回结果
      res.json(result.data);

    } catch (error) {
      console.error('Analyze image error:', error);
      res.status(500).json({
        error: error.message || 'Failed to analyze image',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
}

// ============================================
// 方法 2: 使用 smartApiRequest (更灵活)
// ============================================

import { smartApiRequest } from './smart-api-router.js';

export function setupModifyImageWithSmartRequest(app, selectApiProvider, updateApiHealth, getApiKeys) {
  app.post('/api/modify-image', async (req, res) => {
    try {
      const { base64, mimeType, prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // 🎯 使用 smartApiRequest 执行请求
      const result = await smartApiRequest({
        selectApiProvider,
        updateApiHealth,
        capability: 'imageModification',
        params: { base64, mimeType, prompt },
        maxAttempts: 3,

        // 构建请求配置
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

          switch (provider) {
            case 'google':
              url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
              requestBody = {
                contents: [{ parts }]
              };
              headers = {
                'X-goog-api-key': apiKeys.google,
                'Content-Type': 'application/json'
              };
              break;

            default:
              throw new Error(`Image modification not supported for provider: ${provider}`);
          }

          return { url, requestBody, headers, provider };
        },

        // 执行请求
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

        // 解析响应
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

      // 返回结果
      res.json(result.data);

    } catch (error) {
      console.error('Modify image error:', error);
      res.status(500).json({
        error: error.message || 'Failed to modify image',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
}

// ============================================
// 方法 3: 创建可复用的请求执行器
// ============================================

/**
 * 创建一个通用的API请求执行器
 * 可以在多个端点中复用
 */
export function createRequestExecutor(selectApiProvider, updateApiHealth, getApiKeys) {
  return {
    /**
     * 执行图像分析请求
     */
    async executeImageAnalysis(parts) {
      return smartApiRequest({
        selectApiProvider,
        updateApiHealth,
        capability: 'imageAnalysis',
        params: { parts },
        maxAttempts: 3,

        buildRequest: (provider, { parts }) => {
          const apiKeys = getApiKeys();
          // ... 构建请求逻辑
        },

        executeRequest: async (config) => {
          // ... 执行请求逻辑
        },

        parseResponse: (data, provider) => {
          // ... 解析响应逻辑
        }
      });
    },

    /**
     * 执行图像修改请求
     */
    async executeImageModification(base64, mimeType, prompt) {
      return smartApiRequest({
        selectApiProvider,
        updateApiHealth,
        capability: 'imageModification',
        params: { base64, mimeType, prompt },
        maxAttempts: 3,
        // ... 其他配置
      });
    },

    /**
     * 执行文本翻译请求
     */
    async executeTextTranslation(base64, mimeType, targetLang) {
      return smartApiRequest({
        selectApiProvider,
        updateApiHealth,
        capability: 'textTranslation',
        params: { base64, mimeType, targetLang },
        maxAttempts: 3,
        // ... 其他配置
      });
    }
  };
}

// ============================================
// 使用示例
// ============================================

/**
 * 在主服务器文件中使用
 */
export function setupAllEndpoints(app, selectApiProvider, updateApiHealth, getApiKeys) {
  // 创建请求执行器
  const executor = createRequestExecutor(selectApiProvider, updateApiHealth, getApiKeys);

  // 图像分析端点
  app.post('/api/analyze-image', async (req, res) => {
    try {
      const { parts } = buildPartsFromRequest(req.body);
      const result = await executor.executeImageAnalysis(parts);
      res.json(result.data);
    } catch (error) {
      handleError(res, error);
    }
  });

  // 图像修改端点
  app.post('/api/modify-image', async (req, res) => {
    try {
      const { base64, mimeType, prompt } = req.body;
      const result = await executor.executeImageModification(base64, mimeType, prompt);
      res.json(result.data);
    } catch (error) {
      handleError(res, error);
    }
  });

  // 文本翻译端点
  app.post('/api/translate-image-text', async (req, res) => {
    try {
      const { base64, mimeType, targetLang } = req.body;
      const result = await executor.executeTextTranslation(base64, mimeType, targetLang);
      res.json(result.data);
    } catch (error) {
      handleError(res, error);
    }
  });
}

// ============================================
// 辅助函数
// ============================================

function buildPartsFromRequest(body) {
  const { originalBase64, elaBase64, mfrBase64, lang } = body;

  const parts = [
    { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
    { inlineData: { mimeType: 'image/png', data: elaBase64 } }
  ];

  if (mfrBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
  }

  // 添加提示词...
  const prompt = buildPrompt(lang);
  parts.push({ text: prompt });

  return { parts };
}

function buildPrompt(lang) {
  const langMap = {
    en: 'English',
    zh: 'Simplified Chinese (zh-CN)',
    // ...
  };
  const targetLang = langMap[lang] || 'English';
  return `Analyze this image in ${targetLang}...`;
}

function handleError(res, error) {
  console.error('API error:', error);
  res.status(500).json({
    error: error.message || 'Request failed',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}

// ============================================
// 导出
// ============================================

export default {
  setupAnalyzeImageWithWrapper,
  setupModifyImageWithSmartRequest,
  createRequestExecutor,
  setupAllEndpoints
};

