# 🔄 故障转移系统集成指南

## 📋 快速开始

### 步骤 1: 了解新架构

新的智能故障转移系统由 3 个核心模块组成：

```
server/
├── api-failover.js      # 故障转移逻辑
├── api-health.js        # 健康状态管理
└── index.js             # 主服务器（需要集成）
```

### 步骤 2: 测试故障转移系统

```bash
cd server
node test-failover.js
```

**预期输出**：
```
🧪 测试智能故障转移系统
======================================================================

📝 测试 1: 基本故障转移
----------------------------------------------------------------------
   📞 Calling google API...
✅ 测试 1 通过
   Provider: google
   Attempts: 1
   Data: {"text":"Response from Google: Test query 1"}

📝 测试 2: 智能提供商选择
----------------------------------------------------------------------
   imageAnalysis: google
   imageModification: google
   textTranslation: google

✅ 测试 2 完成
...
```

---

## 🔧 集成到现有代码

### 方案 1: 完全替换（推荐用于新项目）

```bash
# 备份当前 index.js
cp server/index.js server/index.backup.js

# 使用新的实现
cp server/index-with-failover.js server/index.js

# 重启服务器
npm run dev:all
```

### 方案 2: 渐进式集成（推荐用于生产环境）

#### 2.1 导入模块

在 `server/index.js` 顶部添加：

```javascript
import { callWithFailover, parseApiResponse } from './api-failover.js';
import { selectApiProvider, updateApiHealth, getHealthReport } from './api-health.js';
```

#### 2.2 重构 API 调用函数

**原代码**（直接调用）：
```javascript
app.post('/api/analyze-image', async (req, res) => {
  try {
    const provider = selectApiProvider();
    const response = await fetch(url, options);
    // ... 处理响应
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**新代码**（使用故障转移）：
```javascript
// 1. 提取 API 调用逻辑为独立函数
async function analyzeImageWithProvider(provider, params) {
  const { parts, apiKeys } = params;
  // ... 构建请求
  const response = await fetch(url, options);
  // ... 返回结果
  return parsedData;
}

// 2. 在端点中使用故障转移
app.post('/api/analyze-image', async (req, res) => {
  try {
    const result = await callWithFailover(
      analyzeImageWithProvider,
      'imageAnalysis',
      { parts, apiKeys: getApiKeys() },
      3
    );
    
    res.json({
      ...result.data,
      _meta: {
        provider: result.provider,
        attempts: result.attempts
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 2.3 移除旧的健康状态代码

删除或注释掉 `server/index.js` 中的：
- `apiHealthStatus` 变量定义
- `updateApiHealth` 函数定义
- `selectApiProvider` 函数定义
- `detectApiKeyLeak` 函数定义

这些功能现在由 `api-health.js` 提供。

#### 2.4 更新所有 API 端点

需要更新的端点：
- `/api/analyze-image` - 智能鉴伪
- `/api/modify-image` - 去水印
- `/api/translate-image-text` - 文本翻译
- `/api/detect-text-translate` - 文本检测翻译

---

## 📝 详细集成步骤

### 步骤 1: 备份当前代码

```bash
cd server
cp index.js index.backup.js
```

### 步骤 2: 创建 API 调用函数

在 `server/index.js` 中添加（在端点定义之前）：

```javascript
/**
 * 图像分析 API 调用函数
 */
async function analyzeImageWithProvider(provider, params) {
  const { parts, apiKeys } = params;
  
  let url, requestBody, headers;
  
  switch (provider) {
    case 'google':
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
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
      url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;
      headers = {
        'Authorization': `Bearer ${apiKeys.cloudflare}`,
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
                image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
              };
            }
            return null;
          }).filter(Boolean)
        }],
        max_tokens: 4096
      };
      break;
      
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  const parsed = parseApiResponse(provider, data);
  
  if (!parsed.text) {
    throw new Error('No response from model');
  }
  
  return parsed.text;
}

/**
 * 图像修改 API 调用函数
 */
async function modifyImageWithProvider(provider, params) {
  // 只有 Google 支持
  if (provider !== 'google') {
    throw new Error(`Image modification not supported for provider: ${provider}`);
  }
  
  const { parts, apiKeys } = params;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.google}`;
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
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
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
```

### 步骤 3: 更新端点使用故障转移

**更新 `/api/analyze-image`**：

找到现有的 `/api/analyze-image` 端点，替换为：

```javascript
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;
    
    if (!originalBase64 || !elaBase64) {
      return res.status(400).json({ error: 'Missing required image data' });
    }
    
    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
      { inlineData: { mimeType: 'image/png', data: elaBase64 } }
    ];
    
    if (mfrBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
    }
    
    const langMap = {
      en: 'English',
      zh: 'Simplified Chinese (zh-CN)',
      // ... 其他语言
    };
    
    const targetLang = langMap[lang] || 'English';
    parts.push({
      text: `You are a Lead Digital Forensic Analyst... Output in ${targetLang}.`
    });
    
    const apiKeys = getApiKeys();
    
    // 🔄 使用故障转移
    const result = await callWithFailover(
      analyzeImageWithProvider,
      'imageAnalysis',
      { parts, apiKeys },
      3
    );
    
    // 解析 JSON
    let jsonString = result.data.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    
    const jsonData = JSON.parse(jsonString.trim());
    
    // 添加元数据
    jsonData._meta = {
      provider: result.provider,
      attempts: result.attempts,
      timestamp: new Date().toISOString()
    };
    
    res.json(jsonData);
    
  } catch (error) {
    console.error('Analyze image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze image'
    });
  }
});
```

**更新 `/api/modify-image`**：

```javascript
app.post('/api/modify-image', async (req, res) => {
  try {
    const { base64, mimeType, prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const parts = [];
    if (base64 && mimeType) {
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: base64 }
      });
    }
    parts.push({ text: prompt });
    
    const apiKeys = getApiKeys();
    
    // 🔄 使用故障转移
    const result = await callWithFailover(
      modifyImageWithProvider,
      'imageModification',
      { parts, apiKeys },
      3
    );
    
    res.json({
      imageData: result.data,
      _meta: {
        provider: result.provider,
        attempts: result.attempts
      }
    });
    
  } catch (error) {
    console.error('Modify image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to modify image'
    });
  }
});
```

### 步骤 4: 添加健康状态端点

```javascript
// 获取健康状态报告
app.get('/api/health-report', (req, res) => {
  const report = getHealthReport();
  res.json(report);
});

