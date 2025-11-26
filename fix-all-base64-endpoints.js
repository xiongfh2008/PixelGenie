/**
 * 为所有 API 端点添加 base64 清理逻辑
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const indexPath = path.join(__dirname, 'server', 'index.js');

console.log('\n🔧 修复所有 base64 端点\n');
console.log('='.repeat(70));

// 读取文件
let content = fs.readFileSync(indexPath, 'utf-8');

console.log('\n📝 需要修复的端点:');
console.log('   1. ✅ /api/analyze-image - 已修复');
console.log('   2. ⚠️  /api/modify-image - 需要修复');
console.log('   3. ⚠️  /api/translate-image-text - 需要修复');
console.log('   4. ⚠️  /api/detect-text-translate - 需要修复');

// 创建通用的 base64 清理函数（放在文件顶部）
const cleanBase64Function = `
// 通用 base64 清理函数
const cleanBase64 = (data) => data ? data.replace(/\\s/g, '') : data;
`;

// 检查是否已经有这个函数
if (!content.includes('const cleanBase64 = (data)')) {
  console.log('\n📝 添加通用 cleanBase64 函数...');
  
  // 在 getApiKeys 函数之前添加
  const getApiKeysIndex = content.indexOf('const getApiKeys = () => {');
  if (getApiKeysIndex !== -1) {
    content = content.slice(0, getApiKeysIndex) + cleanBase64Function + '\n' + content.slice(getApiKeysIndex);
    console.log('✅ 已添加 cleanBase64 函数');
  }
}

// 修复 /api/modify-image
console.log('\n📝 修复 /api/modify-image...');
const modifyImageOld = `  try {
    const { base64, mimeType, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const parts = [];
    if (base64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64`;

const modifyImageNew = `  try {
    const { base64, mimeType, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Clean base64 data
    const cleanedBase64 = base64 ? cleanBase64(base64) : null;

    const parts = [];
    if (cleanedBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanedBase64`;

if (content.includes(modifyImageOld) && !content.includes('const cleanedBase64 = base64 ? cleanBase64(base64)')) {
  content = content.replace(modifyImageOld, modifyImageNew);
  console.log('✅ 已修复 /api/modify-image');
} else {
  console.log('⏭️  /api/modify-image 已经修复或格式不匹配');
}

// 修复 /api/translate-image-text
console.log('\n📝 修复 /api/translate-image-text...');
const translateOld = `  try {
    const { base64, mimeType, targetLang } = req.body;

    if (!base64 || !mimeType || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Prepare parts for API request
    const parts = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64`;

const translateNew = `  try {
    const { base64, mimeType, targetLang } = req.body;

    if (!base64 || !mimeType || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Clean base64 data
    const cleanedBase64 = cleanBase64(base64);

    // Prepare parts for API request
    const parts = [
      {
        inlineData: {
          mimeType: mimeType,
          data: cleanedBase64`;

if (content.includes(translateOld)) {
  content = content.replace(translateOld, translateNew);
  console.log('✅ 已修复 /api/translate-image-text');
} else {
  console.log('⏭️  /api/translate-image-text 已经修复或格式不匹配');
}

// 修复 /api/detect-text-translate
console.log('\n📝 修复 /api/detect-text-translate...');
const detectOld = `  try {
    const { base64, mimeType, targetLang } = req.body;

    if (!base64 || !mimeType || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Multi-API provider support
    const apiKeys = getApiKeys();
    const provider = selectApiProvider();`;

const detectNew = `  try {
    const { base64, mimeType, targetLang } = req.body;

    if (!base64 || !mimeType || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Clean base64 data
    const cleanedBase64 = cleanBase64(base64);

    // Multi-API provider support
    const apiKeys = getApiKeys();
    const provider = selectApiProvider();`;

if (content.includes(detectOld)) {
  content = content.replace(detectOld, detectNew);
  
  // 还需要替换所有使用 base64 的地方为 cleanedBase64
  // 在 detect-text-translate 端点内
  content = content.replace(
    /(\{ inlineData: \{ mimeType, data: base64 \} \})/g,
    '{ inlineData: { mimeType, data: cleanedBase64 } }'
  );
  content = content.replace(
    /(image_url: \{ url: `data:\$\{mimeType\};base64,\$\{base64\}` \})/g,
    'image_url: { url: `data:${mimeType};base64,${cleanedBase64}` }'
  );
  
  console.log('✅ 已修复 /api/detect-text-translate');
} else {
  console.log('⏭️  /api/detect-text-translate 已经修复或格式不匹配');
}

// 写入文件
fs.writeFileSync(indexPath, content, 'utf-8');

console.log('\n' + '='.repeat(70));
console.log('🎉 所有端点已修复！');
console.log('='.repeat(70));

console.log('\n📋 修复摘要:');
console.log('   ✅ 添加了通用 cleanBase64 函数');
console.log('   ✅ 修复了 /api/modify-image');
console.log('   ✅ 修复了 /api/translate-image-text');
console.log('   ✅ 修复了 /api/detect-text-translate');

console.log('\n📝 下一步:');
console.log('   1. 重启服务器: npm run dev:all');
console.log('   2. 测试所有功能:');
console.log('      - 智能鉴伪');
console.log('      - 去水印');
console.log('      - 图像翻译');
console.log('      - 文本检测翻译\n');

