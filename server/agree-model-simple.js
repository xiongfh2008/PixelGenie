/**
 * 简单的模型协议同意脚本
 * 直接通过 API 同意 Llama 3.2 模型协议
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log('\n🔐 Cloudflare Llama 3.2 模型协议自动同意\n');
console.log('='.repeat(70));

async function agreeToModel() {
  console.log('\n⏳ 正在提交协议同意请求...\n');
  
  try {
    // 尝试方法 1: 使用 prompt 字段
    console.log('📝 尝试方法 1: 使用 prompt 格式');
    const response1 = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'agree'
        })
      }
    );

    const data1 = await response1.json();
    
    if (data1.success) {
      console.log('✅ 协议同意成功！(方法 1)');
      return true;
    } else {
      console.log('❌ 方法 1 失败:', data1.errors?.[0]?.message?.substring(0, 100));
    }

    // 尝试方法 2: 使用 messages 格式
    console.log('\n📝 尝试方法 2: 使用 messages 格式');
    const response2 = await fetch(
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
              content: 'agree'
            }
          ]
        })
      }
    );

    const data2 = await response2.json();
    
    if (data2.success) {
      console.log('✅ 协议同意成功！(方法 2)');
      return true;
    } else {
      console.log('❌ 方法 2 失败:', data2.errors?.[0]?.message?.substring(0, 100));
    }

    // 尝试方法 3: 使用完整的 messages 格式
    console.log('\n📝 尝试方法 3: 使用完整 messages 格式');
    const response3 = await fetch(
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
                { type: 'text', text: 'agree' }
              ]
            }
          ]
        })
      }
    );

    const data3 = await response3.json();
    
    if (data3.success) {
      console.log('✅ 协议同意成功！(方法 3)');
      return true;
    } else {
      console.log('❌ 方法 3 失败:', data3.errors?.[0]?.message?.substring(0, 100));
      console.log('\n完整错误信息:');
      console.log(JSON.stringify(data3.errors, null, 2));
    }

    return false;
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return false;
  }
}

async function testModel() {
  console.log('\n🧪 测试模型是否可用...\n');
  
  try {
    const response = await fetch(
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
                { type: 'text', text: 'Hello! Please say "I am working" if you can see this.' }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 模型测试成功！');
      console.log('📝 模型响应:', data.result.response || data.result.content);
      return true;
    } else {
      console.log('❌ 模型测试失败');
      console.log('错误:', data.errors?.[0]?.message?.substring(0, 150));
      return false;
    }
  } catch (error) {
    console.error('❌ 测试请求失败:', error.message);
    return false;
  }
}

// 主流程
(async () => {
  console.log('\n📋 说明:');
  console.log('   此脚本将尝试通过 API 自动同意 Llama 3.2 模型协议');
  console.log('   如果自动同意失败，您需要手动通过 Cloudflare Dashboard 同意\n');
  
  const agreed = await agreeToModel();
  
  if (agreed) {
    console.log('\n' + '='.repeat(70));
    console.log('🎉 协议同意成功！正在测试模型...');
    console.log('='.repeat(70));
    
    await testModel();
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('⚠️  自动同意失败');
    console.log('='.repeat(70));
    console.log('\n💡 建议的解决方案:\n');
    console.log('1. 使用 Cloudflare Playground 同意协议:');
    console.log('   - 访问: https://dash.cloudflare.com/');
    console.log('   - 进入 Workers & Pages → AI → Playground');
    console.log('   - 选择 llama-3.2-11b-vision-instruct 模型');
    console.log('   - 在 Playground 中发送任意消息');
    console.log('   - 系统会弹出协议对话框，点击同意\n');
    
    console.log('2. 或者暂时使用其他 API 提供商:');
    console.log('   - Google Gemini (已配置) ✅');
    console.log('   - HuggingFace (已配置) ✅');
    console.log('   - DeepSeek (已配置) ✅\n');
    
    console.log('3. 当前服务器会自动使用可用的 API:');
    console.log('   - 运行: npm run dev:all');
    console.log('   - 系统会自动选择健康的 API 提供商\n');
  }
  
  console.log('='.repeat(70) + '\n');
})();

