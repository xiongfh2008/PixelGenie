/**
 * 检查 API 状态和密钥有效性
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'server', '.env') });

console.log('\n🔍 检查 API 状态\n');
console.log('='.repeat(70));

// 检查 Google API
console.log('\n📝 检查 Google Gemini API...');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.log('❌ GOOGLE_API_KEY 未配置');
} else {
  console.log(`✅ GOOGLE_API_KEY 已配置 (长度: ${GOOGLE_API_KEY.length})`);
  
  // 测试 Google API
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'X-goog-api-key': GOOGLE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Hello' }]
          }]
        })
      }
    );
    
    if (response.ok) {
      console.log('✅ Google API 测试成功');
      const data = await response.json();
      console.log('   响应示例:', data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) || 'OK');
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Google API 测试失败');
      console.log('   状态码:', response.status);
      console.log('   错误信息:', errorData.error?.message || JSON.stringify(errorData));
      
      // 检查是否是密钥过期
      if (errorData.error?.message?.includes('expired') || 
          errorData.error?.message?.includes('invalid') ||
          errorData.error?.message?.includes('API key not valid')) {
        console.log('\n🚨 API 密钥问题检测到！');
        console.log('   可能的原因:');
        console.log('   1. API 密钥已过期');
        console.log('   2. API 密钥无效');
        console.log('   3. API 密钥被撤销');
        console.log('\n💡 解决方案:');
        console.log('   1. 访问 https://aistudio.google.com/apikey');
        console.log('   2. 生成新的 API 密钥');
        console.log('   3. 更新 server/.env 中的 GOOGLE_API_KEY');
        console.log('   4. 重启服务器');
      }
    }
  } catch (error) {
    console.log('❌ 网络错误:', error.message);
  }
}

// 检查 Cloudflare API
console.log('\n📝 检查 Cloudflare Workers AI...');
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
  console.log('⚠️  Cloudflare 配置不完整');
  if (!CLOUDFLARE_API_TOKEN) console.log('   - CLOUDFLARE_API_TOKEN 未配置');
  if (!CLOUDFLARE_ACCOUNT_ID) console.log('   - CLOUDFLARE_ACCOUNT_ID 未配置');
} else {
  console.log(`✅ Cloudflare 配置完整`);
  
  // 测试 Cloudflare API
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
          messages: [{
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }]
          }]
        })
      }
    );
    
    if (response.ok) {
      console.log('✅ Cloudflare API 测试成功');
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('⚠️  Cloudflare API 测试失败');
      console.log('   状态码:', response.status);
      console.log('   错误:', errorData.errors?.[0]?.message || JSON.stringify(errorData));
    }
  } catch (error) {
    console.log('❌ 网络错误:', error.message);
  }
}

console.log('\n' + '='.repeat(70));
console.log('🎉 检查完成！');
console.log('='.repeat(70) + '\n');

