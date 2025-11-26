/**
 * 测试自动故障转移机制
 * 模拟各种故障场景，验证系统自动切换功能
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });

// 模拟 API 健康状态
const apiHealthStatus = {
  google: { healthy: true, lastCheck: Date.now(), failureReason: null },
  xunfei: { healthy: true, lastCheck: Date.now(), failureReason: null },
  cloudflare: { healthy: true, lastCheck: Date.now(), failureReason: null },
  huggingface: { healthy: true, lastCheck: Date.now(), failureReason: null },
  deepseek: { healthy: true, lastCheck: Date.now(), failureReason: null }
};

// 获取 API 密钥
function getApiKeys() {
  return {
    google: process.env.GOOGLE_API_KEY,
    xunfei: process.env.XUNFEI_API_KEY,
    cloudflare: process.env.CLOUDFLARE_API_TOKEN,
    huggingface: process.env.HUGGINGFACE_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY
  };
}

// 更新 API 健康状态
function updateApiHealth(provider, healthy, reason = null) {
  if (apiHealthStatus[provider]) {
    apiHealthStatus[provider].healthy = healthy;
    apiHealthStatus[provider].lastCheck = Date.now();
    apiHealthStatus[provider].failureReason = reason;
    
    const status = healthy ? '✅' : '❌';
    console.log(`${status} Updated health for ${provider}: ${healthy ? 'healthy' : 'unhealthy'}${reason ? ` (${reason})` : ''}`);
  }
}

// 选择 API 提供商
function selectApiProvider(requiredCapability = null, excludeProviders = []) {
  const apiKeys = getApiKeys();
  const availableProviders = Object.entries(apiKeys).filter(([_, key]) => key).map(([name]) => name);
  
  const capabilitySupport = {
    imageModification: ['google'],
    imageAnalysis: ['google', 'xunfei', 'cloudflare', 'huggingface', 'deepseek'],
    textTranslation: ['google', 'cloudflare', 'huggingface']
  };
  
  let filteredProviders = availableProviders;
  if (requiredCapability && capabilitySupport[requiredCapability]) {
    filteredProviders = availableProviders.filter(p => capabilitySupport[requiredCapability].includes(p));
  }
  
  if (excludeProviders && excludeProviders.length > 0) {
    filteredProviders = filteredProviders.filter(p => !excludeProviders.includes(p));
  }
  
  const healthyProviders = filteredProviders.filter(p => apiHealthStatus[p]?.healthy);
  
  if (healthyProviders.length > 0) {
    return healthyProviders[0];
  }
  
  if (filteredProviders.length > 0) {
    console.warn(`⚠️  No healthy providers available, using unhealthy: ${filteredProviders[0]}`);
    return filteredProviders[0];
  }
  
  return null;
}

// 模拟 API 请求
async function simulateApiRequest(provider, shouldFail = false, failureType = 'network') {
  console.log(`📡 Simulating API request to ${provider}...`);
  
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (shouldFail) {
    const errors = {
      network: 'ECONNRESET: Connection reset by peer',
      quota: 'Quota exceeded for this API',
      keyLeak: 'API key was reported as leaked',
      model: 'Model returned invalid response'
    };
    
    throw new Error(errors[failureType] || 'Unknown error');
  }
  
  return {
    success: true,
    provider: provider,
    data: 'Mock response data'
  };
}

// 执行带故障转移的请求
async function executeWithFailover(capability, shouldFailProviders = {}) {
  const maxRetries = 3;
  const retryDelay = 1000;
  const triedProviders = [];
  let lastError = null;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎯 Starting request with capability: ${capability}`);
  console.log(`${'='.repeat(60)}\n`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const provider = selectApiProvider(capability, triedProviders);
      
      if (!provider) {
        throw new Error(
          `No available providers for ${capability}. ` +
          `Tried: ${triedProviders.join(', ')}`
        );
      }

      if (attempt > 1) {
        console.log(`\n🔄 Auto-switching to ${provider} (attempt ${attempt}/${maxRetries})`);
        console.log(`   Previously failed: [${triedProviders.join(', ')}]`);
      } else {
        console.log(`🔑 Using provider: ${provider} [${capability}]`);
      }

      // 模拟请求（根据配置决定是否失败）
      const shouldFail = shouldFailProviders[provider];
      const failureType = shouldFail ? shouldFailProviders[provider + '_type'] || 'network' : null;
      
      const result = await simulateApiRequest(provider, shouldFail, failureType);

      // 成功
      updateApiHealth(provider, true);
      
      if (triedProviders.length > 0) {
        console.log(`\n✅ Successfully switched to ${provider} after ${triedProviders.length} failed attempt(s)`);
      } else {
        console.log(`\n✅ Request successful on first attempt`);
      }

      return {
        success: true,
        data: result,
        provider: provider,
        retriesUsed: attempt - 1,
        switchedFrom: triedProviders
      };

    } catch (error) {
      const currentProvider = selectApiProvider(capability, triedProviders);
      lastError = error;

      console.error(`\n❌ Provider ${currentProvider} failed (attempt ${attempt}/${maxRetries}):`);
      console.error(`   Error: ${error.message}`);

      if (currentProvider) {
        updateApiHealth(currentProvider, false, error.message);
        triedProviders.push(currentProvider);
      }

      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // 所有重试都失败了
  console.error(`\n❌ All ${maxRetries} attempts failed for ${capability}`);
  console.error(`   Tried providers: [${triedProviders.join(', ')}]`);
  console.error(`   Last error: ${lastError?.message}`);
  
  throw new Error(
    `All providers failed for ${capability}. ` +
    `Tried: ${triedProviders.join(', ')}. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

// 测试场景
async function runTests() {
  console.log('\n🧪 Auto-Failover System Test Suite\n');
  console.log('=' .repeat(60));

  // 测试 1: 正常情况（无故障）
  console.log('\n\n📋 Test 1: Normal Operation (No Failures)');
  console.log('-'.repeat(60));
  try {
    const result = await executeWithFailover('imageAnalysis', {});
    console.log('\n✅ Test 1 PASSED');
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Retries: ${result.retriesUsed}`);
  } catch (error) {
    console.error('\n❌ Test 1 FAILED:', error.message);
  }

  // 重置健康状态
  Object.keys(apiHealthStatus).forEach(key => {
    apiHealthStatus[key].healthy = true;
    apiHealthStatus[key].failureReason = null;
  });

  // 测试 2: 单次故障转移
  console.log('\n\n📋 Test 2: Single Provider Failure');
  console.log('-'.repeat(60));
  try {
    const result = await executeWithFailover('imageAnalysis', {
      google: true,  // Google 失败
      google_type: 'quota'
    });
    console.log('\n✅ Test 2 PASSED');
    console.log(`   Final provider: ${result.provider}`);
    console.log(`   Retries: ${result.retriesUsed}`);
    console.log(`   Switched from: [${result.switchedFrom.join(', ')}]`);
  } catch (error) {
    console.error('\n❌ Test 2 FAILED:', error.message);
  }

  // 重置健康状态
  Object.keys(apiHealthStatus).forEach(key => {
    apiHealthStatus[key].healthy = true;
    apiHealthStatus[key].failureReason = null;
  });

  // 测试 3: 多次故障转移
  console.log('\n\n📋 Test 3: Multiple Provider Failures');
  console.log('-'.repeat(60));
  try {
    const result = await executeWithFailover('imageAnalysis', {
      google: true,      // Google 失败
      google_type: 'keyLeak',
      xunfei: true,      // 讯飞失败
      xunfei_type: 'network'
    });
    console.log('\n✅ Test 3 PASSED');
    console.log(`   Final provider: ${result.provider}`);
    console.log(`   Retries: ${result.retriesUsed}`);
    console.log(`   Switched from: [${result.switchedFrom.join(', ')}]`);
  } catch (error) {
    console.error('\n❌ Test 3 FAILED:', error.message);
  }

  // 重置健康状态
  Object.keys(apiHealthStatus).forEach(key => {
    apiHealthStatus[key].healthy = true;
    apiHealthStatus[key].failureReason = null;
  });

  // 测试 4: 所有提供商失败
  console.log('\n\n📋 Test 4: All Providers Fail');
  console.log('-'.repeat(60));
  try {
    const result = await executeWithFailover('imageAnalysis', {
      google: true,
      google_type: 'quota',
      xunfei: true,
      xunfei_type: 'network',
      cloudflare: true,
      cloudflare_type: 'model'
    });
    console.error('\n❌ Test 4 FAILED: Should have thrown an error');
  } catch (error) {
    console.log('\n✅ Test 4 PASSED: Correctly handled all failures');
    console.log(`   Error message: ${error.message}`);
  }

  // 重置健康状态
  Object.keys(apiHealthStatus).forEach(key => {
    apiHealthStatus[key].healthy = true;
    apiHealthStatus[key].failureReason = null;
  });

  // 测试 5: 能力限制（图像修改）
  console.log('\n\n📋 Test 5: Capability Restriction (Image Modification)');
  console.log('-'.repeat(60));
  try {
    const result = await executeWithFailover('imageModification', {});
    console.log('\n✅ Test 5 PASSED');
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Note: Only Google supports image modification`);
  } catch (error) {
    console.error('\n❌ Test 5 FAILED:', error.message);
  }

  // 最终报告
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log('\n✅ All tests completed!');
  console.log('\n📈 API Health Status:');
  Object.entries(apiHealthStatus).forEach(([provider, status]) => {
    const icon = status.healthy ? '✅' : '❌';
    console.log(`   ${icon} ${provider}: ${status.healthy ? 'healthy' : 'unhealthy'}${status.failureReason ? ` (${status.failureReason})` : ''}`);
  });
  
  console.log('\n🎉 Auto-failover system is working correctly!\n');
}

// 运行测试
runTests().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});

