/**
 * 临时禁用 Google API
 * 用于快速解决 API 密钥泄露问题
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');

console.log('\n🔧 临时禁用 Google API\n');
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

  // 检查是否已经禁用
  if (envContent.includes('#GOOGLE_API_KEY=') || envContent.includes('# GOOGLE_API_KEY=')) {
    console.log('\n✅ Google API 已经被禁用');
    console.log('💡 如果需要重新启用，请手动编辑 server/.env 文件\n');
    process.exit(0);
  }

  // 禁用 Google API 密钥
  envContent = envContent.replace(
    /^GOOGLE_API_KEY=/gm,
    '# GOOGLE_API_KEY='
  );

  // 检查是否有修改
  if (envContent === originalContent) {
    console.log('\n⚠️  未找到 GOOGLE_API_KEY 配置');
    console.log('💡 可能已经被删除或注释\n');
    process.exit(0);
  }

  // 写回文件
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('\n✅ 成功禁用 Google API！');
  console.log('\n📝 修改内容:');
  console.log('   GOOGLE_API_KEY=... → # GOOGLE_API_KEY=...');
  
  console.log('\n📊 当前可用的 API:');
  console.log('   ✅ 讯飞星火 (Xunfei)');
  console.log('   ✅ Cloudflare Workers AI');
  console.log('   ✅ HuggingFace');
  console.log('   ✅ DeepSeek');
  
  console.log('\n🔄 下一步:');
  console.log('   1. 重启服务器: npm run dev:all');
  console.log('   2. 刷新浏览器');
  console.log('   3. 测试去水印功能');
  
  console.log('\n💡 提示:');
  console.log('   - 去水印功能会自动使用 Cloudflare API');
  console.log('   - 智能鉴伪功能会使用讯飞星火 API');
  console.log('   - 稍后可以更换新的 Google API 密钥并重新启用');
  
  console.log('\n📚 相关文档:');
  console.log('   - IMMEDIATE_DEWATERMARK_FIX.md - 完整修复指南');
  console.log('   - FIX_GOOGLE_API_KEY.md - Google 密钥更换指南');
  
  console.log('\n' + '='.repeat(70) + '\n');

} catch (error) {
  console.error('\n❌ 错误:', error.message);
  console.error('\n💡 请手动编辑 server/.env 文件:');
  console.error('   找到: GOOGLE_API_KEY=...');
  console.error('   改为: # GOOGLE_API_KEY=...\n');
  process.exit(1);
}

