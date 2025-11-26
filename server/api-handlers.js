/**
 * API 端点处理器 - 带自动故障转移
 * 当某个模型出现异常时，自动切换到其他可用模型
 */

/**
 * 执行带故障转移的 API 请求
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {string} capability - 所需能力
 * @param {Function} buildRequest - 构建请求的函数
 * @param {Function} processResponse - 处理响应的函数
 * @param {Object} options - 选项
 */
export async function executeWithAutoFailover(req, res, capability, buildRequest, processResponse, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    getApiKeys,
    selectApiProvider,
    updateApiHealth,
    detectApiKeyLeak
  } = options;

  const apiKeys = getApiKeys();
  const triedProviders = [];
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 选择提供商（排除已失败的）
      const provider = selectApiProvider(capability, triedProviders);
      
      if (!provider) {
        throw new Error(
          `No available providers for ${capability}. ` +
          `Tried: ${triedProviders.join(', ')}`
        );
      }

      // 如果是重试，记录切换信息
      if (attempt > 1) {
        console.log(`🔄 Auto-switching to ${provider} (attempt ${attempt}/${maxRetries})`);
        console.log(`   Previously failed: [${triedProviders.join(', ')}]`);
      } else {
        console.log(`🔑 Using provider: ${provider} [${capability}]`);
      }

      // 构建请求
      const { url, requestBody, headers } = await buildRequest(provider, apiKeys);

      // 执行请求
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000),
        });
      } catch (fetchError) {
        console.error(`🌐 Network error for ${provider}:`, fetchError.message);
        updateApiHealth(provider, false, `Network error: ${fetchError.message}`);
        triedProviders.push(provider);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        throw fetchError;
      }

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

        // 检测 API 密钥泄露
        if (detectApiKeyLeak(errorMessage)) {
          console.error(`🚨 CRITICAL: API key leak detected for ${provider}!`);
          updateApiHealth(provider, false, errorMessage);
          triedProviders.push(provider);
          
          // 密钥泄露时立即尝试下一个提供商
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          return res.status(503).json({
            error: 'Service temporarily unavailable',
            message: 'The primary API provider is unavailable. Please try again later.',
            suggestion: 'If this persists, please check your API configuration.'
          });
        }

        // 配额超限
        if (response.status === 429 || errorMessage.includes('quota') || errorMessage.includes('Quota')) {
          console.error(`⚠️  Quota exceeded for ${provider}`);
          updateApiHealth(provider, false, errorMessage);
          triedProviders.push(provider);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'API quota exceeded. Trying alternative providers...',
            suggestion: 'Please wait a moment and try again.'
          });
        }

        // 其他错误
        console.error(`❌ API error for ${provider}:`, errorMessage);
        updateApiHealth(provider, false, errorMessage);
        triedProviders.push(provider);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        throw new Error(errorMessage);
      }

      // 成功 - 处理响应
      const data = await response.json();
      const result = await processResponse(data, provider);

      // 更新健康状态
      updateApiHealth(provider, true);

      // 如果经过了故障转移，记录成功信息
      if (triedProviders.length > 0) {
        console.log(`✅ Successfully switched to ${provider} after ${triedProviders.length} failed attempt(s)`);
        console.log(`   Failed providers: [${triedProviders.join(', ')}]`);
      }

      return res.json(result);

    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt >= maxRetries) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // 所有尝试都失败了
  console.error(`❌ All ${maxRetries} attempts failed for ${capability}`);
  console.error(`   Tried providers: [${triedProviders.join(', ')}]`);
  console.error(`   Last error: ${lastError?.message}`);

  return res.status(503).json({
    error: 'Service temporarily unavailable',
    message: 'All API providers are currently unavailable. Please try again later.',
    details: process.env.NODE_ENV === 'development' ? {
      triedProviders: triedProviders,
      lastError: lastError?.message,
      capability: capability
    } : undefined,
    suggestion: 'Please check your network connection and try again in a few minutes.'
  });
}

/**
 * 创建带自动故障转移的图像分析处理器
 */
export function createImageAnalysisHandler(getApiKeys, selectApiProvider, updateApiHealth, detectApiKeyLeak) {
  return async (req, res) => {
    const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;

    // 验证输入
    if (!originalBase64 || !elaBase64) {
      return res.status(400).json({ error: 'Missing required image data' });
    }

    // 构建请求函数
    const buildRequest = async (provider, apiKeys) => {
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

      parts.push({ text: `You are a Lead Digital Forensic Analyst... [prompt text]` });

      let url, requestBody, headers = { 'Content-Type': 'application/json' };

      switch (provider) {
        case 'google':
          url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
          headers['X-goog-api-key'] = apiKeys.google;
          requestBody = {
            contents: [{ parts }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
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
                    image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
                  };
                }
                return null;
              }).filter(Boolean)
            }],
            max_tokens: 4096
          };
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      return { url, requestBody, headers };
    };

    // 处理响应函数
    const processResponse = async (data, provider) => {
      let text;
      if (provider === 'google') {
        text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else if (provider === 'cloudflare') {
        text = data.result?.response || data.result?.content;
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

      return JSON.parse(jsonString);
    };

    // 执行带故障转移的请求
    await executeWithAutoFailover(req, res, 'imageAnalysis', buildRequest, processResponse, {
      maxRetries: 3,
      retryDelay: 1000,
      getApiKeys,
      selectApiProvider,
      updateApiHealth,
      detectApiKeyLeak
    });
  };
}

/**
 * 创建带自动故障转移的图像修改处理器
 */
export function createImageModificationHandler(getApiKeys, selectApiProvider, updateApiHealth, detectApiKeyLeak) {
  return async (req, res) => {
    const { base64, mimeType, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const buildRequest = async (provider, apiKeys) => {
      const parts = [];
      if (base64 && mimeType) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
      }
      parts.push({ text: prompt });

      let url, requestBody, headers = { 'Content-Type': 'application/json' };

      switch (provider) {
        case 'google':
          url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
          headers['X-goog-api-key'] = apiKeys.google;
          requestBody = { contents: [{ parts }] };
          break;

        default:
          throw new Error(`Image modification not supported for provider: ${provider}`);
      }

      return { url, requestBody, headers };
    };

    const processResponse = async (data, provider) => {
      if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const firstCandidate = data.candidates[0];

        if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
          throw new Error(`Generation stopped with reason: ${firstCandidate.finishReason}`);
        }

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

    await executeWithAutoFailover(req, res, 'imageModification', buildRequest, processResponse, {
      maxRetries: 3,
      retryDelay: 2000,
      getApiKeys,
      selectApiProvider,
      updateApiHealth,
      detectApiKeyLeak
    });
  };
}

export default {
  executeWithAutoFailover,
  createImageAnalysisHandler,
  createImageModificationHandler
};

