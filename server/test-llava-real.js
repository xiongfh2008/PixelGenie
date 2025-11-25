/**
 * 使用真实图像测试 LLaVA 模型
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log('🧪 使用真实图像测试 LLaVA 模型\n');

// 创建一个简单的 10x10 红色正方形 PNG
const createSimpleImage = () => {
  // 这是一个 10x10 红色正方形的 PNG (base64)
  return 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';
};

const testImageBase64 = createSimpleImage();

console.log('📝 测试请求格式: { prompt, image: [array] }\n');

try {
  // 将 base64 转换为字节数组
  const imageBuffer = Buffer.from(testImageBase64, 'base64');
  const imageArray = Array.from(imageBuffer);
  
  console.log(`图像大小: ${imageArray.length} 字节`);
  console.log('发送请求...\n');
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Describe this image in one sentence.',
        image: imageArray
      })
    }
  );

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ 成功！');
    console.log('响应:', data.result);
    console.log('\n🎉 LLaVA 模型工作正常！\n');
  } else {
    console.log('❌ 失败');
    console.log('完整响应:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.log('❌ 请求异常:', error.message);
  console.log(error.stack);
}

