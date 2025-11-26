#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const listModels = async () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  console.log('\n📋 可用的 Gemini 模型列表:\n');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  
  if (data.models) {
    data.models.forEach(model => {
      console.log(`- ${model.name}`);
      console.log(`  显示名称: ${model.displayName || 'N/A'}`);
      console.log(`  支持的方法: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('');
    });
  }
};

listModels().catch(console.error);

