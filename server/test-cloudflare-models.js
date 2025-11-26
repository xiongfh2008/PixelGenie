/**
 * 测试 Cloudflare Workers AI 可用的视觉模型
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log('\n🧪 测试 Cloudflare Workers AI 可用的视觉模型\n');
console.log('='.repeat(70));

// 创建一个简单的测试图像（1x1 红色像素）
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// 要测试的模型列表
const modelsToTest = [
  {
    name: '@cf/llava-hf/llava-1.5-7b-hf',
    description: 'LLaVA 1.5 7B - 开源视觉语言模型',
    format: 'llava'
  },
  {
    name: '@cf/unum/uform-gen2-qwen-500m',
    description: 'Uform Gen2 QWen 500M - 轻量级视觉模型',
    format: 'standard'
  },
  {
    name: '@cf/meta/llama-3.2-11b-vision-instruct',
    description: 'Llama 3.2 Vision - Meta 高性能视觉模型',
    format: 'standard'
  }
];

async function testModel(model) {
  console.log(`\n📦 测试模型: ${model.name}`);
  console.log(`   描述: ${model.description}`);
  console.log('-'.repeat(70));

  try {
    let requestBody;
    
    if (model.format === 'llava') {
      // LLaVA 模型使用特殊格式
      requestBody = {
        prompt: 'What do you see in this image?',
        image: [Array.from(Buffer.from(testImageBase64, 'base64'))]
      };
    } else {
      // 标准格式
      requestBody = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What do you see in this image? Just say "I can see the image" if you can process it.' },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/png;base64,${testImageBase64}` 
                } 
              }
            ]
          }
        ]
      };
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model.name}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 模型可用！');
      console.log('   响应:', data.result.response || data.result.description || data.result.content || JSON.stringify(data.result).substring(0, 100));
      return { model: model.name, status: 'available', data };
    } else {
      console.log('❌ 模型不可用');
      console.log('   错误:', data.errors?.[0]?.message || JSON.stringify(data.errors));
      return { model: model.name, status: 'unavailable', error: data.errors };
    }
  } catch (error) {
    console.log('❌ 请求失败');
    console.log('   错误:', error.message);
    return { model: model.name, status: 'error', error: error.message };
  }
}

// 测试所有模型
console.log('\n🚀 开始测试所有模型...\n');

const results = [];
for (const model of modelsToTest) {
  const result = await testModel(model);
  results.push(result);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒避免速率限制
}

// 总结
console.log('\n' + '='.repeat(70));
console.log('📊 测试结果总结');
console.log('='.repeat(70));

const available = results.filter(r => r.status === 'available');
const unavailable = results.filter(r => r.status !== 'available');

console.log(`\n✅ 可用模型 (${available.length}):`);
available.forEach(r => {
  console.log(`   - ${r.model}`);
});

console.log(`\n❌ 不可用模型 (${unavailable.length}):`);
unavailable.forEach(r => {
  console.log(`   - ${r.model}`);
  if (r.error) {
    const errorMsg = Array.isArray(r.error) ? r.error[0]?.message : r.error;
    console.log(`     原因: ${errorMsg?.substring(0, 80)}...`);
  }
});

// 推荐
if (available.length > 0) {
  console.log('\n💡 推荐使用:');
  console.log(`   ${available[0].model}`);
  console.log('\n📝 下一步: 更新 server/index.js 使用推荐的模型');
} else {
  console.log('\n⚠️  没有找到可用的视觉模型');
  console.log('💡 可能的解决方案:');
  console.log('   1. 检查 API Token 权限');
  console.log('   2. 确认账户已启用 Workers AI');
  console.log('   3. 联系 Cloudflare 支持');
}

console.log('\n');

