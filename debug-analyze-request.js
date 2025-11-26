/**
 * 调试 analyze-image 请求
 * 帮助诊断 HTTP 400 错误
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'server', '.env') });

console.log('\n🔍 调试 analyze-image 请求\n');
console.log('='.repeat(70));

// 创建一个简单的测试图片 base64
const createTestBase64 = () => {
  // 1x1 像素的透明 PNG
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
};

// 测试请求
const testAnalyzeRequest = async () => {
  console.log('\n📝 测试 1: 发送有效请求...');
  
  const testData = {
    originalBase64: createTestBase64(),
    elaBase64: createTestBase64(),
    mfrBase64: null,
    mimeType: 'image/png',
    lang: 'zh'
  };
  
  console.log('请求数据:');
  console.log('  - originalBase64:', testData.originalBase64.substring(0, 50) + '...');
  console.log('  - elaBase64:', testData.elaBase64.substring(0, 50) + '...');
  console.log('  - mimeType:', testData.mimeType);
  console.log('  - lang:', testData.lang);
  
  try {
    const response = await fetch('http://localhost:3001/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('\n响应状态:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 请求成功！');
      console.log('响应数据:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log('❌ 请求失败！');
      console.log('错误信息:', errorData);
      
      // 分析错误
      if (response.status === 400) {
        console.log('\n🔍 HTTP 400 错误分析:');
        console.log('   这通常意味着请求数据格式不正确');
        
        if (errorData.error) {
          console.log('\n   具体错误:', errorData.error);
          
          if (errorData.error.includes('base64')) {
            console.log('\n   💡 可能的原因:');
            console.log('      1. base64 数据包含无效字符');
            console.log('      2. base64 数据格式不正确');
            console.log('      3. 前端发送时包含了 data URI 前缀');
          }
          
          if (errorData.error.includes('Missing')) {
            console.log('\n   💡 可能的原因:');
            console.log('      1. 缺少必需的字段');
            console.log('      2. 字段名称拼写错误');
          }
        }
      }
    }
  } catch (error) {
    console.log('❌ 网络错误:', error.message);
    console.log('\n   💡 请确保后端服务器正在运行:');
    console.log('      npm run dev:all');
  }
};

// 测试 2: 测试无效的 base64
const testInvalidBase64 = async () => {
  console.log('\n📝 测试 2: 发送包含无效字符的 base64...');
  
  const testData = {
    originalBase64: 'invalid-base64-with-special-chars!@#$',
    elaBase64: createTestBase64(),
    mimeType: 'image/png',
    lang: 'zh'
  };
  
  try {
    const response = await fetch('http://localhost:3001/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('✅ 正确拒绝了无效数据');
      console.log('错误信息:', errorData.error);
    }
  } catch (error) {
    console.log('网络错误:', error.message);
  }
};

// 测试 3: 测试缺少必需字段
const testMissingFields = async () => {
  console.log('\n📝 测试 3: 发送缺少必需字段的请求...');
  
  const testData = {
    originalBase64: createTestBase64()
    // 缺少 elaBase64
  };
  
  try {
    const response = await fetch('http://localhost:3001/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('✅ 正确拒绝了不完整的请求');
      console.log('错误信息:', errorData.error);
    }
  } catch (error) {
    console.log('网络错误:', error.message);
  }
};

// 运行所有测试
const runTests = async () => {
  try {
    await testAnalyzeRequest();
    await testInvalidBase64();
    await testMissingFields();
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 测试完成！');
    console.log('='.repeat(70));
    
    console.log('\n📋 常见的 HTTP 400 错误原因:');
    console.log('   1. base64 数据包含 data URI 前缀（如 "data:image/png;base64,"）');
    console.log('   2. base64 数据包含换行符或空格');
    console.log('   3. base64 数据包含无效字符');
    console.log('   4. 缺少必需的字段（originalBase64 或 elaBase64）');
    console.log('   5. 字段名称拼写错误');
    
    console.log('\n💡 解决方案:');
    console.log('   1. 检查前端 fileToBase64 函数是否正确移除了 data URI 前缀');
    console.log('   2. 检查 base64 数据是否包含换行符');
    console.log('   3. 在浏览器控制台查看实际发送的请求数据');
    console.log('   4. 使用 Network 标签查看请求的 Payload\n');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  }
};

// 执行测试
runTests();

