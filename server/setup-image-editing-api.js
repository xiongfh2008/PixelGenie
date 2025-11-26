#!/usr/bin/env node

/**
 * 图像编辑 API 快速配置脚本
 * 帮助用户快速配置至少一个图像编辑 API
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const API_PROVIDERS = {
  clipdrop: {
    name: 'ClipDrop',
    url: 'https://clipdrop.co/apis',
    envKey: 'CLIPDROP_API_KEY',
    description: '专业的对象移除和去水印 API',
    freeQuota: '100 次/月',
    recommended: true
  },
  removebg: {
    name: 'Remove.bg',
    url: 'https://www.remove.bg/api',
    envKey: 'REMOVEBG_API_KEY',
    description: '专业的背景移除 API',
    freeQuota: '50 次/月',
    recommended: true
  },
  replicate: {
    name: 'Replicate',
    url: 'https://replicate.com',
    envKey: 'REPLICATE_API_KEY',
    description: '支持多种 AI 模型的平台',
    freeQuota: '$5/月',
    recommended: false
  },
  stability: {
    name: 'Stability AI',
    url: 'https://platform.stability.ai',
    envKey: 'STABILITY_API_KEY',
    description: 'Stable Diffusion 图像生成',
    freeQuota: '25 积分',
    recommended: false
  },
  huggingface: {
    name: 'HuggingFace',
    url: 'https://huggingface.co',
    envKey: 'HUGGINGFACE_API_KEY',
    description: '开源 AI 模型平台',
    freeQuota: '有限制但免费',
    recommended: false
  }
};

const checkExistingKeys = () => {
  const existingKeys = {};
  
  for (const [key, config] of Object.entries(API_PROVIDERS)) {
    const envValue = process.env[config.envKey];
    if (envValue && envValue.trim() !== '') {
      existingKeys[key] = envValue;
    }
  }
  
  return existingKeys;
};

const updateEnvFile = (newKeys) => {
  const envPath = join(__dirname, '.env');
  let envContent = '';
  
  // Read existing .env file
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Add or update keys
  for (const [provider, apiKey] of Object.entries(newKeys)) {
    const config = API_PROVIDERS[provider];
    const envKey = config.envKey;
    
    // Check if key already exists in .env
    const keyRegex = new RegExp(`^${envKey}=.*$`, 'gm');
    
    if (keyRegex.test(envContent)) {
      // Update existing key
      envContent = envContent.replace(keyRegex, `${envKey}=${apiKey}`);
      console.log(`✅ Updated ${config.name} API key`);
    } else {
      // Add new key
      if (!envContent.endsWith('\n') && envContent.length > 0) {
        envContent += '\n';
      }
      envContent += `\n# ${config.name} API\n`;
      envContent += `${envKey}=${apiKey}\n`;
      console.log(`✅ Added ${config.name} API key`);
    }
  }
  
  // Write back to .env file
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('\n✅ .env file updated successfully!');
};

const main = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       PixelGenie 图像编辑 API 配置向导                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Check existing keys
  const existingKeys = checkExistingKeys();
  
  if (Object.keys(existingKeys).length > 0) {
    console.log('✅ 已配置的 API:');
    for (const [provider, key] of Object.entries(existingKeys)) {
      const config = API_PROVIDERS[provider];
      console.log(`   - ${config.name}: ${key.substring(0, 10)}...`);
    }
    console.log('');
    
    const continueSetup = await question('是否要添加更多 API? (y/n): ');
    if (continueSetup.toLowerCase() !== 'y') {
      console.log('\n✅ 配置完成！您已经有可用的图像编辑 API。');
      rl.close();
      return;
    }
  } else {
    console.log('⚠️  未检测到任何图像编辑 API 配置。');
    console.log('   请至少配置一个 API 以使用去水印功能。\n');
  }
  
  console.log('推荐的 API 提供商（按优先级排序）：\n');
  
  let index = 1;
  for (const [key, config] of Object.entries(API_PROVIDERS)) {
    const status = existingKeys[key] ? '✅ 已配置' : '⚪ 未配置';
    const badge = config.recommended ? '⭐ 推荐' : '';
    console.log(`${index}. ${config.name} ${badge} ${status}`);
    console.log(`   ${config.description}`);
    console.log(`   免费额度: ${config.freeQuota}`);
    console.log(`   注册地址: ${config.url}\n`);
    index++;
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const newKeys = {};
  
  // Ask for each provider
  for (const [key, config] of Object.entries(API_PROVIDERS)) {
    if (existingKeys[key]) {
      const update = await question(`是否更新 ${config.name} API Key? (y/n): `);
      if (update.toLowerCase() !== 'y') {
        continue;
      }
    }
    
    console.log(`\n配置 ${config.name}:`);
    console.log(`1. 访问: ${config.url}`);
    console.log(`2. 注册账号并获取 API Key`);
    console.log(`3. 将 API Key 粘贴到下方\n`);
    
    const apiKey = await question(`请输入 ${config.name} API Key (留空跳过): `);
    
    if (apiKey && apiKey.trim() !== '') {
      newKeys[key] = apiKey.trim();
      console.log(`✅ ${config.name} API Key 已保存`);
    } else {
      console.log(`⏭️  跳过 ${config.name}`);
    }
  }
  
  if (Object.keys(newKeys).length === 0) {
    console.log('\n⚠️  没有添加新的 API Key。');
    rl.close();
    return;
  }
  
  // Update .env file
  console.log('\n正在更新 .env 文件...');
  updateEnvFile(newKeys);
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   配置完成！                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('下一步：');
  console.log('1. 重启服务器: npm run dev');
  console.log('2. 测试去水印功能');
  console.log('3. 查看文档: IMAGE_EDITING_API_SETUP.md\n');
  
  rl.close();
};

main().catch(error => {
  console.error('❌ 配置过程出错:', error.message);
  rl.close();
  process.exit(1);
});

