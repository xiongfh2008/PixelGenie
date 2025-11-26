/**
 * 测试新的 Google API 密钥
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

console.log('\n🧪 测试新的 Google API 密钥\n');
console.log('='.repeat(70));

if (!GOOGLE_API_KEY) {
  console.error('\n❌ 错误: GOOGLE_API_KEY 未设置');
  process.exit(1);
}

console.log(`\n🔑 API 密钥: ${GOOGLE_API_KEY.substring(0, 20)}...`);

async function testAPI() {
  console.log('\n⏳ 正在测试 API...\n');
  
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'X-goog-api-key': GOOGLE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Say "Hello, PixelGenie is ready!" if you can see this.'
            }]
          }]
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ API 测试失败');
      console.error('错误:', data.error.message);
      console.error('\n可能的原因:');
      console.error('  1. API 密钥无效');
      console.error('  2. API 密钥权限不足');
      console.error('  3. 网络连接问题');
      process.exit(1);
    } else {
      console.log('✅ API 测试成功！');
      console.log('\n📝 API 响应:');
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log(`   ${text}`);
      
      console.log('\n🎉 Google Gemini API 工作正常！');
      console.log('\n📊 API 信息:');
      console.log(`   模型: gemini-2.0-flash`);
      console.log(`   状态: 健康`);
      console.log(`   功能: 图像分析 + 图像生成`);
      
      console.log('\n🚀 下一步:');
      console.log('   1. 重启服务器: npm run dev:all');
      console.log('   2. 刷新浏览器');
      console.log('   3. 测试去水印功能');
      console.log('   4. 享受完整功能！');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.error('\n请检查:');
    console.error('  1. 网络连接');
    console.error('  2. API 密钥是否正确');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

testAPI();
