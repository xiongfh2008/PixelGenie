#!/usr/bin/env node

/**
 * 测试图像编辑 API 集成
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import {
  editImageWithBestApi,
  selectImageEditingApi
} from './image-editing-apis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const testImageEditing = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       测试图像编辑 API 集成                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Collect API keys
  const apiKeys = {
    clipdrop: process.env.CLIPDROP_API_KEY,
    removebg: process.env.REMOVEBG_API_KEY,
    replicate: process.env.REPLICATE_API_KEY,
    stability: process.env.STABILITY_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY
  };

  // Check which APIs are configured
  console.log('📋 检查已配置的 API:\n');
  
  const configuredApis = [];
  for (const [provider, key] of Object.entries(apiKeys)) {
    if (key && key.trim() !== '') {
      console.log(`✅ ${provider.toUpperCase()}: ${key.substring(0, 10)}...`);
      configuredApis.push(provider);
    } else {
      console.log(`⚪ ${provider.toUpperCase()}: 未配置`);
    }
  }

  if (configuredApis.length === 0) {
    console.log('\n❌ 错误: 没有配置任何图像编辑 API');
    console.log('\n请运行以下命令配置 API:');
    console.log('   node server/setup-image-editing-api.js');
    console.log('\n或手动编辑 server/.env 文件添加 API Key');
    console.log('详细说明请参考: IMAGE_EDITING_API_SETUP.md\n');
    process.exit(1);
  }

  console.log(`\n✅ 已配置 ${configuredApis.length} 个 API\n`);

  // Select best API
  try {
    const selectedApi = selectImageEditingApi(apiKeys);
    console.log(`🎯 选择的 API: ${selectedApi.toUpperCase()}\n`);
  } catch (error) {
    console.error('❌ 选择 API 失败:', error.message);
    process.exit(1);
  }

  // Create a simple test image (1x1 white pixel)
  const testImageBase64 = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
    0x37, 0xFF, 0xD9
  ]).toString('base64');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🧪 测试 1: 基本 API 调用\n');

  try {
    console.log('正在调用图像编辑 API...');
    
    const result = await editImageWithBestApi(
      testImageBase64,
      'Remove watermark from this image',
      apiKeys
    );

    console.log('\n✅ API 调用成功!');
    console.log(`   提供商: ${result.provider}`);
    console.log(`   返回数据类型: ${result.imageData ? 'base64' : result.imageUrl ? 'URL' : 'unknown'}`);
    
    if (result.imageData) {
      console.log(`   图像数据长度: ${result.imageData.length} 字符`);
      
      // Save result to file
      const outputPath = join(__dirname, 'test-output.jpg');
      fs.writeFileSync(outputPath, Buffer.from(result.imageData, 'base64'));
      console.log(`   ✅ 结果已保存到: ${outputPath}`);
    } else if (result.imageUrl) {
      console.log(`   图像 URL: ${result.imageUrl}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ 所有测试通过!\n');
    console.log('下一步:');
    console.log('1. 重启服务器: npm run dev');
    console.log('2. 在前端测试去水印功能');
    console.log('3. 查看详细文档: IMAGE_EDITING_API_SETUP.md\n');

  } catch (error) {
    console.error('\n❌ API 调用失败:', error.message);
    console.error('\n可能的原因:');
    console.error('1. API Key 无效或已过期');
    console.error('2. 网络连接问题');
    console.error('3. API 配额已用完');
    console.error('4. API 服务暂时不可用\n');
    console.error('详细错误信息:');
    console.error(error);
    console.log('\n请检查:');
    console.log('1. API Key 是否正确配置在 server/.env 文件中');
    console.log('2. 网络连接是否正常');
    console.log('3. API 提供商的服务状态\n');
    process.exit(1);
  }
};

// Run test
testImageEditing().catch(error => {
  console.error('❌ 测试过程出错:', error);
  process.exit(1);
});

