/**
 * 修复 VITE_API_KEY 错误
 * 这个脚本会检查和创建必要的前端环境变量配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔧 修复 VITE_API_KEY 错误\n');
console.log('='.repeat(70));

const rootEnvPath = path.join(__dirname, '.env');
const serverEnvPath = path.join(__dirname, 'server', '.env');

// 步骤 1: 检查根目录 .env 文件
console.log('\n📝 步骤 1: 检查根目录 .env 文件...');

let rootEnvContent = '';
if (fs.existsSync(rootEnvPath)) {
  rootEnvContent = fs.readFileSync(rootEnvPath, 'utf-8');
  console.log('✅ 根目录 .env 文件存在');
} else {
  console.log('⚠️  根目录 .env 文件不存在，将创建');
}

// 步骤 2: 检查是否有 VITE_API_BASE_URL
console.log('\n📝 步骤 2: 检查 VITE_API_BASE_URL 配置...');

if (!rootEnvContent.includes('VITE_API_BASE_URL')) {
  console.log('⚠️  未找到 VITE_API_BASE_URL，将添加');
  
  // 添加配置
  const viteConfig = `
# 前端 API 配置
VITE_API_BASE_URL=http://localhost:3001
`;
  
  if (rootEnvContent && !rootEnvContent.endsWith('\n')) {
    rootEnvContent += '\n';
  }
  rootEnvContent += viteConfig;
  
  fs.writeFileSync(rootEnvPath, rootEnvContent, 'utf-8');
  console.log('✅ 已添加 VITE_API_BASE_URL 配置');
} else {
  console.log('✅ VITE_API_BASE_URL 配置已存在');
}

// 步骤 3: 检查后端服务器配置
console.log('\n📝 步骤 3: 检查后端服务器配置...');

if (fs.existsSync(serverEnvPath)) {
  const serverEnvContent = fs.readFileSync(serverEnvPath, 'utf-8');
  
  // 检查是否有至少一个 API key
  const hasGoogleKey = serverEnvContent.includes('GOOGLE_API_KEY=') && 
                       !serverEnvContent.match(/GOOGLE_API_KEY=\s*$/m);
  const hasCloudflareKey = serverEnvContent.includes('CLOUDFLARE_API_TOKEN=') && 
                           !serverEnvContent.match(/CLOUDFLARE_API_TOKEN=\s*$/m);
  
  if (hasGoogleKey || hasCloudflareKey) {
    console.log('✅ 后端 API 密钥配置正常');
    if (hasGoogleKey) console.log('   - Google API Key: 已配置');
    if (hasCloudflareKey) console.log('   - Cloudflare API Token: 已配置');
  } else {
    console.log('⚠️  警告：后端 API 密钥可能未配置');
    console.log('   请检查 server/.env 文件，确保至少配置一个 API key');
  }
} else {
  console.log('❌ 后端 .env 文件不存在');
  console.log('   请从 server/env.example 复制并配置');
}

// 步骤 4: 显示当前配置
console.log('\n📝 步骤 4: 当前配置摘要...');
console.log('\n根目录 .env 内容:');
console.log('-'.repeat(70));
const displayContent = rootEnvContent
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .map(line => {
    // 隐藏敏感信息
    if (line.includes('API_KEY') || line.includes('TOKEN')) {
      const [key] = line.split('=');
      return `${key}=***`;
    }
    return line;
  })
  .join('\n');
console.log(displayContent || '(空)');

// 完成
console.log('\n' + '='.repeat(70));
console.log('🎉 配置检查完成！');
console.log('='.repeat(70));

console.log('\n📋 下一步：');
console.log('   1. 重启开发服务器: npm run dev:all');
console.log('   2. 如果问题仍然存在，请检查:');
console.log('      - 浏览器控制台是否有其他错误');
console.log('      - 后端服务器是否正常运行');
console.log('      - API 密钥是否有效\n');

