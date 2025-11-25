/**
 * 列出 Cloudflare Workers AI 可用模型
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log('📦 Cloudflare Workers AI 可用模型列表\n');

// 尝试使用不同的 API 端点来获取模型列表
const endpoints = [
  `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/models/search`,
  `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/models/catalog`
];

// 尝试一些常见的视觉模型
const visionModels = [
  '@cf/meta/llama-3.2-11b-vision-instruct',
  '@cf/llava-hf/llava-1.5-7b-hf',
  '@cf/unum/uform-gen2-qwen-500m',
  '@cf/microsoft/resnet-50'
];

console.log('🧪 测试可用的视觉模型:\n');

for (const model of visionModels) {
  try {
    console.log(`测试模型: ${model}`);
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'test',
          image: []
        })
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log(`  ✅ 可用: ${model}\n`);
    } else if (data.errors && data.errors[0]) {
      const errorMsg = data.errors[0].message;
      if (errorMsg.includes('Model Agreement')) {
        console.log(`  ⚠️  需要同意协议: ${model}`);
        console.log(`     ${errorMsg.substring(0, 100)}...\n`);
      } else if (errorMsg.includes('not found')) {
        console.log(`  ❌ 模型不存在: ${model}\n`);
      } else {
        console.log(`  ⚠️  错误: ${errorMsg.substring(0, 100)}...\n`);
      }
    }
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}\n`);
  }
}

console.log('\n💡 建议:');
console.log('   1. 访问 Cloudflare Dashboard 同意模型协议');
console.log('   2. 或使用其他不需要协议的模型');
console.log('   3. Dashboard: https://dash.cloudflare.com/\n');

