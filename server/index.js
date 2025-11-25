import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import {
  HUGGINGFACE_MODELS,
  detectAIGenerated,
  editImage,
  removeWatermark,
  translateImageText,
  generateLogo,
  analyzeCompression
} from './huggingface-config.js';

// Load environment variables from server/.env
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Get API Keys
const getApiKeys = () => {
  const apiKeys = {
    google: process.env.GOOGLE_API_KEY,
    baidu: process.env.BAIDU_API_KEY,
    xunfei: process.env.XUNFEI_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
    tencent: process.env.TENCENT_API_KEY,
    alibaba: process.env.ALIBABA_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY
  };
  
  // Check if at least one API key is available
  const availableKeys = Object.entries(apiKeys).filter(([_, key]) => key).map(([name]) => name);
  
  if (availableKeys.length === 0) {
    console.error('❌ No API keys found in server environment variables');
    console.error('📁 Expected location: server/.env');
    console.error('💡 Please set at least one of: GOOGLE_API_KEY, BAIDU_API_KEY, XUNFEI_API_KEY, HUGGINGFACE_API_KEY, TENCENT_API_KEY, ALIBABA_API_KEY, DEEPSEEK_API_KEY');
    console.error('📋 Current environment variables:');
    console.error(`   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? 'Set' : 'Not set'}`);
    console.error(`   BAIDU_API_KEY: ${process.env.BAIDU_API_KEY ? 'Set' : 'Not set'}`);
    console.error(`   XUNFEI_API_KEY: ${process.env.XUNFEI_API_KEY ? 'Set' : 'Not set'}`);
    console.error(`   XUNFEI_APP_ID: ${process.env.XUNFEI_APP_ID ? 'Set' : 'Not set'}`);
    console.error(`   XUNFEI_API_SECRET: ${process.env.XUNFEI_API_SECRET ? 'Set' : 'Not set'}`);
    console.error(`   TENCENT_API_KEY: ${process.env.TENCENT_API_KEY ? 'Set' : 'Not set'}`);
    console.error(`   ALIBABA_API_KEY: ${process.env.ALIBABA_API_KEY ? 'Set' : 'Not set'}`);
    console.error(`   DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? 'Set' : 'Not set'}`);
    throw new Error('No API keys configured. Please check server/.env file.');
  }
  
  console.log(`✅ Available API keys: ${availableKeys.join(', ')}`);
  
  // Log Xunfei configuration status
  if (process.env.XUNFEI_API_KEY && process.env.XUNFEI_APP_ID && process.env.XUNFEI_API_SECRET) {
    console.log('✅ Xunfei Spark API configuration complete');
  } else if (process.env.XUNFEI_API_KEY || process.env.XUNFEI_APP_ID || process.env.XUNFEI_API_SECRET) {
    console.warn('⚠️ Xunfei Spark API configuration incomplete');
    console.warn(`   AppID: ${process.env.XUNFEI_APP_ID ? 'Set' : 'Missing'}`);
    console.warn(`   API Key: ${process.env.XUNFEI_API_KEY ? 'Set' : 'Missing'}`);
    console.warn(`   API Secret: ${process.env.XUNFEI_API_SECRET ? 'Set' : 'Missing'}`);
  }
  
  return apiKeys;
};

// API健康状态跟踪
let apiHealthStatus = {
  huggingface: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  xunfei: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  deepseek: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  google: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  baidu: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  tencent: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  alibaba: { healthy: true, lastCheck: Date.now(), errorCount: 0 }
};

