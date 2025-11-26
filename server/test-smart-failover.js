/**
 * 测试智能API故障转移机制
 * 模拟各种故障场景，验证自动切换功能
 */

import { smartApiRequest } from './smart-api-router.js';

// 模拟API健康状态
const mockHealthStatus = {
  google: { healthy: true, errorCount: 0 },
  cloudflare: { healthy: true, errorCount: 0 },
  huggingface: { healthy: true, errorCount: 0 },
  xunfei: { healthy: true, errorCount: 0 }
};

// 模拟API密钥
const mockApiKeys = {
  google: 'mock-google-key',
  cloudflare: 'mock-cloudflare-key',
  huggingface: 'mock-huggingface-key',
  xunfei: 'mock-xunfei-key'
};

// 模拟API能力
const apiCapabilities = {
  google: ['imageAnalysis', 'imageModification', 'textTranslation'],
  cloudflare: ['imageAnalysis', 'textTranslation'],
  huggingface: ['imageAnalysis'],
  xunfei: ['imageAnalysis', 'textTranslation']
};

// 模拟选择API提供商
function mockSelectApiProvider(capability) {
  const providers = ['google', 'cloudflare', 'huggingface', 'xunfei'];
  
  for (const provider of providers) {
    if (mockHealthStatus[provider].healthy && 
        mockApiKeys[provider] &&
        (!capability || apiCapabilities[provider].includes(capability))) {
      return provider;
    }
  }
  
  throw new Error('No available API providers');
}

// 模拟更新API健康状态
function mockUpdateApiHealth(provider, isHealthy, errorMessage = '') {
  if (mockHealthStatus[provider]) {
    mockHealthStatus[provider].healthy = isHealthy;
    if (!isHealthy) {
      mockHealthStatus[provider].errorCount++;
      console.log(`⚠️  ${provider} marked as unhealthy: ${errorMessage}`);
    } else {
      mockHealthStatus[provider].errorCount = 0;
      console.log(`✅ ${provider} marked as healthy`);
    }
  }
}

// ============================================
// 测试场景
// ============================================

/**
 * 场景 1: 所有API正常 - 应该使用第一个可用的API
 */
