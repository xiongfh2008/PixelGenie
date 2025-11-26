/**
 * Cloudflare Workers AI 测试脚本
 * 用于验证 Cloudflare API 配置是否正确
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log('🧪 Cloudflare Workers AI 配置测试\n');
console.log('=' .repeat(60));

// 检查环境变量
console.log('\n📋 步骤 1: 检查环境变量');
console.log('-'.repeat(60));

if (!CLOUDFLARE_ACCOUNT_ID || CLOUDFLARE_ACCOUNT_ID === 'your_account_id_here') {
  console.error('❌ CLOUDFLARE_ACCOUNT_ID 未配置或使用默认值');
  console.error('💡 请在 server/.env 文件中设置正确的 Account ID');
  console.error('📚 参考: CLOUDFLARE_SETUP_GUIDE.md');
  process.exit(1);
}

if (!CLOUDFLARE_API_TOKEN || CLOUDFLARE_API_TOKEN === 'your_api_token_here') {
  console.error('❌ CLOUDFLARE_API_TOKEN 未配置或使用默认值');
  console.error('💡 请在 server/.env 文件中设置正确的 API Token');
  console.error('📚 参考: CLOUDFLARE_SETUP_GUIDE.md');
  process.exit(1);
}

console.log('✅ CLOUDFLARE_ACCOUNT_ID:', CLOUDFLARE_ACCOUNT_ID.substring(0, 8) + '...');
console.log('✅ CLOUDFLARE_API_TOKEN:', CLOUDFLARE_API_TOKEN.substring(0, 10) + '...');

// 测试 1: 验证 API Token
console.log('\n🔐 步骤 2: 验证 API Token');
console.log('-'.repeat(60));

try {
  const verifyResponse = await fetch(
    'https://api.cloudflare.com/client/v4/user/tokens/verify',
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const verifyData = await verifyResponse.json();
  
  if (verifyData.success) {
    console.log('✅ API Token 验证成功');
    console.log('   Token Status:', verifyData.result.status);
    if (verifyData.result.expires_on) {
      console.log('   Expires On:', verifyData.result.expires_on);
    }
  } else {
    console.error('❌ API Token 验证失败');
    console.error('   错误信息:', verifyData.errors);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ API Token 验证请求失败:', error.message);
  process.exit(1);
}

// 测试 2: 获取可用模型列表
console.log('\n📦 步骤 3: 获取可用模型列表');
console.log('-'.repeat(60));

try {
  const modelsResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/models`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const modelsData = await modelsResponse.json();
  
  if (modelsData.success) {
    console.log('✅ 成功获取模型列表');
    
    // 查找视觉模型
    const visionModels = modelsData.result.filter(model => 
      model.name.includes('vision') || model.name.includes('llama-3.2')
    );
    
    if (visionModels.length > 0) {
      console.log(`   找到 ${visionModels.length} 个视觉模型:`);
      visionModels.forEach(model => {
        console.log(`   - ${model.name}`);
      });
      
      // 检查目标模型是否可用
      const targetModel = '@cf/meta/llama-3.2-11b-vision-instruct';
      const hasTargetModel = visionModels.some(model => model.name === targetModel);
      
      if (hasTargetModel) {
        console.log(`\n✅ 目标模型可用: ${targetModel}`);
      } else {
        console.warn(`\n⚠️  目标模型不在列表中: ${targetModel}`);
        console.warn('   但这可能是正常的，某些模型不会在列表中显示');
      }
    } else {
      console.log('   未找到视觉模型，但将尝试使用目标模型');
    }
  } else {
    console.error('❌ 获取模型列表失败');
    console.error('   错误信息:', modelsData.errors);
  }
} catch (error) {
  console.error('❌ 获取模型列表请求失败:', error.message);
}

// 测试 3: 测试文本生成
console.log('\n💬 步骤 4: 测试文本生成（无图像）');
console.log('-'.repeat(60));

try {
  const textTestResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Hello! Please respond with "Cloudflare Workers AI is working!" if you can see this message.' }
            ]
          }
        ]
      })
    }
  );

  const textTestData = await textTestResponse.json();
  
  if (textTestData.success) {
    console.log('✅ 文本生成测试成功');
    console.log('   响应:', textTestData.result.response || textTestData.result.content);
  } else {
    console.error('❌ 文本生成测试失败');
    console.error('   错误信息:', textTestData.errors);
  }
} catch (error) {
  console.error('❌ 文本生成测试请求失败:', error.message);
}

// 测试 4: 测试图像分析（使用简单的测试图像）
console.log('\n🖼️  步骤 5: 测试图像分析');
console.log('-'.repeat(60));

try {
  // 创建一个简单的 1x1 红色像素的 PNG 图像（base64）
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  const imageTestResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What do you see in this image? Describe it briefly.' },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/png;base64,${testImageBase64}` 
                } 
              }
            ]
          }
        ]
      })
    }
  );

  const imageTestData = await imageTestResponse.json();
  
  if (imageTestData.success) {
    console.log('✅ 图像分析测试成功');
    console.log('   响应:', imageTestData.result.response || imageTestData.result.content);
  } else {
    console.error('❌ 图像分析测试失败');
    console.error('   错误信息:', imageTestData.errors);
    console.error('   完整响应:', JSON.stringify(imageTestData, null, 2));
  }
} catch (error) {
  console.error('❌ 图像分析测试请求失败:', error.message);
}

// 总结
console.log('\n' + '='.repeat(60));
console.log('🎉 测试完成！');
console.log('='.repeat(60));
console.log('\n如果所有测试都通过，Cloudflare Workers AI 已成功集成！');
console.log('现在可以启动服务器并使用智能鉴伪功能了。');
console.log('\n启动命令: npm run dev:all');
console.log('\n📚 更多信息请参考: CLOUDFLARE_SETUP_GUIDE.md\n');

