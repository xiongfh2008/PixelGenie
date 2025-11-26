/**
 * 智能重试机制演示脚本
 * 展示如何使用 simple-retry-wrapper.js
 */

import executeWithSmartRetry from './simple-retry-wrapper.js';

// 模拟 API 健康状态
const apiHealthStatus = {
  google: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  cloudflare: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  xunfei: { healthy: true, lastCheck: Date.now(), errorCount: 0 },
  huggingface: { healthy: true, lastCheck: Date.now(), errorCount: 0 }
};

// 模拟 API 密钥
const apiKeys = {
  google: 'mock-google-key',
  cloudflare: 'mock-cloudflare-key',
  xunfei: 'mock-xunfei-key',
  huggingface: 'mock-huggingface-key'
};

// 模拟提供商优先级
const providerPriority = ['google', 'cloudflare', 'xunfei', 'huggingface'];

// 选择 API 提供商函数
function selectApiProvider() {
  for (const provider of providerPriority) {
    if (apiKeys[provider] && apiHealthStatus[provider]?.healthy) {
      return provider;
    }
  }
  throw new Error('No available API providers');
}

// 更新健康状态函数
function updateApiHealth(provider, isHealthy, error = null) {
  if (!apiHealthStatus[provider]) {
    apiHealthStatus[provider] = { healthy: true, lastCheck: Date.now(), errorCount: 0 };
  }
  
  const status = apiHealthStatus[provider];
  status.lastCheck = Date.now();
  
  if (isHealthy) {
    status.healthy = true;
    status.errorCount = 0;
    console.log(`✅ ${provider} marked as healthy`);
  } else {
    status.healthy = false;
    status.errorCount += 1;
    console.log(`❌ ${provider} marked as unhealthy (error: ${error})`);
  }
}

// ============================================================================
// 演示 1: 正常场景（第一个 API 成功）
// ============================================================================

async function demo1_normalCase() {
  console.log('\n' + '='.repeat(60));
  console.log('演示 1: 正常场景（第一个 API 成功）');
  console.log('='.repeat(60) + '\n');
  
  try {
    const result = await executeWithSmartRetry(
      async (provider) => {
        console.log(`   → 调用 ${provider} API...`);
        
        // 模拟 API 调用（成功）
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          message: 'Success',
          data: { result: 'Image analyzed successfully' }
        };
      },
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      3
    );
    
    console.log('\n📊 结果:');
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Attempts: ${result.attempts}`);
    console.log(`   Data:`, result.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// 演示 2: 单次切换场景（第一个 API 失败，第二个成功）
// ============================================================================

async function demo2_singleSwitch() {
  console.log('\n' + '='.repeat(60));
  console.log('演示 2: 单次切换场景（Google 失败 → Cloudflare 成功）');
  console.log('='.repeat(60) + '\n');
  
  // 重置健康状态
  Object.keys(apiHealthStatus).forEach(key => {
    apiHealthStatus[key].healthy = true;
    apiHealthStatus[key].errorCount = 0;
  });
  
  let attemptCount = 0;
  
  try {
    const result = await executeWithSmartRetry(
      async (provider) => {
        attemptCount++;
        console.log(`   → 调用 ${provider} API...`);
        
        // 第一次调用（Google）失败
        if (attemptCount === 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
          throw new Error('API key was reported as leaked');
        }
        
        // 第二次调用（Cloudflare）成功
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          message: 'Success',
          data: { result: 'Image analyzed successfully' }
        };
      },
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      3
    );
    
    console.log('\n📊 结果:');
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Attempts: ${result.attempts}`);
    console.log(`   Tried providers: ${result.triedProviders.join(', ')}`);
    console.log(`   Data:`, result.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// 演示 3: 多次重试场景（前两个失败，第三个成功）
// ============================================================================

async function demo3_multipleRetries() {
  console.log('\n' + '='.repeat(60));
  console.log('演示 3: 多次重试场景（Google, Cloudflare 失败 → Xunfei 成功）');
  console.log('='.repeat(60) + '\n');
  
  // 重置健康状态
  Object.keys(apiHealthStatus).forEach(key => {
    apiHealthStatus[key].healthy = true;
    apiHealthStatus[key].errorCount = 0;
  });
  
  let attemptCount = 0;
  
  try {
    const result = await executeWithSmartRetry(
      async (provider) => {
        attemptCount++;
        console.log(`   → 调用 ${provider} API...`);
        
        // 前两次失败
        if (attemptCount <= 2) {
          await new Promise(resolve => setTimeout(resolve, 100));
          throw new Error(`${provider} API failed: Network timeout`);
        }
        
        // 第三次成功
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          message: 'Success',
          data: { result: 'Image analyzed successfully' }
        };
      },
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      3
    );
    
    console.log('\n📊 结果:');
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Attempts: ${result.attempts}`);
    console.log(`   Tried providers: ${result.triedProviders.join(', ')}`);
    console.log(`   Data:`, result.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// 演示 4: 全部失败场景
// ============================================================================

async function demo4_allFailed() {
  console.log('\n' + '='.repeat(60));
  console.log('演示 4: 全部失败场景（所有 API 都失败）');
  console.log('='.repeat(60) + '\n');
  
  // 重置健康状态
  Object.keys(apiHealthStatus).forEach(key => {
    apiHealthStatus[key].healthy = true;
    apiHealthStatus[key].errorCount = 0;
  });
  
  try {
    const result = await executeWithSmartRetry(
      async (provider) => {
        console.log(`   → 调用 ${provider} API...`);
        
        // 所有调用都失败
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new Error(`${provider} API failed: Service unavailable`);
      },
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      3
    );
    
    console.log('\n📊 结果:', result);
    
  } catch (error) {
    console.error('\n❌ 最终错误:', error.message);
    console.log('\n📊 健康状态:');
    Object.entries(apiHealthStatus).forEach(([provider, status]) => {
      console.log(`   ${provider}: ${status.healthy ? '✅ 健康' : '❌ 不健康'} (错误次数: ${status.errorCount})`);
    });
  }
}

// ============================================================================
// 运行所有演示
// ============================================================================

async function runAllDemos() {
  console.log('\n🎬 智能 API 切换机制演示\n');
  
  await demo1_normalCase();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await demo2_singleSwitch();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await demo3_multipleRetries();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await demo4_allFailed();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 所有演示完成！');
  console.log('='.repeat(60) + '\n');
}

// 运行演示
runAllDemos().catch(console.error);

