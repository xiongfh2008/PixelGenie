/**
 * 测试 LLaVA 模型的正确请求格式
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log('🧪 测试 LLaVA 模型请求格式\n');

// 创建一个简单的测试图像（1x1 红色像素）
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// 测试不同的请求格式
const formats = [
  {
    name: '格式 1: prompt + image (数组)',
    body: {
      prompt: 'What do you see in this image?',
      image: Array.from(Buffer.from(testImageBase64, 'base64'))
    }
  },
  {
    name: '格式 2: prompt + image (base64字符串)',
    body: {
      prompt: 'What do you see in this image?',
      image: testImageBase64
    }
  },
  {
    name: '格式 3: prompt + image (data URL)',
    body: {
      prompt: 'What do you see in this image?',
      image: `data:image/png;base64,${testImageBase64}`
    }
  },
  {
    name: '格式 4: messages格式（类似GPT）',
    body: {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What do you see in this image?' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${testImageBase64}` } }
          ]
        }
      ]
    }
  }
];

for (const format of formats) {
  console.log(`\n📝 测试: ${format.name}`);
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(format.body)
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 成功！');
      console.log('响应:', JSON.stringify(data.result, null, 2));
    } else {
      console.log('❌ 失败');
      if (data.errors && data.errors[0]) {
        const errorMsg = data.errors[0].message;
        console.log('错误:', errorMsg.substring(0, 150));
      }
    }
  } catch (error) {
    console.log('❌ 请求异常:', error.message);
  }
}

console.log('\n' + '='.repeat(60));
console.log('测试完成\n');

