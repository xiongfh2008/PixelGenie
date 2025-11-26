#!/usr/bin/env node

/**
 * 测试 Google Gemini API 的图像生成能力
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const testGoogleImageGeneration = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       测试 Google Gemini 图像生成能力                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 错误: 未找到 GOOGLE_API_KEY');
    process.exit(1);
  }

  console.log('✅ API Key 已配置\n');

  // 创建一个简单的测试图像 (1x1 白色像素的 JPEG)
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

  const models = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  for (const model of models) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🧪 测试模型: ${model}\n`);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const requestBody = {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: testImageBase64
              }
            },
            {
              text: 'Please edit this image and remove any watermarks. Return the edited image.'
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096
        }
      };

      console.log('📤 发送请求...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ API 错误 (HTTP ${response.status}):`, errorData.error?.message || JSON.stringify(errorData));
        continue;
      }

      const data = await response.json();
      
      console.log('📥 收到响应\n');
      console.log('响应结构:', JSON.stringify(data, null, 2).substring(0, 500) + '...\n');

      // 检查是否有图像数据
      let hasImageData = false;
      let hasTextData = false;

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              hasImageData = true;
              console.log('✅ 找到图像数据!');
              console.log(`   MIME 类型: ${part.inlineData.mimeType}`);
              console.log(`   数据长度: ${part.inlineData.data.length} 字符\n`);
              
              // 保存图像
              const outputPath = join(__dirname, `test-output-${model}.jpg`);
              fs.writeFileSync(outputPath, Buffer.from(part.inlineData.data, 'base64'));
              console.log(`   ✅ 图像已保存到: ${outputPath}\n`);
            }
            
            if (part.text) {
              hasTextData = true;
              console.log('📝 文本响应:', part.text.substring(0, 200) + '...\n');
            }
          }
        }
      }

      if (hasImageData) {
        console.log(`🎉 ${model} 支持图像生成/编辑!\n`);
      } else if (hasTextData) {
        console.log(`⚠️  ${model} 只返回文本，不支持图像生成\n`);
      } else {
        console.log(`❌ ${model} 响应格式未知\n`);
      }

    } catch (error) {
      console.error(`❌ 测试 ${model} 时出错:`, error.message);
      console.error('详细错误:', error);
    }
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log('测试完成！\n');
};

testGoogleImageGeneration().catch(error => {
  console.error('❌ 测试过程出错:', error);
  process.exit(1);
});

