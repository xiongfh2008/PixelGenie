# 🔧 智能 API 切换机制 - 集成指南

## 📋 快速开始

### 步骤 1: 理解现有代码结构

当前代码在每个端点中单独处理 API 调用，例如：

```javascript
// 当前方式（server/index.js）
app.post('/api/analyze-image', async (req, res) => {
  try {
    const provider = selectApiProvider();
    
    // 构建请求
    const url = buildUrl(provider);
    const response = await fetch(url, options);
    
    // 如果失败，返回错误
    if (!response.ok) {
      return res.status(500).json({ error: 'API failed' });
    }
    
    // 返回结果
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**问题**: 一旦失败，直接返回错误给用户，没有自动重试或切换。

---

### 步骤 2: 集成智能重试机制

#### 方案 A: 最小改动（推荐用于快速集成）

只需在现有代码外层包装一个重试循环：

```javascript
app.post('/api/analyze-image', async (req, res) => {
  const maxRetries = 3;
  const triedProviders = new Set();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 选择提供商（自动排除已失败的）
      const provider = selectApiProvider();
      
      if (triedProviders.has(provider)) {
        // 临时标记为不健康，强制选择下一个
        apiHealthStatus[provider].healthy = false;
        continue;
      }
      
      triedProviders.add(provider);
      console.log(`🔄 Attempt ${attempt}/${maxRetries} with ${provider}`);
      
      // 原有的 API 调用逻辑
      const url = buildUrl(provider);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        updateApiHealth(provider, false);
        if (attempt < maxRetries) continue;
        throw new Error('API failed');
      }
      
      // 成功！
      updateApiHealth(provider, true);
      console.log(`✅ Success with ${provider}`);
      return res.json(data);
      
    } catch (error) {
      if (attempt === maxRetries) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
});
```

**优点**: 
- ✅ 改动最小
- ✅ 易于理解
- ✅ 快速实现

**缺点**:
- ⚠️ 代码重复
- ⚠️ 每个端点都需要修改

---

#### 方案 B: 使用统一的请求处理器（推荐用于长期维护）

使用我创建的 `api-request-handler.js`：

```javascript
import { executeApiRequest } from './api-request-handler.js';

app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64, lang } = req.body;
    
    // 准备请求数据
    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
      { inlineData: { mimeType: 'image/png', data: elaBase64 } }
    ];
    
    // 执行带智能重试的请求
    const result = await executeApiRequest({
      requestData: { parts },
      requiredCapability: 'imageAnalysis',
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      getApiKeys,
      buildRequestConfig: (provider, data, keys) => {
        // 根据提供商构建请求配置
        // ... (见完整示例)
      },
      parseResponse: (provider, data) => {
        // 解析响应
        // ... (见完整示例)
      },
      maxRetries: 3
    });
    
    // 返回成功结果
    res.json(result.data);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**优点**:
- ✅ 代码复用
- ✅ 统一错误处理
- ✅ 易于维护
- ✅ 完整的日志记录

**缺点**:
- ⚠️ 需要重构现有代码
- ⚠️ 学习曲线稍高

---

### 步骤 3: 选择集成方案

#### 如果您想快速实现（1-2小时）
→ **选择方案 A**

1. 复制重试循环代码
2. 在每个端点外层包装
3. 测试验证

#### 如果您想长期维护（半天）
→ **选择方案 B**

1. 使用 `api-request-handler.js`
2. 为每个端点创建配置函数
3. 重构现有端点
4. 全面测试

---

## 🎯 具体实现步骤

### 方案 A 详细步骤

#### 1. 创建重试包装函数

