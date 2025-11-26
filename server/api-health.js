/**
 * API 健康状态管理系统
 * 跟踪和管理所有 API 提供商的健康状态
 */

// API 健康状态跟踪
export let apiHealthStatus = {
  huggingface: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  xunfei: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  deepseek: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  google: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  baidu: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  tencent: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  alibaba: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  cloudflare: { healthy: true, lastCheck: Date.now(), errorCount: 0 }
};

// 定义不同功能支持的提供商
const capabilitySupport = {
  imageModification: ['google'], // 只有 Google Gemini 支持真正的图像生成/修改
  imageAnalysis: ['google', 'xunfei', 'cloudflare', 'huggingface', 'deepseek', 'baidu', 'tencent', 'alibaba'],
  textTranslation: ['google', 'cloudflare', 'huggingface', 'baidu']
};

// 定义主备优先级组
const primaryProviders = ['google', 'xunfei'];
const backupProviders = ['cloudflare', 'huggingface', 'deepseek'];
const fallbackProviders = ['baidu', 'tencent', 'alibaba'];

/**
 * 检测 API 密钥泄露错误
 * @param {string} errorMessage - 错误信息
 * @returns {boolean} 是否检测到泄露
 */
export function detectApiKeyLeak(errorMessage) {
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
}

/**
 * 更新 API 健康状态
 * @param {string} provider - 提供商名称
 * @param {boolean} isHealthy - 是否健康
 * @param {string} error - 错误信息（可选）
 */
export function updateApiHealth(provider, isHealthy, error = null) {
  if (!apiHealthStatus[provider]) {
    apiHealthStatus[provider] = { healthy: true, lastCheck: Date.now(), errorCount: 0 };
  }
  
  const status = apiHealthStatus[provider];
  status.lastCheck = Date.now();
  
  if (isHealthy) {
    status.healthy = true;
    status.errorCount = 0;
    if (status.lastError) {
      console.log(`✅ Provider ${provider} recovered from errors`);
    }
    status.lastError = null;
  } else {
    status.errorCount += 1;
    status.lastError = error;
    
    // 检测 API 密钥泄露
    if (error && detectApiKeyLeak(error)) {
      console.error(`🚨 CRITICAL: API key leak detected for ${provider}!`);
      console.error(`🔒 Security Alert: ${provider} API key may have been compromised`);
      console.error(`💡 Recommendation: Immediately rotate the ${provider} API key`);
      
      status.leaked = true;
      status.leakDetectedAt = Date.now();
      status.healthy = false;
    }
    
    // 如果错误次数超过阈值，标记为不健康
    if (status.errorCount >= 3) {
      status.healthy = false;
      console.warn(`⚠️  Provider ${provider} marked as unhealthy after ${status.errorCount} errors`);
    }
    
    if (error) {
      console.error(`❌ API Error for ${provider}:`, error);
    }
  }
}

/**
 * 智能 API 提供商选择 - 支持自动故障转移
 * @param {string} requiredCapability - 所需能力（可选）
 * @param {Set} excludeProviders - 要排除的提供商（已尝试过的）
 * @returns {string|null} 选中的提供商名称
 */
export function selectApiProvider(requiredCapability = null, excludeProviders = new Set()) {
  // 获取支持所需能力的提供商列表
  let eligibleProviders = [];
  
  if (requiredCapability && capabilitySupport[requiredCapability]) {
    eligibleProviders = capabilitySupport[requiredCapability];
  } else {
    // 如果没有指定能力，使用所有提供商
    eligibleProviders = Object.keys(apiHealthStatus);
  }
  
  // 过滤掉已排除的提供商
  eligibleProviders = eligibleProviders.filter(p => !excludeProviders.has(p));
  
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
  
  const safeEligibleProviders = filterLeakedProviders(eligibleProviders);
  
  // 按优先级分组
  const safePrimaryProviders = primaryProviders.filter(p => safeEligibleProviders.includes(p));
  const safeBackupProviders = backupProviders.filter(p => safeEligibleProviders.includes(p));
  const safeFallbackProviders = fallbackProviders.filter(p => safeEligibleProviders.includes(p));
  
  // 首先检查主用提供商
  for (const provider of safePrimaryProviders) {
    if (apiHealthStatus[provider]?.healthy) {
      console.log(`🔑 Selected provider (primary): ${provider}${requiredCapability ? ` [${requiredCapability}]` : ''}`);
      return provider;
    }
  }
  
  // 然后检查备用提供商
  for (const provider of safeBackupProviders) {
    if (apiHealthStatus[provider]?.healthy) {
      console.log(`🔑 Selected provider (backup): ${provider}${requiredCapability ? ` [${requiredCapability}]` : ''}`);
      return provider;
    }
  }
  
  // 最后使用降级提供商
  for (const provider of safeFallbackProviders) {
    if (apiHealthStatus[provider]?.healthy) {
      console.log(`🔑 Selected provider (fallback): ${provider}${requiredCapability ? ` [${requiredCapability}]` : ''}`);
      return provider;
    }
  }
  
  // 如果所有健康的提供商都用完了，尝试使用不健康但可用的提供商
  console.warn(`⚠️  No healthy providers available, trying unhealthy ones...`);
  
  for (const provider of safeEligibleProviders) {
    if (!apiHealthStatus[provider]?.leaked) {
      console.warn(`⚠️  Using unhealthy provider: ${provider}`);
      return provider;
    }
  }
  
  // 真的没有可用的了
  console.error(`❌ No available providers for ${requiredCapability || 'any capability'}`);
  console.error(`   Eligible: ${eligibleProviders.join(', ')}`);
  console.error(`   Excluded: ${Array.from(excludeProviders).join(', ')}`);
  
  return null;
}

/**
 * 获取 API 健康状态报告
 * @returns {Object} 健康状态报告
 */
export function getHealthReport() {
  const report = {
    timestamp: new Date().toISOString(),
    providers: {}
  };
  
  for (const [provider, status] of Object.entries(apiHealthStatus)) {
    report.providers[provider] = {
      healthy: status.healthy,
      errorCount: status.errorCount,
      leaked: status.leaked || false,
      lastCheck: new Date(status.lastCheck).toISOString(),
      lastError: status.lastError || null
    };
  }
  
  return report;
}

/**
 * 重置提供商的健康状态
 * @param {string} provider - 提供商名称
 */
export function resetProviderHealth(provider) {
  if (apiHealthStatus[provider]) {
    apiHealthStatus[provider] = {
      healthy: true,
      lastCheck: Date.now(),
      errorCount: 0,
      leaked: false,
      leakDetectedAt: null,
      lastError: null
    };
    console.log(`✅ Reset health status for ${provider}`);
  }
}

export default {
  apiHealthStatus,
  detectApiKeyLeak,
  updateApiHealth,
  selectApiProvider,
  getHealthReport,
  resetProviderHealth
};
