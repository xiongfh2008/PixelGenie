/**
 * 更新 Google API 密钥
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');
const newApiKey = 'AIzaSyCqNR9oNsbRL8F-S9NMqUxnAImwgi3HvT4';

console.log('\n🔑 更新 Google API 密钥\n');
console.log('='.repeat(70));

try {
  // 读取 .env 文件
  if (!fs.existsSync(envPath)) {
    console.error('\n❌ 错误: 找不到 server/.env 文件');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // 更新或添加 GOOGLE_API_KEY
  if (envContent.includes('GOOGLE_API_KEY=') || envContent.includes('# GOOGLE_API_KEY=')) {
    // 替换现有的（包括被注释的）
    envContent = envContent.replace(
      /^#?\s*GOOGLE_API_KEY=.*/gm,
      `GOOGLE_API_KEY=${newApiKey}`
    );
  } else {
    // 添加新的
    envContent += `\nGOOGLE_API_KEY=${newApiKey}\n`;
  }

  // 写回文件
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('\n✅ 成功更新 Google API 密钥！');
  console.log(`\n🔑 新密钥: ${newApiKey.substring(0, 20)}...`);
  
  console.log('\n📝 下一步:');
  console.log('   1. 重置健康状态: node reset-google-health.js');
  console.log('   2. 重启服务器: npm run dev:all');
  console.log('   3. 测试去水印功能');
  
  console.log('\n' + '='.repeat(70) + '\n');

} catch (error) {
  console.error('\n❌ 错误:', error.message);
  process.exit(1);
}