```javascript
// 在 server/index.js 顶部添加
async function executeWithRetry(apiCallFn, maxRetries = 3) {
  const triedProviders = new Set();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const provider = selectApiProvider();
      
      // 避免重复尝试
      if (triedProviders.has(provider)) {
        const originalHealthy = apiHealthStatus[provider].healthy;
        apiHealthStatus[provider].healthy = false;
        
        try {
          const nextProvider = selectApiProvider();
          apiHealthStatus[provider].healthy = originalHealthy;
          provider = nextProvider;
        } catch (e) {
          apiHealthStatus[provider].healthy = originalHealthy;
          throw e;
        }
      }
      
      triedProviders.add(provider);
      
      if (attempt > 1) {
        console.log(`🔄 Retry ${attempt}/${maxRetries} with ${provider}`);
      }
      
      // 执行 API 调用
      const result = await apiCallFn(provider);
      
      // 成功
      updateApiHealth(provider, true);
      console.log(`✅ Success with ${provider}`);
      
      return { success: true, data: result, provider };
      
    } catch (error) {
      const currentProvider = Array.from(triedProviders).pop();
      console.error(`❌ ${currentProvider} failed:`, error.message);
      
      if (currentProvider) {
        updateApiHealth(currentProvider, false, error.message);
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 短暂延迟后重试
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
```

#### 2. 修改现有端点

```javascript
// 原有代码
app.post('/api/analyze-image', async (req, res) => {
  try {
    const provider = selectApiProvider();
    // ... API 调用
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 修改后
app.post('/api/analyze-image', async (req, res) => {
  try {
    const result = await executeWithRetry(async (provider) => {
      // 将原有的 API 调用逻辑移到这里
      // ... API 调用
      return data;
    });
    
    res.json(result.data);
    res.set('X-API-Provider', result.provider);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 3. 测试验证

```bash
# 禁用主 API 测试切换
cd server
node disable-google-api.js

# 发送测试请求
curl -X POST http://localhost:3001/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"originalBase64":"...","elaBase64":"..."}'