async function testScenario1() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 场景 1: 所有API正常');
  console.log('='.repeat(60));
  
  // 重置健康状态
  Object.keys(mockHealthStatus).forEach(key => {
    mockHealthStatus[key].healthy = true;
    mockHealthStatus[key].errorCount = 0;
  });
  
  try {
    const result = await smartApiRequest({
      selectApiProvider: mockSelectApiProvider,
      updateApiHealth: mockUpdateApiHealth,
      capability: 'imageAnalysis',
      params: { text: 'test' },
      maxAttempts: 3,
      
      buildRequest: (provider, params) => {
        return { provider, params };
      },
      
      executeRequest: async (config) => {
        // 模拟成功的API调用
        return { success: true, provider: config.provider };
      },
      
      parseResponse: (data, provider) => {
        return { message: `Success with ${provider}`, data };
      }
    });
    
    console.log('✅ 测试通过！');
    console.log('📊 结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

/**
 * 场景 2: 第一个API失败 - 应该自动切换到第二个API
 */
async function testScenario2() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 场景 2: 第一个API失败，自动切换');
  console.log('='.repeat(60));
  
  // 重置健康状态
  Object.keys(mockHealthStatus).forEach(key => {
    mockHealthStatus[key].healthy = true;
    mockHealthStatus[key].errorCount = 0;
  });
  
  let attemptCount = 0;
  
  try {
    const result = await smartApiRequest({
      selectApiProvider: mockSelectApiProvider,
      updateApiHealth: mockUpdateApiHealth,
      capability: 'imageAnalysis',
      params: { text: 'test' },
      maxAttempts: 3,
      
      buildRequest: (provider, params) => {
        return { provider, params };
      },
      
      executeRequest: async (config) => {
        attemptCount++;
        
        // 第一次尝试失败（google）
        if (attemptCount === 1) {
          throw new Error('Google API timeout');
        }
        
        // 第二次尝试成功（cloudflare）
        return { success: true, provider: config.provider };
      },
      
      parseResponse: (data, provider) => {
        return { message: `Success with ${provider}`, data };
      }
    });
    
    console.log('✅ 测试通过！自动切换成功！');
    console.log('📊 结果:', JSON.stringify(result, null, 2));
    console.log(`🔄 总共尝试了 ${attemptCount} 次`);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

/**
 * 场景 3: 多次失败后成功 - 测试重试机制
 */
async function testScenario3() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 场景 3: 多次失败后成功');
  console.log('='.repeat(60));
  
  // 重置健康状态
  Object.keys(mockHealthStatus).forEach(key => {
    mockHealthStatus[key].healthy = true;
    mockHealthStatus[key].errorCount = 0;
  });
  
  let attemptCount = 0;
  
  try {
    const result = await smartApiRequest({
      selectApiProvider: mockSelectApiProvider,
      updateApiHealth: mockUpdateApiHealth,
      capability: 'imageAnalysis',
      params: { text: 'test' },
      maxAttempts: 4,
      
      buildRequest: (provider, params) => {
        return { provider, params };
      },
      
      executeRequest: async (config) => {
        attemptCount++;
        
        // 前3次都失败
        if (attemptCount <= 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        
        // 第4次成功
        return { success: true, provider: config.provider };
      },
      
      parseResponse: (data, provider) => {
        return { message: `Success with ${provider}`, data };
      }
    });
    
    console.log('✅ 测试通过！经过多次重试后成功！');
    console.log('📊 结果:', JSON.stringify(result, null, 2));
    console.log(`🔄 总共尝试了 ${attemptCount} 次`);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

/**
 * 场景 4: 所有API都失败 - 应该返回错误
 */
async function testScenario4() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 场景 4: 所有API都失败');
  console.log('='.repeat(60));
  
  // 重置健康状态
  Object.keys(mockHealthStatus).forEach(key => {
    mockHealthStatus[key].healthy = true;
    mockHealthStatus[key].errorCount = 0;
  });
  
  let attemptCount = 0;
  
  try {
    const result = await smartApiRequest({
      selectApiProvider: mockSelectApiProvider,
      updateApiHealth: mockUpdateApiHealth,
      capability: 'imageAnalysis',
      params: { text: 'test' },
      maxAttempts: 3,
      
      buildRequest: (provider, params) => {
        return { provider, params };
      },
      
      executeRequest: async (config) => {
        attemptCount++;
        // 所有尝试都失败
        throw new Error(`API ${config.provider} failed`);
      },
      
      parseResponse: (data, provider) => {
        return { message: `Success with ${provider}`, data };
      }
    });
    
    console.error('❌ 测试失败：应该抛出错误但没有');
  } catch (error) {
    console.log('✅ 测试通过！正确地抛出了错误！');
    console.log('📊 错误信息:', error.message);
    console.log(`🔄 总共尝试了 ${attemptCount} 次`);
  }
}

/**
 * 场景 5: 测试能力过滤 - 只有支持特定能力的API应该被选中
 */
async function testScenario5() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 场景 5: 测试能力过滤（imageModification）');
  console.log('='.repeat(60));
  
  // 重置健康状态
  Object.keys(mockHealthStatus).forEach(key => {
    mockHealthStatus[key].healthy = true;
    mockHealthStatus[key].errorCount = 0;
  });
  
  try {
    const result = await smartApiRequest({
      selectApiProvider: mockSelectApiProvider,
      updateApiHealth: mockUpdateApiHealth,
      capability: 'imageModification',  // 只有google支持
      params: { text: 'test' },
      maxAttempts: 3,
      
      buildRequest: (provider, params) => {
        console.log(`🎯 选中的提供商: ${provider}`);
        return { provider, params };
      },
      
      executeRequest: async (config) => {
        // 模拟成功
        return { success: true, provider: config.provider };
      },
      
      parseResponse: (data, provider) => {
        return { message: `Success with ${provider}`, data };
      }
    });
    
    console.log('✅ 测试通过！');
    console.log('📊 结果:', JSON.stringify(result, null, 2));
    
    if (result.meta.provider === 'google') {
      console.log('✅ 正确选择了支持 imageModification 的提供商（google）');
    } else {
      console.error('❌ 选择了错误的提供商:', result.meta.provider);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// ============================================
// 运行所有测试
// ============================================

async function runAllTests() {
  console.log('\n');
  console.log('🧪 开始测试智能API故障转移机制');
  console.log('='.repeat(60));
  
  await testScenario1();
  await testScenario2();
  await testScenario3();
  await testScenario4();
  await testScenario5();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 所有测试完成！');
  console.log('='.repeat(60));
  console.log('\n📊 健康状态摘要:');
  console.table(mockHealthStatus);
}

// 运行测试
runAllTests().catch(console.error);

