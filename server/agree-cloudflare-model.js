/**
 * Cloudflare Llama Vision 模型协议同意脚本
 * 运行此脚本以同意 Llama 3.2 Vision 模型的使用协议
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log('\n' + '='.repeat(70));
console.log('Cloudflare Llama 3.2 Vision 模型协议同意');
console.log('='.repeat(70) + '\n');

console.log('📋 使用此模型前，您需要同意以下协议：\n');
console.log('1. Llama 3.2 Community License');
console.log('   https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE\n');
console.log('2. Acceptable Use Policy');
console.log('   https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md\n');
console.log('3. 地区限制：您声明您不是居住在欧盟的个人，也不是主要营业地在欧盟的公司\n');

console.log('⚠️  重要提示：');
console.log('   - 请先访问上述链接阅读完整协议');
console.log('   - 只有在完全理解并同意协议内容后才继续');
console.log('   - 继续操作即表示您同意上述所有条款\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('您是否已阅读并同意上述协议？(yes/no): ', async (answer) => {
  rl.close();
  
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('\n❌ 操作已取消');
    console.log('💡 如需使用此模型，请先阅读协议后重新运行此脚本\n');
    process.exit(0);
  }
  
  console.log('\n⏳ 正在提交协议同意...\n');
  
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
                { type: 'text', text: 'agree' }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 协议同意成功！');
      console.log('🎉 Llama 3.2 Vision 模型现在可以使用了\n');
      
      // 测试模型
      console.log('🧪 正在测试模型...\n');
      
      const testResponse = await fetch(
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
                  { type: 'text', text: 'Hello! Please confirm you are working.' }
                ]
              }
            ]
          })
        }
      );

      const testData = await testResponse.json();
      
      if (testData.success) {
        console.log('✅ 模型测试成功！');
        console.log('📝 模型响应:', testData.result.response || testData.result.content);
        console.log('\n' + '='.repeat(70));
        console.log('🎊 配置完成！现在可以启动服务器了：npm run dev:all');
        console.log('='.repeat(70) + '\n');
      } else {
        console.log('⚠️  模型测试失败，但协议已同意');
        console.log('错误信息:', testData.errors);
      }
    } else {
      console.error('❌ 协议同意失败');
      console.error('错误信息:', data.errors);
      console.error('\n💡 可能的原因：');
      console.error('   1. API Token 权限不足');
      console.error('   2. Account ID 不正确');
      console.error('   3. 网络连接问题');
      console.error('\n请检查配置后重试\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.error('\n💡 请检查：');
    console.error('   1. 网络连接是否正常');
    console.error('   2. Cloudflare 凭证是否正确');
    console.error('   3. 是否需要配置代理\n');
    process.exit(1);
  }
});