# 查看日志，应该看到自动切换
```

---

### 方案 B 详细步骤

#### 1. 导入请求处理器

```javascript
// 在 server/index.js 顶部
import { executeApiRequest } from './api-request-handler.js';
```

#### 2. 创建配置函数

```javascript
// 为图像分析创建配置函数
function buildAnalyzeImageConfig(provider, requestData, apiKeys) {
  const { parts } = requestData;
  
  switch (provider) {
    case 'google':
      return {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        headers: {
          'X-goog-api-key': apiKeys.google,
          'Content-Type': 'application/json'
        },
        requestBody: {
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096
          }
        }
      };
      
    case 'cloudflare':
      return {
        url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
        headers: {
          'Authorization': `Bearer ${apiKeys.cloudflare}`,
          'Content-Type': 'application/json'
        },
        requestBody: {
          messages: [{
            role: 'user',
            content: parts.map(part => {
              if (part.text) return { type: 'text', text: part.text };
              if (part.inlineData) {
                return {
                  type: 'image_url',
                  image_url: {
                    url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                  }
                };
              }
              return null;
            }).filter(Boolean)
          }],
          max_tokens: 4096
        }
      };
      
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function parseAnalyzeImageResponse(provider, data) {
  let text;
  
  switch (provider) {
    case 'google':
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      break;
    case 'cloudflare':
      text = data.result?.response || data.result?.content;
      break;
    default:
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  }
  
  if (!text) {
    throw new Error('No response from model');
  }
  
  // 提取 JSON
  let jsonString = text.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.substring(7);
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.substring(0, jsonString.length - 3);
  }
  
  return JSON.parse(jsonString.trim());
}
```

#### 3. 重构端点

```javascript
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64, mfrBase64, lang } = req.body;
    
    // 参数验证
    if (!originalBase64 || !elaBase64) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    // 准备请求数据
    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
      { inlineData: { mimeType: 'image/png', data: elaBase64 } }
    ];
    
    if (mfrBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
    }
    
    const prompt = `Analyze this image...`; // 完整的提示词
    parts.push({ text: prompt });
    
    // 执行带智能重试的请求
    const result = await executeApiRequest({
      requestData: { parts },
      requiredCapability: 'imageAnalysis',
      selectApiProvider,
      updateApiHealth,
      apiHealthStatus,
      getApiKeys,
      buildRequestConfig: buildAnalyzeImageConfig,
      parseResponse: parseAnalyzeImageResponse,
      maxRetries: 3
    });
    
    // 返回结果
    res.json(result.data);
    res.set('X-API-Provider', result.provider);
    res.set('X-API-Attempts', result.attempts.toString());
    
  } catch (error) {
    console.error('Analyze image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze image'
    });
  }
});
```

#### 4. 对其他端点重复步骤 2-3

---

## 📊 对比表

| 特性 | 方案 A（快速） | 方案 B（完整） |
|------|---------------|---------------|
| 实现时间 | 1-2 小时 | 半天 |
| 代码复用 | ❌ 低 | ✅ 高 |
| 维护成本 | ⚠️ 中等 | ✅ 低 |
| 功能完整性 | ⚠️ 基础 | ✅ 完整 |
| 日志记录 | ⚠️ 基础 | ✅ 详细 |
| 错误处理 | ⚠️ 基础 | ✅ 完善 |
| 推荐场景 | 快速验证 | 生产环境 |

---

## 🧪 测试清单

### 功能测试

- [ ] 正常请求（主 API 可用）
- [ ] 主 API 失败，自动切换到备用
- [ ] 多个 API 连续失败
- [ ] 所有 API 都失败
- [ ] 网络超时处理
- [ ] 并发请求处理

### 性能测试

- [ ] 正常延迟（< 3秒）
- [ ] 切换延迟（< 5秒）
- [ ] 内存使用正常
- [ ] CPU 使用正常

### 日志测试

- [ ] 成功请求日志
- [ ] 切换事件日志
- [ ] 错误详情日志
- [ ] 健康状态更新日志

---

## 📝 集成检查清单

### 准备阶段

- [ ] 阅读 `SMART_API_SWITCHING.md`
- [ ] 理解现有代码结构
- [ ] 选择集成方案（A 或 B）
- [ ] 备份现有代码

### 实现阶段

- [ ] 创建/导入重试逻辑
- [ ] 修改第一个端点
- [ ] 测试第一个端点
- [ ] 修改其他端点
- [ ] 全面测试

### 验证阶段

- [ ] 功能测试通过
- [ ] 性能测试通过
- [ ] 日志正常输出
- [ ] 用户体验良好

### 部署阶段

- [ ] 代码审查
- [ ] 更新文档
- [ ] 部署到测试环境
- [ ] 部署到生产环境

---

## 🎯 推荐方案

### 如果您是第一次实现
→ **先用方案 A 快速验证效果**

1. 用 1-2 小时实现基础版本
2. 测试验证效果
3. 如果效果好，再考虑升级到方案 B

### 如果您要部署到生产环境
→ **直接使用方案 B**

1. 投入半天时间完整实现
2. 获得更好的代码质量
3. 长期维护成本更低

---

## 📚 相关文件

- `SMART_API_SWITCHING.md` - 完整功能说明
- `server/api-request-handler.js` - 核心实现（方案 B）
- `server/index-with-smart-retry.js` - 完整示例
- `server/smart-api-retry.js` - 辅助函数

---

## 🆘 常见问题

### Q1: 如何测试自动切换？

```bash
# 临时禁用主 API
cd server && node disable-google-api.js

# 发送请求，观察日志
curl -X POST http://localhost:3001/api/analyze-image ...
```

### Q2: 如何调整重试次数？

```javascript
// 方案 A
const maxRetries = 5; // 改为 5 次

// 方案 B
maxRetries: 5 // 在 executeApiRequest 中设置
```

### Q3: 如何添加自定义日志？

```javascript
// 在重试循环中添加
console.log(`[Custom] Attempt ${attempt} with ${provider}`);
```

### Q4: 性能影响有多大？

- 正常情况：0ms 额外开销
- 单次切换：~500-1000ms
- 多次重试：~1000-2000ms

---

**选择适合您的方案，开始集成智能 API 切换机制吧！** 🚀

