/**
 * 测试智能故障转移系统
 */

import { callWithFailover } from './api-failover.js';
import { selectApiProvider, updateApiHealth, getHealthReport } from './api-health.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('\n🧪 测试智能故障转移系统\n');
console.log('='.repeat(70));

// 模拟 API 调用函数
async function mockApiCall(provider, params) {
  console.log(`   📞 Calling ${provider} API...`);
  
  // 模拟不同提供商的行为
  switch (provider) {
    case 'google':
      if (Math.random() > 0.7) {
        throw new Error('Google API timeout');
      }
      return { text: `Response from Google: ${params.query}` };
      
    case 'cloudflare':
      if (Math.random() > 0.8) {
        throw new Error('Cloudflare API error');
      }
      return { text: `Response from Cloudflare: ${params.query}` };
      
    case 'huggingface':
      return { text: `Response from HuggingFace: ${params.query}` };
      
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// 测试 1: 基本故障转移
async function test1() {
  console.log('\n📝 测试 1: 基本故障转移');
  console.log('-'.repeat(70));
  
  try {
    const result = await callWithFailover(
      mockApiCall,
      'imageAnalysis',
      { query: 'Test query 1' },
      3
    );
    
    console.log('\n✅ 测试 1 通过');
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Attempts: ${result.attempts}`);
    console.log(`   Data: ${JSON.stringify(result.data)}`);
    
  } catch (error) {
    console.error('\n❌ 测试 1 失败:', error.message);
  }
}

// 测试 2: 提供商选择
async function test2() {
  console.log('\n📝 测试 2: 智能提供商选择');
  console.log('-'.repeat(70));
  
  // 测试不同能力的选择
  const capabilities = ['imageAnalysis', 'imageModification', 'textTranslation'];
  
  for (const capability of capabilities) {
    const provider = selectApiProvider(capability);
    console.log(`   ${capability}: ${provider || 'None'}`);
  }
  
  console.log('\n✅ 测试 2 完成');
}

// 测试 3: 健康状态管理
async function test3() {
  console.log('\n📝 测试 3: 健康状态管理');
  console.log('-'.repeat(70));
  
  // 模拟一些错误
  updateApiHealth('google', false, 'Test error 1');
  updateApiHealth('google', false, 'Test error 2');
  updateApiHealth('google', false, 'Test error 3');
  
  console.log('   Google 健康状态已更新（3 次错误）');
  
  // 模拟恢复
  updateApiHealth('google', true);
  console.log('   Google 健康状态已恢复');
  
  // 获取报告
  const report = getHealthReport();
  console.log('\n   健康状态报告:');
  console.log(JSON.stringify(report, null, 2));
  
  console.log('\n✅ 测试 3 完成');
}

// 测试 4: 密钥泄露检测
async function test4() {
  console.log('\n📝 测试 4: 密钥泄露检测');
  console.log('-'.repeat(70));
  
  // 模拟密钥泄露
  updateApiHealth('google', false, 'API key was reported as leaked');
  
  console.log('   已模拟密钥泄露检测');
  
  // 尝试选择提供商
  const provider = selectApiProvider('imageAnalysis');
  console.log(`   选中的提供商: ${provider} (应该跳过 google)`);
  
  console.log('\n✅ 测试 4 完成');
}

// 测试 5: 排除提供商
async function test5() {
  console.log('\n📝 测试 5: 排除已尝试的提供商');
  console.log('-'.repeat(70));
  
  const excludeProviders = new Set(['google', 'cloudflare']);
  const provider = selectApiProvider('imageAnalysis', excludeProviders);
  
  console.log(`   排除: ${Array.from(excludeProviders).join(', ')}`);
  console.log(`   选中: ${provider}`);
  
  console.log('\n✅ 测试 5 完成');
}

// 运行所有测试
async function runAllTests() {
  try {
    await test1();
    await test2();
    await test3();
    await test4();
    await test5();
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 所有测试完成！');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  }
}

// 执行测试
runAllTests();