// API健康检查函数
const checkApiHealth = async (provider, apiKey) => {
  try {
    // 对于不同的提供商使用不同的健康检查方法
    switch (provider) {
      case 'huggingface':
        // 简单的模型信息查询作为健康检查
        const response = await fetch('https://huggingface.co/api/models/microsoft/resnet-50', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        return response.ok;
        
      case 'google':
        // 对于Google，我们不进行实际的API调用作为健康检查，避免消耗配额
        // 只有在实际调用时出现错误才标记为不健康
        return true;
        
      case 'xunfei':
      case 'deepseek':
      case 'baidu':
      case 'tencent':
      case 'alibaba':
        // 对于其他提供商，暂时标记为健康
        return true;
        
      default:
        return true;
    }
  } catch (error) {
    console.error(`Health check failed for ${provider}:`, error.message);
    return false;
  }
};

// 检测API密钥泄露错误
const detectApiKeyLeak = (errorMessage) => {
  if (!errorMessage) return false;
  
  const leakIndicators = [
    'API key was reported as leaked',
    'key has been leaked',
    'compromised key',
    'revoked key',
    'invalid authentication credentials',
    'API key not found',
    'suspended key',
    'key has been disabled'
  ];
  
  return leakIndicators.some(indicator => 
    errorMessage.toLowerCase().includes(indicator.toLowerCase())
  );
};

// 更新API健康状态
const updateApiHealth = (provider, isHealthy, error = null) => {
  if (!apiHealthStatus[provider]) {
    apiHealthStatus[provider] = { healthy: true, lastCheck: Date.now(), errorCount: 0 };
  }
  
  const status = apiHealthStatus[provider];
  status.lastCheck = Date.now();
  
  if (isHealthy) {
    status.healthy = true;
    status.errorCount = 0;
  } else {
    status.healthy = false;
    status.errorCount += 1;
    
    // 检测API密钥泄露
    if (error && detectApiKeyLeak(error)) {
      console.error(`🚨 CRITICAL: API key leak detected for ${provider}!`);
      console.error(`🔒 Security Alert: ${provider} API key may have been compromised`);
      console.error(`💡 Recommendation: Immediately rotate the ${provider} API key`);
      
      // 标记为严重不健康状态
      status.leaked = true;
      status.leakDetectedAt = Date.now();
    }
    
    // 如果错误次数超过阈值，暂时标记为不健康
    if (status.errorCount > 3) {
      console.warn(`API provider ${provider} marked as unhealthy after ${status.errorCount} errors`);
    }
    
    if (error) {
      console.error(`API Error for ${provider}:`, error);
    }
  }
};

// 智能API提供商选择 - 实现主备自动切换
const selectApiProvider = () => {
  const apiKeys = getApiKeys();
  const availableProviders = Object.entries(apiKeys).filter(([_, key]) => key).map(([name]) => name);
  
  // 定义主备优先级组
  // 第一组：主用提供商（优先级高）
  // 第二组：备用提供商（免费或成本较低）
  const primaryProviders = ['google', 'xunfei'];
  const backupProviders = ['huggingface', 'deepseek'];
  const fallbackProviders = ['baidu', 'tencent', 'alibaba'];
  
  // 过滤掉已检测到密钥泄露的提供商
  const filterLeakedProviders = (providers) => {
    return providers.filter(provider => {
      const status = apiHealthStatus[provider];
      if (status && status.leaked) {
        console.warn(`🚫 Skipping ${provider} due to detected API key leak`);
        return false;
      }
      return true;
    });
  };
  
  const safePrimaryProviders = filterLeakedProviders(primaryProviders);
  const safeBackupProviders = filterLeakedProviders(backupProviders);
  const safeFallbackProviders = filterLeakedProviders(fallbackProviders);
  
  // 首先检查主用提供商
  for (const provider of safePrimaryProviders) {
    if (apiKeys[provider] && apiHealthStatus[provider]?.healthy) {
      console.log(`🔑 Active provider (primary): ${provider}`);
      return provider;
    }
  }
  
  // 然后检查备用提供商
  for (const provider of safeBackupProviders) {
    if (apiKeys[provider] && apiHealthStatus[provider]?.healthy) {
      console.log(`🔑 Active provider (backup): ${provider}`);
      return provider;
    }
  }
  
  // 最后使用降级提供商
  for (const provider of safeFallbackProviders) {
    if (apiKeys[provider] && apiHealthStatus[provider]?.healthy) {
      console.log(`🔑 Active provider (fallback): ${provider}`);
      return provider;
    }
  }
  
  // 如果所有安全提供商都不健康，尝试返回第一个可用的（包括可能泄露的）
  for (const provider of [...primaryProviders, ...backupProviders, ...fallbackProviders]) {
    if (apiKeys[provider]) {
      const status = apiHealthStatus[provider];
      if (status && status.leaked) {
        console.error(`🚨 CRITICAL: Forced fallback to leaked ${provider} API key!`);
        console.error(`💡 URGENT: Rotate ${provider} API key immediately!`);
      }
      console.warn(`⚠️  All safe providers marked as unhealthy, falling back to: ${provider}`);
      return provider;
    }
  }
  
  throw new Error('No available API providers');
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PixelGenie AI Server is running',
    endpoints: {
      health: '/api/health',
      analyzeImage: '/api/analyze-image',
      modifyImage: '/api/modify-image',
      translateImageText: '/api/translate-image-text',
      detectTextTranslate: '/api/detect-text-translate'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Analyze Image endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;

    // Enhanced validation with specific error messages
    if (!originalBase64) {
      return res.status(400).json({ error: 'Missing original image data (originalBase64)' });
    }
    
    if (!elaBase64) {
      return res.status(400).json({ error: 'Missing ELA image data (elaBase64)' });
    }
    
    // Validate that the data is actually base64 encoded
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(originalBase64)) {
      return res.status(400).json({ error: 'Invalid original image data format - must be base64 encoded' });
    }
    
    if (!base64Regex.test(elaBase64)) {
      return res.status(400).json({ error: 'Invalid ELA image data format - must be base64 encoded' });
    }
    
    // Validate MFR if provided
    if (mfrBase64 && !base64Regex.test(mfrBase64)) {
      return res.status(400).json({ error: 'Invalid MFR image data format - must be base64 encoded' });
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
    const langInstruction = `The final JSON output values MUST be in ${targetLang}.`;

    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
      { inlineData: { mimeType: 'image/png', data: elaBase64 } }
    ];
    if (mfrBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
    }

    parts.push({ text: `You are a Lead Digital Forensic Analyst specializing in detecting AI-generated media (Flux, Midjourney v6, Sora) and advanced Photoshop manipulation.
      
      **INPUTS**:
      1. **Original Image**
      2. **ELA Map** (Rainbow): Error Level Analysis. Shows compression discrepancies.
      3. **MFR Map** (Grayscale): Noise Analysis. Authentic photos have uniform noise. AI often has 'black voids' (no noise).

      **EXECUTION PROTOCOL**:
      
      **PHASE 1: SEMANTIC & PHYSICS CHECK (Primary Detection Method)**
      *Scan the Original Image closely.*
      - **AI Artifacts**: Look for glossy/waxy skin texture, perfect symmetry, melded fingers, nonsensical background text, floating objects, or impossible lighting.
      - **Logic**: Do shadows match the light source? Are reflections correct?
      - **Verdict Hint**: If it looks "too perfect" or has "dream-like" physics -> Likely AI.

      **PHASE 2: FORENSIC MAP CONFIRMATION**
      - **ELA (Rainbow)**:
        - **IGNORE** white/rainbow edges on high-contrast lines (text, sharp borders). This is normal JPEG behavior.
        - **FLAG** if a specific object (e.g., a face) is purple while the body is blue. This indicates SPLICING.
      - **MFR (Grayscale)**:
        - **Authentic**: Uniform grain/static across the whole image.
        - **AI Generated**: Often shows smooth black areas (voids) where texture should be, lacking camera sensor noise.

      ${langInstruction}

      **DECISION RULES**:
      1. **AI Generated**: Visually flawless but "plastic" look OR MFR shows lack of noise (black voids) + ELA is uniform.
      2. **Tampered/Spliced**: ELA shows distinct colored block on an object.
      3. **Authentic**: Natural imperfections, consistent noise, consistent ELA (except edges).

      IMPORTANT: Return ONLY a valid JSON object with these exact keys: description, tags, objects, sentiment, colors, and integrity. The integrity object must contain: is_suspected_fake, confidence_score, reasoning, methods_analyzed, ai_generated_probability, and ai_analysis. Do NOT include any text before or after the JSON.` });
  
      // Multi-API provider support
      const apiKeys = getApiKeys();
      const provider = selectApiProvider();
      
      let url, requestBody;
      
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
          break;
          
        case 'baidu':
          // Baidu API endpoint (placeholder - need actual endpoint)
          url = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';
          requestBody = {
            messages: [
              {
                role: 'user',
                content: parts.map(part => {
                  if (part.text) return { type: 'text', text: part.text };
                  if (part.inlineData) return { type: 'image_url', image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } };
                  return null;
                }).filter(Boolean)
              }
            ],
            stream: false
          };
          break;
          
        case 'xunfei':
          // Xunfei API endpoint (placeholder - need actual endpoint)
          url = 'https://spark-api.xf-yun.com/v1.1/chat';
          requestBody = {
            header: { app_id: apiKeys.xunfei },
            parameter: { chat: { domain: 'general', temperature: 0.1, max_tokens: 4096 } },
            payload: {
              message: {
                text: parts.filter(p => p.text).map(p => ({ role: 'user', content: p.text }))
              }
            }
          };
          break;
          
        case 'tencent':
          // Tencent Hunyuan API endpoint
          url = 'https://hunyuan.cloud.tencent.com/hyllm/v1/chat/completions';
          requestBody = {
            messages: [
              {
                role: 'user',
                content: parts.map(part => {
                  if (part.text) return { type: 'text', text: part.text };
                  if (part.inlineData) return { type: 'image_url', image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } };
                  return null;
                }).filter(Boolean)
              }
            ],
            stream: false
          };
          break;
          
        case 'alibaba':
          // Alibaba Tongyi Qianwen API endpoint
          url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
          requestBody = {
            model: 'qwen-vl-plus',
            input: {
              messages: [
                {
                  role: 'user',
                  content: parts.map(part => {
                    if (part.text) return { text: part.text };
                    if (part.inlineData) return { image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` };
                    return null;
                  }).filter(Boolean)
                }
              ]
            },
            parameters: {
              temperature: 0.1,
              max_tokens: 4096
            }
          };
          break;
          
        case 'deepseek':
          // DeepSeek API endpoint
          url = 'https://api.deepseek.com/v1/chat/completions';
          requestBody = {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'user',
                content: parts.map(part => {
                  if (part.text) return { type: 'text', text: part.text };
                  if (part.inlineData) return { type: 'image_url', image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } };
                  return null;
                }).filter(Boolean)
              }
            ],
            temperature: 0.1,
            max_tokens: 4096
          };
          break;
          
        case 'huggingface':
          // HuggingFace API endpoint for AI detection
          try {
            const apiKeys = getApiKeys();
            const result = await detectAIGenerated(originalBase64, apiKeys.huggingface);
            
            // Transform HuggingFace response to match expected format
            const transformedResult = {
              description: 'AI detection analysis using HuggingFace model',
              tags: ['ai-detection', 'huggingface'],
              objects: [],
              sentiment: 'neutral',
              colors: [],
              integrity: {
                is_suspected_fake: result.score > 0.7,
                confidence_score: result.score || 0.5,
                reasoning: 'Analyzed using HuggingFace AI detection model',
                methods_analyzed: ['huggingface-ai-detection'],
                ai_generated_probability: result.score || 0.5,
                ai_analysis: {
                  model: HUGGINGFACE_MODELS.aiDetection.model,
                  confidence: result.score || 0.5
                }
              }
            };
            
            return res.json(transformedResult);
          } catch (error) {
            console.error('HuggingFace AI detection error:', error);
            throw new Error(`HuggingFace AI detection failed: ${error.message}`);
          }
          break;
          
        default:
          throw new Error(`Unsupported API provider: ${provider}`);
      }

    try {
    // Prepare headers - Google API uses X-goog-api-key header
    const headers = { 'Content-Type': 'application/json' };
    if (provider === 'google') {
      headers['X-goog-api-key'] = apiKeys.google;
    }

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000), // 30秒超时
      });
    } catch (fetchError) {
      // 处理网络连接错误（如ECONNRESET、ETIMEDOUT等）
      console.error(`🌐 Network error for ${provider}:`, fetchError.message);
      console.error(`🔗 Connection failed to: ${url}`);
      
      // 标记API为不健康
      updateApiHealth(provider, false, `Network error: ${fetchError.message}`);
      
      // 尝试切换到备用提供商
      const fallbackProvider = selectApiProvider();
      if (fallbackProvider !== provider) {
        console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to network error`);
        // 这里可以重新执行请求逻辑，但为了避免复杂性，我们只记录日志
        // 在生产环境中，可能需要更复杂的重试机制
      }
      
      throw new Error(`Network connection failed: ${fetchError.message}`);
    }

    // 更新API健康状态
    updateApiHealth(provider, response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      console.error('Request URL:', url);
      
      // 标记API为不健康
      updateApiHealth(provider, false, errorData.error?.message || `HTTP ${response.status}`);
      
      // 尝试切换到备用提供商
      const fallbackProvider = selectApiProvider();
      if (fallbackProvider !== provider) {
        console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to API error`);
        // 这里可以重新执行请求逻辑，但为了避免复杂性，我们只记录日志
        // 在生产环境中，可能需要更复杂的重试机制
      }
      
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      // 标记API为不健康
      updateApiHealth(provider, false, 'No response from model');
      return res.status(500).json({ error: 'No response from model' });
    }

    // Extract JSON from potential markdown code block
    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    jsonString = jsonString.trim();

    try {
      const jsonData = JSON.parse(jsonString);
      res.json(jsonData);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response text:', text);
      // 标记API为不健康
      updateApiHealth(provider, false, 'Invalid JSON response from model');
      res.status(500).json({ 
        error: 'Invalid JSON response from model',
        rawText: text 
      });
    }
  } catch (error) {
    // 标记API为不健康
    updateApiHealth(provider, false, error.message);
    throw error;
  }
  } catch (error) {
    console.error('Analyze image error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Modify Image endpoint
app.post('/api/modify-image', async (req, res) => {
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

    // Multi-API provider support
    const apiKeys = getApiKeys();
    const provider = selectApiProvider();
    
    let url, requestBody;
    
    switch (provider) {
      case 'google':
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
        requestBody = {
          contents: [{
            parts: parts
          }]
        };
        break;
        
      case 'baidu':
        url = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';
        requestBody = {
          messages: [
            {
              role: 'user',
              content: parts.map(part => {
                if (part.text) return { type: 'text', text: part.text };
                if (part.inlineData) return { type: 'image_url', image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } };
                return null;
              }).filter(Boolean)
            }
          ],
          stream: false
        };
        break;
        
      case 'huggingface':
        // HuggingFace API endpoint for image editing
        try {
          const apiKeys = getApiKeys();
          const result = await editImage(base64, prompt, apiKeys.huggingface);
          
          // Transform HuggingFace response to match expected format
          if (result.generated_image) {
            return res.json({ imageData: result.generated_image });
          } else {
            throw new Error('No image generated by HuggingFace model');
          }
        } catch (error) {
          console.error('HuggingFace image editing error:', error);
          throw new Error(`HuggingFace image editing failed: ${error.message}`);
        }
        break;
        
      default:
        throw new Error(`Image modification not supported for provider: ${provider}`);
    }

    try {
    // Prepare headers - Google API uses X-goog-api-key header
    const headers = { 'Content-Type': 'application/json' };
    if (provider === 'google') {
      headers['X-goog-api-key'] = apiKeys.google;
    }

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000), // 30秒超时
      });
    } catch (fetchError) {
      // 处理网络连接错误（如ECONNRESET、ETIMEDOUT等）
      console.error(`🌐 Network error for ${provider}:`, fetchError.message);
      console.error(`🔗 Connection failed to: ${url}`);
      
      // 标记API为不健康
      updateApiHealth(provider, false, `Network error: ${fetchError.message}`);
      
      // 尝试切换到备用提供商
      const fallbackProvider = selectApiProvider();
      if (fallbackProvider !== provider) {
        console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to network error`);
        // 这里可以重新执行请求逻辑，但为了避免复杂性，我们只记录日志
        // 在生产环境中，可能需要更复杂的重试机制
      }
      
      throw new Error(`Network connection failed: ${fetchError.message}`);
    }

    // 更新API健康状态
    updateApiHealth(provider, response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      
      // 检测API密钥泄露
      if (detectApiKeyLeak(errorMessage)) {
        console.error(`🚨 CRITICAL: API key leak detected for ${provider}!`);
        console.error(`🔒 Security Alert: ${provider} API key may have been compromised`);
        console.error(`💡 Recommendation: Immediately rotate the ${provider} API key`);
        
        // 标记API为不健康并记录泄露
        updateApiHealth(provider, false, errorMessage);
        
        // 尝试切换到备用提供商
        const fallbackProvider = selectApiProvider();
        if (fallbackProvider !== provider) {
          console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to API key leak`);
        }
        
        return res.status(401).json({ 
          error: 'API key security issue detected',
          details: 'The API key may have been compromised. Please contact support or rotate your API key.',
          securityAlert: true,
          provider: provider,
          recommendation: 'Rotate your API key immediately'
        });
      }
      
      // 标记API为不健康
      updateApiHealth(provider, false, errorMessage);
      
      // Special handling for quota exceeded errors
       if (response.status === 429 || 
           (errorData.error && errorData.error.message && 
            (errorData.error.message.includes('Quota exceeded') || 
             errorData.error.message.includes('quota') ||
             errorData.error.message.includes('Limit')))) {
         console.error('Quota exceeded error:', JSON.stringify(errorData, null, 2));
         
         // 尝试切换到备用提供商
         const fallbackProvider = selectApiProvider();
         if (fallbackProvider !== provider) {
           console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to quota exceeded`);
         }
         
         return res.status(429).json({ 
           error: 'You exceeded your current quota, please check your plan and billing details.',
           details: 'Visit https://ai.google.dev/gemini-api/docs/rate-limits to learn more about rate limits. Retry after some time or consider upgrading your plan.',
           quotaExceeded: true,
           quotaInfo: {
             metrics: errorData.error?.message || 'Rate limit exceeded',
             retryAfter: '3.5 seconds or more'
           },
           response: errorData
         });
       }
      
      // 尝试切换到备用提供商
      const fallbackProvider = selectApiProvider();
      if (fallbackProvider !== provider) {
        console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to API error`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Enhanced validation for response structure with more detailed checks
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const firstCandidate = data.candidates[0];
      
      // Check if candidate was blocked or had safety issues
      if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
        console.error('Candidate finish reason:', firstCandidate.finishReason);
        console.error('Full response data:', JSON.stringify(data, null, 2));
        // 标记API为不健康
        updateApiHealth(provider, false, `Generation stopped with reason: ${firstCandidate.finishReason}`);
        return res.status(500).json({ 
          error: `Generation stopped with reason: ${firstCandidate.finishReason}`,
          details: 'The AI model stopped generation due to content policies or other reasons.',
          response: data
        });
      }
      
      if (firstCandidate.content && firstCandidate.content.parts && Array.isArray(firstCandidate.content.parts)) {
        const responseParts = firstCandidate.content.parts;
        
        // Iterate through parts to find image data
        for (const part of responseParts) {
          if (part.inlineData && part.inlineData.data) {
            return res.json({ imageData: part.inlineData.data });
          }
        }
      }
    }

    // Log detailed error information for debugging
    console.error('No image data in response:', JSON.stringify(data, null, 2));
    // 标记API为不健康
    updateApiHealth(provider, false, 'No image generated in response');
    res.status(500).json({ 
      error: 'No image generated in response',
      details: 'The AI model did not return any image data. This could be due to the prompt, image, or model limitations.',
      response: data
    });
  } catch (error) {
    // 标记API为不健康
    updateApiHealth(provider, false, error.message);
    throw error;
  }
  } catch (error) {
    console.error('Modify image error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to modify image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Translate Image Text endpoint
app.post('/api/translate-image-text', async (req, res) => {
  try {
    const { base64, mimeType, targetLang } = req.body;

    if (!base64 || !mimeType || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Multi-API provider support
    const apiKeys = getApiKeys();
    const provider = selectApiProvider();
    
    let url, requestBody;
    
    switch (provider) {
      case 'google':
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
        requestBody = {
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096
          }
        };
        break;
        
      case 'baidu':
        url = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';
        requestBody = {
          messages: [
            {
              role: 'user',
              content: parts.map(part => {
                if (part.text) return { type: 'text', text: part.text };
                if (part.inlineData) return { type: 'image_url', image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` } };
                return null;
              }).filter(Boolean)
            }
          ],
          stream: false
        };
        break;
        
      case 'huggingface':
        // HuggingFace API endpoint for visual translation
        try {
          const apiKeys = getApiKeys();
          const result = await translateImageText(base64, targetLang, apiKeys.huggingface);
          
          // Transform HuggingFace response to match expected format
          const transformedResult = {
            detected_language: 'auto',
            original_text: result.text || '',
            translated_text: result.translated_text || result.text || '',
            blocks: [{
              original: result.text || '',
              translated: result.translated_text || result.text || '',
              box_2d: [0, 0, 1000, 1000]
            }]
          };
          
          return res.json(transformedResult);
        } catch (error) {
          console.error('HuggingFace visual translation error:', error);
          throw new Error(`HuggingFace visual translation failed: ${error.message}`);
        }
        break;
        
      default:
        throw new Error(`Image text translation not supported for provider: ${provider}`);
    }
    
    try {
    // Prepare headers - Google API uses X-goog-api-key header
    const headers = { 'Content-Type': 'application/json' };
    if (provider === 'google') {
      headers['X-goog-api-key'] = apiKeys.google;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000), // 30秒超时
    });

    // 更新API健康状态
    updateApiHealth(provider, response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      
      // 检测API密钥泄露
      if (detectApiKeyLeak(errorMessage)) {
        console.error(`🚨 CRITICAL: API key leak detected for ${provider}!`);
        console.error(`🔒 Security Alert: ${provider} API key may have been compromised`);
        console.error(`💡 Recommendation: Immediately rotate the ${provider} API key`);
        
        // 标记API为不健康并记录泄露
        updateApiHealth(provider, false, errorMessage);
        
        // 尝试切换到备用提供商
        const fallbackProvider = selectApiProvider();
        if (fallbackProvider !== provider) {
          console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to API key leak`);
        }
        
        return res.status(401).json({ 
          error: 'API key security issue detected',
          details: 'The API key may have been compromised. Please contact support or rotate your API key.',
          securityAlert: true,
          provider: provider,
          recommendation: 'Rotate your API key immediately'
        });
      }
      
      // 标记API为不健康
      updateApiHealth(provider, false, errorMessage);
      
      // 尝试切换到备用提供商
      const fallbackProvider = selectApiProvider();
      if (fallbackProvider !== provider) {
        console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to API error`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      // 标记API为不健康
      updateApiHealth(provider, false, 'No response from model');
      return res.status(500).json({ error: 'No response from model' });
    }

    res.json(JSON.parse(text));
  } catch (error) {
    // 标记API为不健康
    updateApiHealth(provider, false, error.message);
    throw error;
  }
  } catch (error) {
    console.error('Translate image text error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to translate image text',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Detect Text and Translate endpoint
app.post('/api/detect-text-translate', async (req, res) => {
  try {
    const { base64, mimeType, targetLang } = req.body;

    if (!base64 || !mimeType || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Multi-API provider support
    const apiKeys = getApiKeys();
    const provider = selectApiProvider();
    
    let url, requestBody;
    
    switch (provider) {
      case 'google':
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
        requestBody = {
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: `Detect all visible text in this image. Translate each text block to ${targetLang}.
       Return the original text, translated text, and the 2D bounding box [ymin, xmin, ymax, xmax] (0-1000 scale) for each block.
       IMPORTANT: Return ONLY a valid JSON object with these exact keys: detected_language, original_text, translated_text, and blocks. The blocks array should contain objects with original, translated, and box_2d properties. Do NOT include any text before or after the JSON.` }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096
          }
        };
        break;
        
      case 'baidu':
        url = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';
        requestBody = {
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
                { type: 'text', text: `Detect all visible text in this image. Translate each text block to ${targetLang}. Return the original text, translated text, and the 2D bounding box [ymin, xmin, ymax, xmax] (0-1000 scale) for each block.` }
              ]
            }
          ],
          stream: false
        };
        break;
        
      case 'huggingface':
        // HuggingFace API endpoint for text detection and translation
        try {
          const apiKeys = getApiKeys();
          const result = await translateImageText(base64, targetLang, apiKeys.huggingface);
          
          // Transform HuggingFace response to match expected format
          const transformedResult = {
            detected_language: 'auto',
            original_text: result.text || '',
            translated_text: result.translated_text || result.text || '',
            blocks: [{
              original: result.text || '',
              translated: result.translated_text || result.text || '',
              box_2d: [0, 0, 1000, 1000]
            }]
          };
          
          return res.json(transformedResult);
        } catch (error) {
          console.error('HuggingFace text detection error:', error);
          throw new Error(`HuggingFace text detection failed: ${error.message}`);
        }
        break;
        
      default:
        throw new Error(`Text detection and translation not supported for provider: ${provider}`);
    }
    
    try {
    // Prepare headers - Google API uses X-goog-api-key header
    const headers = { 'Content-Type': 'application/json' };
    if (provider === 'google') {
      headers['X-goog-api-key'] = apiKeys.google;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    // 更新API健康状态
    updateApiHealth(provider, response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      
      // 检测API密钥泄露
      if (detectApiKeyLeak(errorMessage)) {
        console.error(`🚨 CRITICAL: API key leak detected for ${provider}!`);
        console.error(`🔒 Security Alert: ${provider} API key may have been compromised`);
        console.error(`💡 Recommendation: Immediately rotate the ${provider} API key`);
        
        // 标记API为不健康并记录泄露
        updateApiHealth(provider, false, errorMessage);
        
        // 尝试切换到备用提供商
        const fallbackProvider = selectApiProvider();
        if (fallbackProvider !== provider) {
          console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to API key leak`);
        }
        
        return res.status(401).json({ 
          error: 'API key security issue detected',
          details: 'The API key may have been compromised. Please contact support or rotate your API key.',
          securityAlert: true,
          provider: provider,
          recommendation: 'Rotate your API key immediately'
        });
      }
      
      // 标记API为不健康
      updateApiHealth(provider, false, errorMessage);
      
      // 尝试切换到备用提供商
      const fallbackProvider = selectApiProvider();
      if (fallbackProvider !== provider) {
        console.log(`🔄 Switching from ${provider} to ${fallbackProvider} due to API error`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      // 标记API为不健康
      updateApiHealth(provider, false, 'No response from translation service');
      return res.status(500).json({ error: 'No response from translation service' });
    }

    res.json(JSON.parse(text));
  } catch (error) {
    // 标记API为不健康
    updateApiHealth(provider, false, error.message);
    throw error;
  }
  } catch (error) {
    console.error('Detect text translate error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to detect and translate text',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 重置API健康状态端点
app.post('/api/reset-health-status', async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({ error: 'Provider parameter is required' });
    }
    
    if (!apiHealthStatus[provider]) {
      return res.status(404).json({ error: `Provider '${provider}' not found` });
    }
    
    // 重置健康状态
    apiHealthStatus[provider] = { 
      healthy: true, 
      lastCheck: Date.now(), 
      errorCount: 0,
      leaked: false,
      leakDetectedAt: null
    };
    
    console.log(`✅ Reset health status for ${provider}`);
    res.json({ 
      success: true, 
      message: `Health status reset for ${provider}`,
      status: apiHealthStatus[provider]
    });
  } catch (error) {
    console.error('Reset health status error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to reset health status',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 更新API密钥端点
app.post('/api/update-api-key', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and apiKey parameters are required' });
    }
    
    // 读取当前.env文件
    const envPath = join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 更新特定的API密钥
    const keyPattern = new RegExp(`(${provider.toUpperCase()}_API_KEY=).*`, 'g');
    if (envContent.match(keyPattern)) {
      envContent = envContent.replace(keyPattern, `$1${apiKey}`);
      
      // 写回.env文件
      fs.writeFileSync(envPath, envContent);
      
      // 重新加载环境变量
      dotenv.config({ path: envPath });
      
      // 重置此提供商的健康状态
      apiHealthStatus[provider] = {
        healthy: true,
        lastCheck: Date.now(),
        errorCount: 0,
        leaked: false,
        leakDetectedAt: null
      };
      
      console.log(`✅ Updated ${provider} API key and reset health status`);
      res.json({ 
        success: true, 
        message: `Successfully updated ${provider} API key`,
        provider: provider
      });
    } else {
      res.status(404).json({ error: `API key configuration for ${provider} not found` });
    }
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update API key',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 定期API健康检查
const startApiHealthChecks = async () => {
  try {
    const apiKeys = getApiKeys();
    const availableProviders = Object.entries(apiKeys).filter(([_, key]) => key).map(([name]) => name);
    
    // 对每个可用的提供商进行健康检查
    for (const provider of availableProviders) {
      if (apiKeys[provider]) {
        try {
          const isHealthy = await checkApiHealth(provider, apiKeys[provider]);
          updateApiHealth(provider, isHealthy);
          if (isHealthy) {
            console.log(`✅ Health check passed for ${provider}`);
          } else {
            console.log(`❌ Health check failed for ${provider}`);
          }
        } catch (error) {
          console.error(`Error during health check for ${provider}:`, error.message);
          updateApiHealth(provider, false, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error during API health checks:', error.message);
  }
};

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Check available API keys
  try {
    const apiKeys = getApiKeys();
    const availableProviders = Object.entries(apiKeys).filter(([_, key]) => key).map(([name]) => name);
    console.log(`✅ Available API providers: ${availableProviders.join(', ')}`);
    console.log(`🔑 Active provider: ${selectApiProvider()}`);
    
    // 启动定期健康检查（每5分钟检查一次）
    setInterval(startApiHealthChecks, 5 * 60 * 1000); // 5分钟
    // 立即执行一次健康检查
    startApiHealthChecks();
  } catch (error) {
    console.error('⚠️ API Key Warning:', error.message);
  }
});

export default app;