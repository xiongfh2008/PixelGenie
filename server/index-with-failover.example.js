/**
 * 集成智能故障转移系统的示例
 * 展示如何将故障转移应用到现有端点
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 导入故障转移系统
import { executeWithFailover } from './smart-failover.js';
import {
  buildAnalyzeImageRequest,
  parseAnalyzeImageResponse,
  buildModifyImageRequest,
  parseModifyImageResponse
} from './api-caller.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ... 其他配置代码 (getApiKeys, selectApiProvider, updateApiHealth 等)

/**
 * 图像分析端点 - 带智能故障转移
 */
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;

    // 验证输入
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
    parts.push({ text: `分析这些图像...` }); // 完整提示词

    // 定义 API 调用函数
    const apiCallFunction = async (provider, params) => {
      console.log(`📡 Calling ${provider} API for image analysis`);
      
      const apiKeys = getApiKeys();
      const { url, requestBody, headers } = buildAnalyzeImageRequest(
        provider,
        params,
        apiKeys
      );

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return parseAnalyzeImageResponse(data, provider);
    };

    // 执行带故障转移的调用
    console.log('🚀 Starting request with automatic failover');
    const result = await executeWithFailover(
      apiCallFunction,
      { parts },
      'imageAnalysis',  // 所需能力
      selectApiProvider,
      updateApiHealth,
      3  // 最多尝试 3 个不同的提供商
    );

    console.log(`✅ Request completed successfully using ${result.provider} (${result.attempts} attempts)`);

    // 返回结果（不暴露内部切换细节）
    res.json(result.data);

  } catch (error) {
    console.error('❌ All providers failed:', error.message);
    res.status(500).json({
      error: 'Image analysis failed',
      message: 'Unable to process your request at this time. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 图像修改端点 - 带智能故障转移
 */
app.post('/api/modify-image', async (req, res) => {
  try {
    const { base64, mimeType, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 准备请求数据
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

    // 定义 API 调用函数
    const apiCallFunction = async (provider, params) => {
      console.log(`📡 Calling ${provider} API for image modification`);
      
      const apiKeys = getApiKeys();
      const { url, requestBody, headers } = buildModifyImageRequest(
        provider,
        params,
        apiKeys
      );

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return parseModifyImageResponse(data, provider);
    };

    // 执行带故障转移的调用
    console.log('🚀 Starting image modification with automatic failover');
    const result = await executeWithFailover(
      apiCallFunction,
      { parts },
      'imageModification',  // 所需能力（只有 Google 支持）
      selectApiProvider,
      updateApiHealth,
      3
    );

    console.log(`✅ Image modification completed using ${result.provider}`);

    // 返回结果
    res.json(result.data);

  } catch (error) {
    console.error('❌ Image modification failed:', error.message);
    res.status(500).json({
      error: 'Image modification failed',
      message: 'Unable to modify your image at this time. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 健康检查端点 - 显示所有 API 状态
 */
app.get('/api/health-detailed', (req, res) => {
  const apiKeys = getApiKeys();
  const availableProviders = Object.entries(apiKeys)
    .filter(([_, key]) => key)
    .map(([name]) => name);

  const healthReport = {};
  for (const provider of availableProviders) {
    const status = apiHealthStatus[provider] || { healthy: true, errorCount: 0 };
    healthReport[provider] = {
      healthy: status.healthy,
      errorCount: status.errorCount,
      lastCheck: new Date(status.lastCheck).toISOString(),
      leaked: status.leaked || false
    };
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: healthReport,
    totalProviders: availableProviders.length,
    healthyProviders: Object.values(healthReport).filter(s => s.healthy).length
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server with smart failover running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health-detailed`);
});

export default app;

