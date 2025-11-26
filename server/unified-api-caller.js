/**
 * 统一的 API 调用器
 * 支持自动故障转移和重试机制
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// API 健康状态（从 index.js 导入或共享）
let apiHealthStatus = {
  huggingface: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  xunfei: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  deepseek: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  google: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  baidu: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  tencent: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  alibaba: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  cloudflare: { healthy: true, lastCheck: Date.now(), errorCount: 0 }
};

/**
 * 统一的 API 调用函数，支持自动故障转移
 * @param {Object} params - 调用参数
 * @param {string} params.capability - 所需能力
 * @param {Object} params.requestData - 请求数据
 * @param {Function} params.responseParser - 响应解析函数
 * @param {Array} params.excludeProviders - 排除的提供商
 * @returns {Promise<Object>} API 响应
 */
export async function callApiWithFailover({
  capability,
  requestData,
  responseParser,
  excludeProviders = []
}) {
  const providers = getAvailableProviders(capability, excludeProviders);
  const attemptedProviders = [];
  let lastError = null;

  console.log(`🔄 Starting API call with failover`);
  console.log(`   Capability: ${capability}`);
  console.log(`   Available providers: ${providers.join(' → ')}`);

  for (const provider of providers) {
    // 跳过不健康或泄露的提供商
    if (!isProviderHealthy(provider)) {
      console.log(`⏭️  Skipping unhealthy provider: ${provider}`);
      continue;
    }

    attemptedProviders.push(provider);
    console.log(`🎯 Trying provider ${attemptedProviders.length}/${providers.length}: ${provider}`);

    try {
      // 构建请求配置
      const { url, headers, body } = buildRequest(provider, requestData);
      
      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      });

      // 更新健康状态
      updateApiHealth(provider, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        
        // 检测密钥泄露
        if (detectApiKeyLeak(errorMessage)) {
          console.error(`🚨 API key leak detected for ${provider}!`);
          updateApiHealth(provider, false, errorMessage);
          continue; // 跳到下一个提供商
        }
        
        throw new Error(errorMessage);
      }

      // 解析响应
      const data = await response.json();
      const parsedResult = responseParser ? responseParser(data, provider) : data;

      // 成功！
      console.log(`✅ Success with provider: ${provider}`);
      
      if (attemptedProviders.length > 1) {
        console.log(`🔄 Failover successful: ${attemptedProviders[0]} → ${provider}`);
      }

      return {
        success: true,
        data: parsedResult,
        provider,
        attemptedProviders,
        failoverOccurred: attemptedProviders.length > 1
      };

    } catch (error) {
      lastError = error;
      console.error(`❌ Provider ${provider} failed: ${error.message}`);
      
      // 更新健康状态
      updateApiHealth(provider, false, error.message);

      // 如果不是最后一个提供商，继续尝试
      if (provider !== providers[providers.length - 1]) {
        console.log(`🔄 Switching to next provider...`);
        await sleep(500); // 短暂延迟
      }
    }
  }

  // 所有提供商都失败了
  console.error(`💥 All providers failed`);
  console.error(`   Attempted: ${attemptedProviders.join(' → ')}`);
  
  throw new Error(lastError?.message || 'All API providers failed');
}

/**
 * 获取可用的提供商列表
 */
function getAvailableProviders(capability, excludeProviders = []) {
  const capabilitySupport = {
    imageModification: ['google'],
    imageAnalysis: ['google', 'xunfei', 'cloudflare', 'huggingface', 'deepseek'],
    textTranslation: ['google', 'cloudflare', 'huggingface']
  };

  const primaryProviders = ['google', 'xunfei'];
  const backupProviders = ['cloudflare', 'huggingface', 'deepseek'];
  const fallbackProviders = ['baidu', 'tencent', 'alibaba'];

  let allProviders = [...primaryProviders, ...backupProviders, ...fallbackProviders];

  if (capability && capabilitySupport[capability]) {
    allProviders = allProviders.filter(p => capabilitySupport[capability].includes(p));
  }

  return allProviders.filter(p => !excludeProviders.includes(p));
}

/**
 * 检查提供商是否健康
 */
function isProviderHealthy(provider) {
  const status = apiHealthStatus[provider];
  if (!status) return true;
  
  // 如果密钥泄露，标记为不健康
  if (status.leaked) {
    return false;
  }
  
  // 如果错误次数过多，标记为不健康
  if (status.errorCount > 3) {
    return false;
  }
  
  return status.healthy;
}

/**
 * 更新 API 健康状态
 */
function updateApiHealth(provider, isHealthy, error = null) {
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
    
    if (error && detectApiKeyLeak(error)) {
      status.leaked = true;
      status.leakDetectedAt = Date.now();
    }
  }
}

/**
 * 检测 API 密钥泄露
 */
function detectApiKeyLeak(errorMessage) {
  if (!errorMessage) return false;
  
  const leakIndicators = [
    'API key was reported as leaked',
    'key has been leaked',
    'compromised key',
    'revoked key'
  ];
  
  return leakIndicators.some(indicator => 
    errorMessage.toLowerCase().includes(indicator.toLowerCase())
  );
}

/**
 * 构建请求配置
 */
function buildRequest(provider, requestData) {
  const apiKeys = {
    google: process.env.GOOGLE_API_KEY,
    cloudflare: process.env.CLOUDFLARE_API_TOKEN,
    huggingface: process.env.HUGGINGFACE_API_KEY,
    xunfei: process.env.XUNFEI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY
  };

  let url, headers, body;

  switch (provider) {
    case 'google':
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
      headers = {
        'X-goog-api-key': apiKeys.google,
        'Content-Type': 'application/json'
      };
      body = requestData.google || requestData.default;
      break;

    case 'cloudflare':
      url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;
      headers = {
        'Authorization': `Bearer ${apiKeys.cloudflare}`,
        'Content-Type': 'application/json'
      };
      body = requestData.cloudflare || requestData.default;
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  return { url, headers, body };
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 导出健康状态（供其他模块使用）
 */
export function getApiHealthStatus() {
  return apiHealthStatus;
}

export function setApiHealthStatus(status) {
  apiHealthStatus = status;
}

export default {
  callApiWithFailover,
  getApiHealthStatus,
  setApiHealthStatus
};

