/**
 * 自动集成智能故障转移系统到现有 server/index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const indexPath = path.join(__dirname, 'index.js');
const backupPath = path.join(__dirname, 'index.backup.js');

console.log('\n🔄 开始集成智能故障转移系统\n');
console.log('='.repeat(70));

// 步骤 1: 备份原文件
console.log('\n📦 步骤 1: 备份原文件...');
try {
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, backupPath);
    console.log(`✅ 已备份到: ${backupPath}`);
  } else {
    console.error('❌ 找不到 server/index.js');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 备份失败:', error.message);
  process.exit(1);
}

// 步骤 2: 读取原文件
console.log('\n📖 步骤 2: 读取原文件...');
let content;
try {
  content = fs.readFileSync(indexPath, 'utf-8');
  console.log(`✅ 文件大小: ${content.length} 字节`);
} catch (error) {
  console.error('❌ 读取失败:', error.message);
  process.exit(1);
}

// 步骤 3: 检查是否已集成
console.log('\n🔍 步骤 3: 检查是否已集成...');
if (content.includes('api-failover.js') || content.includes('callWithFailover')) {
  console.log('⚠️  检测到已集成故障转移系统');
  console.log('   如需重新集成，请先恢复备份：');
  console.log('   cp server/index.backup.js server/index.js');
  process.exit(0);
}
console.log('✅ 未检测到集成，可以继续');

// 步骤 4: 添加导入语句
console.log('\n📝 步骤 4: 添加导入语句...');
const importStatement = `import { callWithFailover, parseApiResponse } from './api-failover.js';
import { selectApiProvider, updateApiHealth, getHealthReport, resetProviderHealth } from './api-health.js';
`;

// 在第一个 import 之后添加
const firstImportIndex = content.indexOf('import');
if (firstImportIndex !== -1) {
  const firstImportEnd = content.indexOf('\n', firstImportIndex) + 1;
  content = content.slice(0, firstImportEnd) + importStatement + content.slice(firstImportEnd);
  console.log('✅ 已添加导入语句');
} else {
  console.error('❌ 找不到 import 语句');
  process.exit(1);
}

// 步骤 5: 移除旧的健康状态代码
console.log('\n🗑️  步骤 5: 移除旧的健康状态代码...');

// 查找并注释掉旧的 apiHealthStatus 定义
const healthStatusRegex = /let apiHealthStatus = \{[\s\S]*?\};/g;
if (healthStatusRegex.test(content)) {
  content = content.replace(healthStatusRegex, (match) => {
    return `// [已移除] 旧的健康状态管理，现在由 api-health.js 提供\n// ${match.replace(/\n/g, '\n// ')}`;
  });
  console.log('✅ 已移除旧的 apiHealthStatus 定义');
}

// 查找并注释掉旧的函数定义
const functionsToRemove = [
  'function detectApiKeyLeak',
  'function updateApiHealth',
  'function selectApiProvider'
];

for (const funcName of functionsToRemove) {
  const funcRegex = new RegExp(`${funcName}[\\s\\S]*?\\n\\}`, 'g');
  if (funcRegex.test(content)) {
    content = content.replace(funcRegex, (match) => {
      return `// [已移除] ${funcName}，现在由 api-health.js 提供\n// ${match.replace(/\n/g, '\n// ')}`;
    });
    console.log(`✅ 已移除 ${funcName}`);
  }
}

// 步骤 6: 添加 API 调用函数
console.log('\n📝 步骤 6: 添加 API 调用函数...');

const apiCallFunctions = `
/**
 * 图像分析 API 调用函数（支持自动故障转移）
 */
