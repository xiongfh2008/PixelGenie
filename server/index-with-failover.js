/**
 * PixelGenie AI Server with Intelligent Failover
 * 带智能故障转移的服务器实现示例
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { callWithFailover, parseApiResponse } from './api-failover.js';
import { selectApiProvider, updateApiHealth } from './api-health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 获取 API 密钥
function getApiKeys() {
  return {
    google: process.env.GOOGLE_API_KEY,
    cloudflare: process.env.CLOUDFLARE_API_TOKEN,
    huggingface: process.env.HUGGINGFACE_API_KEY,
    xunfei: process.env.XUNFEI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
  };
}

/**
 * 图像分析 API 调用函数（支持自动故障转移）
 */
async function analyzeImageWithProvider(provider, params) {
  const { parts, apiKeys } = params;
  
  let url, requestBody, headers;
  
  // 根据提供商构建请求
  switch (provider) {
    case 'google':
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
      headers = {
        'X-goog-api-key': apiKeys.google,
        'Content-Type': 'application/json'
      };
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
      headers = {
        'Authorization': `Bearer ${apiKeys.cloudflare}`,
        'Content-Type': 'application/json'
      };
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
      throw new Error(`Unsupported provider: ${provider}`);
  }
  
  // 发送请求
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
  
  const data = await response.json();
  
  // 解析响应
  const parsed = parseApiResponse(provider, data);
  
  if (!parsed.text) {
    throw new Error('No response from model');
  }
  
  return parsed.text;
}

/**
 * 图像修改 API 调用函数（支持自动故障转移）
 */
async function modifyImageWithProvider(provider, params) {
  const { parts, apiKeys } = params;
  
  // 只有 Google 支持图像修改
  if (provider !== 'google') {
    throw new Error(`Image modification not supported for provider: ${provider}`);
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
  const headers = {
    'X-goog-api-key': apiKeys.google,
    'Content-Type': 'application/json'
  };
  const requestBody = {
    contents: [{ parts }]
  };
  
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
  
  const data = await response.json();
  
  // 检查响应
  if (data.candidates && data.candidates[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
  }
  
  throw new Error('No image generated in response');
}

// ============================================================================
// API 端点
// ============================================================================

// 图像分析端点（带自动故障转移）
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;
    
    if (!originalBase64 || !elaBase64) {
      return res.status(400).json({ error: 'Missing required image data' });
    }
    
    // 构建请求参数
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
    parts.push({
      text: `You are a Lead Digital Forensic Analyst. Analyze this image for AI generation and manipulation. Return ONLY valid JSON with keys: description, tags, objects, sentiment, colors, integrity. The integrity object must contain: is_suspected_fake, confidence_score, reasoning, methods_analyzed, ai_generated_probability, ai_analysis. Output in ${targetLang}.`
    });
    
    const apiKeys = getApiKeys();
    
    // 使用故障转移机制调用 API
    const result = await callWithFailover(
      analyzeImageWithProvider,
      'imageAnalysis',
      { parts, apiKeys },
      3 // 最多尝试 3 次
    );
    
    // 解析 JSON 响应
    let jsonString = result.data.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    
    const jsonData = JSON.parse(jsonString.trim());
    
    // 添加元数据
    jsonData._meta = {
      provider: result.provider,
      attempts: result.attempts,
      timestamp: new Date().toISOString()
    };
    
    res.json(jsonData);
    
  } catch (error) {
    console.error('Analyze image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 图像修改端点（带自动故障转移）
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
    
    const apiKeys = getApiKeys();
    
    // 使用故障转移机制调用 API
    const result = await callWithFailover(
      modifyImageWithProvider,
      'imageModification',
      { parts, apiKeys },
      3 // 最多尝试 3 次
    );
    
    res.json({
      imageData: result.data,
      _meta: {
        provider: result.provider,
        attempts: result.attempts,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Modify image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to modify image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running with intelligent failover'
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✨ Intelligent API failover enabled`);
});

export default app;

