#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const testGemini25FlashImage = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       测试 Gemini 2.5 Flash Image 图像生成能力            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 错误: 未找到 GOOGLE_API_KEY');
    process.exit(1);
  }

  console.log('✅ API Key 已配置\n');

  // 创建测试图像
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

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试 1: 图像编辑（去水印）\n');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
    
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
            text: 'Please edit this image and remove any watermarks or text overlays. Return the edited image without any watermarks.'
          }
        ]
      }]
    };

    console.log('📤 发送请求到 gemini-2.5-flash-image...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API 错误 (HTTP ${response.status}):`, JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('📥 收到响应\n');

    // 检查响应结构
    let hasImageData = false;
    let hasTextData = false;

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      console.log('响应候选数量:', data.candidates.length);
      console.log('完成原因:', candidate.finishReason);
      console.log('');
      
      if (candidate.content && candidate.content.parts) {
        console.log('响应部分数量:', candidate.content.parts.length);
        console.log('');
        
        for (let i = 0; i < candidate.content.parts.length; i++) {
          const part = candidate.content.parts[i];
          console.log(`部分 ${i + 1}:`);
          
          if (part.inlineData && part.inlineData.data) {
            hasImageData = true;
            console.log('  ✅ 类型: 图像数据');
            console.log(`  MIME 类型: ${part.inlineData.mimeType}`);
            console.log(`  数据长度: ${part.inlineData.data.length} 字符`);
            
            // 保存图像
            const outputPath = join(__dirname, 'test-gemini-2.5-flash-image-output.jpg');
            fs.writeFileSync(outputPath, Buffer.from(part.inlineData.data, 'base64'));
            console.log(`  ✅ 图像已保存到: ${outputPath}`);
          }
          
          if (part.text) {
            hasTextData = true;
            console.log('  📝 类型: 文本');
            console.log(`  内容: ${part.text.substring(0, 200)}${part.text.length > 200 ? '...' : ''}`);
          }
          
          console.log('');
        }
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (hasImageData) {
      console.log('🎉 成功！gemini-2.5-flash-image 支持图像生成/编辑！\n');
      console.log('✅ 去水印功能可以使用这个模型！\n');
    } else if (hasTextData) {
      console.log('⚠️  gemini-2.5-flash-image 只返回文本，不支持图像生成\n');
      console.log('需要使用其他图像编辑 API（ClipDrop、Remove.bg 等）\n');
    } else {
      console.log('❌ 响应格式未知\n');
      console.log('完整响应:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试 2: 纯文本生成图像\n');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [
          {
            text: 'Generate a simple red circle on a white background.'
          }
        ]
      }]
    };

    console.log('📤 发送纯文本请求...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API 错误 (HTTP ${response.status}):`, JSON.stringify(errorData, null, 2));
    } else {
      const data = await response.json();
      
      console.log('📥 收到响应\n');
      
      let hasImageData = false;
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              hasImageData = true;
              console.log('✅ 纯文本也可以生成图像！');
              
              const outputPath = join(__dirname, 'test-gemini-text-to-image.jpg');
              fs.writeFileSync(outputPath, Buffer.from(part.inlineData.data, 'base64'));
              console.log(`✅ 图像已保存到: ${outputPath}`);
            }
          }
        }
      }
      
      if (!hasImageData) {
        console.log('⚠️  纯文本不能生成图像');
      }
    }

  } catch (error) {
    console.error('❌ 测试 2 失败:', error.message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('测试完成！\n');
};

testGemini25FlashImage().catch(error => {
  console.error('❌ 测试过程出错:', error);
  process.exit(1);
});

