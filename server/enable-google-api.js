/**
 * 重新启用 Google API
 * 在更换新密钥后使用
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');

console.log('\n🔧 重新启用 Google API\n');
console.log('='.repeat(70));

try {
  // 读取 .env 文件
  if (!fs.existsSync(envPath)) {
    console.error('\n❌ 错误: 找不到 server/.env 文件');
    console.error('💡 请确保 server/.env 文件存在\n');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  const originalContent = envContent;

  // 检查是否已经启用
  if (!envContent.includes('#GOOGLE_API_KEY=') && !envContent.includes('# GOOGLE_API_KEY=')) {
    console.log('\n✅ Google API 已经是启用状态');
    console.log('💡 如果需要禁用，运行: node disable-google-api.js\n');
    process.exit(0);
  }

  // 启用 Google API 密钥
  envContent = envContent.replace(
    /^#\s*GOOGLE_API_KEY=/gm,
    'GOOGLE_API_KEY='
  );

  // 检查是否有修改
  if (envContent === originalContent) {
    console.log('\n⚠️  未找到被注释的 GOOGLE_API_KEY');
    console.log('💡 可能已经被启用\n');
    process.exit(0);
  }

  // 写回文件
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('\n✅ 成功启用 Google API！');
  console.log('\n📝 修改内容:');
  console.log('   # GOOGLE_API_KEY=... → GOOGLE_API_KEY=...');
  
  console.log('\n⚠️  重要提示:');
  console.log('   请确保您已经更换了新的 Google API 密钥！');
  console.log('   旧密钥已被标记为泄露，无法使用。');
  
  console.log('\n🔄 下一步:');
  console.log('   1. 确认 GOOGLE_API_KEY 是新密钥');
  console.log('   2. 重置健康状态: node reset-google-health.js');
  console.log('   3. 重启服务器: npm run dev:all');
  console.log('   4. 测试功能');
  
  console.log('\n📚 获取新密钥:');
  console.log('   访问: https://aistudio.google.com/app/apikey');
  console.log('   1. 删除旧密钥');
  console.log('   2. 创建新密钥');
  console.log('   3. 更新 server/.env 文件');
  
  console.log('\n' + '='.repeat(70) + '\n');

} catch (error) {
  console.error('\n❌ 错误:', error.message);
  console.error('\n💡 请手动编辑 server/.env 文件:');
  console.error('   找到: # GOOGLE_API_KEY=...');
  console.error('   改为: GOOGLE_API_KEY=...\n');
  process.exit(1);
}