// 重置提供商健康状态
app.post('/api/reset-health-status', (req, res) => {
  const { provider } = req.body;
  
  if (!provider) {
    return res.status(400).json({ error: 'Provider parameter is required' });
  }
  
  resetProviderHealth(provider);
  
  res.json({
    success: true,
    message: `Health status reset for ${provider}`
  });
});
```

### 步骤 5: 测试集成

```bash
# 重启服务器
npm run dev:all

# 在另一个终端测试
cd server
node test-failover.js
```

---

## ✅ 验证清单

- [ ] 导入了 `api-failover.js` 和 `api-health.js`
- [ ] 创建了 API 调用函数（`analyzeImageWithProvider` 等）
- [ ] 更新了所有 API 端点使用 `callWithFailover`
- [ ] 移除了旧的健康状态管理代码
- [ ] 添加了健康状态端点
- [ ] 测试了故障转移功能
- [ ] 重启了服务器
- [ ] 验证了前端功能正常

---

## 🧪 测试方法

### 1. 单元测试

```bash
node server/test-failover.js
```

### 2. 集成测试

```bash
# 启动服务器
npm run dev:all

# 测试智能鉴伪
curl -X POST http://localhost:3001/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"originalBase64":"...","elaBase64":"..."}'

# 查看健康状态
curl http://localhost:3001/api/health-report
```

### 3. 前端测试

1. 打开浏览器访问 http://localhost:5173
2. 使用智能鉴伪功能上传图片
3. 打开浏览器控制台（F12）
4. 查看 Network 标签页
5. 检查响应中的 `_meta` 字段：
   ```json
   {
     "_meta": {
       "provider": "google",
       "attempts": 1,
       "timestamp": "2025-11-26T..."
     }
   }
   ```

---

## 📊 监控和调试

### 查看日志

服务器日志会显示故障转移过程：

```
🔄 Attempt 1/3: Using provider google for imageAnalysis
✅ Success with provider: google
```

或

```
🔄 Attempt 1/3: Using provider google for imageModification
❌ Error with provider google: API key was reported as leaked
🔄 Switching to next available provider...
🔄 Attempt 2/3: Using provider cloudflare for imageModification
✅ Success with provider: cloudflare
```

### 健康状态报告

```bash
curl http://localhost:3001/api/health-report
```

**响应示例**：
```json
{
  "timestamp": "2025-11-26T...",
  "providers": {
    "google": {
      "healthy": true,
      "errorCount": 0,
      "leaked": false,
      "lastCheck": "2025-11-26T...",
      "lastError": null
    },
    "cloudflare": {
      "healthy": true,
      "errorCount": 0,
      "leaked": false,
      "lastCheck": "2025-11-26T...",
      "lastError": null
    }
  }
}
```

---

## 🎯 常见问题

### Q1: 如何强制使用特定提供商？

A: 暂时禁用其他提供商：

```javascript
// 临时标记其他提供商为不健康
updateApiHealth('cloudflare', false);
updateApiHealth('huggingface', false);

// 现在只会使用 Google
const result = await callWithFailover(...);
```

### Q2: 如何调整重试次数？

A: 修改 `callWithFailover` 的第 4 个参数：

```javascript
// 最多重试 5 次
await callWithFailover(fn, capability, params, 5);

// 不重试（只尝试 1 次）
await callWithFailover(fn, capability, params, 1);
```

### Q3: 如何添加新的 API 提供商？

A: 在 `api-health.js` 中添加：

```javascript
// 1. 添加到健康状态
apiHealthStatus.newProvider = { healthy: true, lastCheck: Date.now(), errorCount: 0 };

// 2. 添加到能力支持
capabilitySupport.imageAnalysis.push('newProvider');

// 3. 添加到优先级组
backupProviders.push('newProvider');

// 4. 在 API 调用函数中添加处理逻辑
```

---

## 🎊 完成！

恭喜！您已成功集成智能故障转移系统。

**下一步**：
1. 测试所有功能
2. 监控健康状态
3. 根据需要调整配置
4. 享受企业级可靠性！

**参考文档**：
- `INTELLIGENT_FAILOVER_SYSTEM.md` - 系统详细说明
- `server/api-failover.js` - 故障转移实现
- `server/api-health.js` - 健康状态管理
- `server/test-failover.js` - 测试脚本