async function analyzeImageWithProvider(provider, params) {
  const { parts, apiKeys } = params;
  
  let url, requestBody, headers;
  
  switch (provider) {
    case 'google':
      url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent\`;
      headers = {
        'X-goog-api-key': apiKeys.google,
        'Content-Type': 'application/json'
      };
      requestBody = {
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
      };
      break;
      
    case 'cloudflare':
      url = \`https://api.cloudflare.com/client/v4/accounts/\${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct\`;
      headers = {
        'Authorization': \`Bearer \${apiKeys.cloudflare}\`,
        'Content-Type': 'application/json'
      };
      requestBody = {
        messages: [{
          role: 'user',
          content: parts.map(part => {
            if (part.text) return { type: 'text', text: part.text };
            if (part.inlineData) {
              return {
                type: 'image_url',
                image_url: { url: \`data:\${part.inlineData.mimeType};base64,\${part.inlineData.data}\` }
              };
            }
            return null;
          }).filter(Boolean)
        }],
        max_tokens: 4096
      };
      break;
      
    default:
      throw new Error(\`Unsupported provider: \${provider}\`);
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || \`HTTP \${response.status}\`);
  }
  
  const data = await response.json();
  const parsed = parseApiResponse(provider, data);
  
  if (!parsed.text) {
    throw new Error('No response from model');
  }
  
  return parsed.text;
}

/**
 * 图像修改 API 调用函数（支持自动故障转移）
 */
async function modifyImageWithProvider(provider, params) {
  if (provider !== 'google') {
    throw new Error(\`Image modification not supported for provider: \${provider}\`);
  }
  
  const { parts, apiKeys } = params;
  
  const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${apiKeys.google}\`;
  const headers = {
    'X-goog-api-key': apiKeys.google,
    'Content-Type': 'application/json'
  };
  const requestBody = { contents: [{ parts }] };
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || \`HTTP \${response.status}\`);
  }
  
  const data = await response.json();
  
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
  }
  
  throw new Error('No image generated in response');
}
`;

// 在第一个 app.post 之前添加
const firstAppPostIndex = content.indexOf('app.post(');
if (firstAppPostIndex !== -1) {
  content = content.slice(0, firstAppPostIndex) + apiCallFunctions + '\n' + content.slice(firstAppPostIndex);
  console.log('✅ 已添加 API 调用函数');
} else {
  console.error('❌ 找不到 app.post 语句');
  process.exit(1);
}

// 步骤 7: 添加健康状态端点
console.log('\n📝 步骤 7: 添加健康状态端点...');

const healthEndpoints = `
// 健康状态报告端点
app.get('/api/health-report', (req, res) => {
  const report = getHealthReport();
  res.json(report);
});

// 重置提供商健康状态端点
app.post('/api/reset-health-status', (req, res) => {
  const { provider } = req.body;
  
  if (!provider) {
    return res.status(400).json({ error: 'Provider parameter is required' });
  }
  
  resetProviderHealth(provider);
  
  res.json({
    success: true,
    message: \`Health status reset for \${provider}\`
  });
});
`;

// 在 app.listen 之前添加
const appListenIndex = content.indexOf('app.listen(');
if (appListenIndex !== -1) {
  content = content.slice(0, appListenIndex) + healthEndpoints + '\n' + content.slice(appListenIndex);
  console.log('✅ 已添加健康状态端点');
} else {
  console.error('❌ 找不到 app.listen 语句');
  process.exit(1);
}

// 步骤 8: 写入文件
console.log('\n💾 步骤 8: 写入更新后的文件...');
try {
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.log('✅ 文件已更新');
} catch (error) {
  console.error('❌ 写入失败:', error.message);
  console.log('\n⚠️  正在恢复备份...');
  fs.copyFileSync(backupPath, indexPath);
  console.log('✅ 已恢复备份');
  process.exit(1);
}

// 完成
console.log('\n' + '='.repeat(70));
console.log('🎉 智能故障转移系统集成完成！');
console.log('='.repeat(70));

console.log('\n📋 下一步：');
console.log('   1. 查看更改: git diff server/index.js');
console.log('   2. 测试系统: node server/test-failover.js');
console.log('   3. 重启服务器: npm run dev:all');
console.log('   4. 如有问题，恢复备份: cp server/index.backup.js server/index.js');

console.log('\n📚 参考文档：');
console.log('   - INTELLIGENT_FAILOVER_SYSTEM.md');
console.log('   - FAILOVER_INTEGRATION_GUIDE.md');

console.log('\n✨ 现在您的系统拥有企业级的智能故障转移能力！\n');

