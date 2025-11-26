# 🔧 实现自动故障转移 - 快速指南

## 📋 概述

本指南说明如何将现有的 API 端点升级为支持自动故障转移的版本。

---

## ✅ 已完成的工作

### 1. 核心组件

- ✅ `server/api-handlers.js` - 故障转移处理器
- ✅ `server/index.js` - 更新了 `selectApiProvider` 函数
- ✅ `AUTO_FAILOVER_SYSTEM.md` - 完整文档

### 2. 关键改进

#### 更新的 `selectApiProvider` 函数

```javascript
// 旧版本
const provider = selectApiProvider('imageAnalysis');

// 新版本 - 支持排除已失败的提供商
const provider = selectApiProvider('imageAnalysis', ['google', 'xunfei']);
```

**新增参数**:
- `excludeProviders`: 要排除的提供商列表（用于故障转移）

---

## 🚀 快速实现

### 方案 1: 使用 `executeWithAutoFailover` 函数（推荐）

这是最简单的方式，适用于大多数场景。

#### 示例：图像分析端点

```javascript
import { executeWithAutoFailover } from './api-handlers.js';

app.post('/api/analyze-image', async (req, res) => {
  const { originalBase64, elaBase64, mfrBase64 } = req.body;

  // 构建请求函数
  const buildRequest = async (provider, apiKeys) => {
    // 根据提供商构建不同的请求
    let url, requestBody, headers = { 'Content-Type': 'application/json' };
    
    switch (provider) {
      case 'google':
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
        headers['X-goog-api-key'] = apiKeys.google;
        requestBody = { /* ... */ };
        break;
      
      case 'cloudflare':
        url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;
        headers['Authorization'] = `Bearer ${apiKeys.cloudflare}`;
        requestBody = { /* ... */ };
        break;
    }
    
    return { url, requestBody, headers };
  };

  // 处理响应函数
  const processResponse = async (data, provider) => {
    // 根据提供商解析不同的响应格式
    let text;
    if (provider === 'google') {
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (provider === 'cloudflare') {
      text = data.result?.response;
    }
    
    if (!text) throw new Error('No response from model');
    
    // 解析 JSON
    return JSON.parse(text.trim());
  };

  // 执行带故障转移的请求
  await executeWithAutoFailover(req, res, 'imageAnalysis', buildRequest, processResponse, {
    maxRetries: 3,
    retryDelay: 1000,
    getApiKeys,
    selectApiProvider,
    updateApiHealth,
    detectApiKeyLeak
  });
});
```

---

### 方案 2: 使用预构建的处理器

更简单，但灵活性较低。

```javascript
import { createImageAnalysisHandler } from './api-handlers.js';

// 创建处理器
const analyzeImageHandler = createImageAnalysisHandler(
  getApiKeys,
  selectApiProvider,
  updateApiHealth,
  detectApiKeyLeak
);

// 使用处理器
app.post('/api/analyze-image', analyzeImageHandler);
```

---

### 方案 3: 手动实现（完全控制）

适用于需要自定义逻辑的场景。

```javascript
app.post('/api/analyze-image', async (req, res) => {
  const maxRetries = 3;
  const triedProviders = [];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 选择提供商（排除已失败的）
      const provider = selectApiProvider('imageAnalysis', triedProviders);
      
      if (!provider) {
        throw new Error('No available providers');
      }
      
      // 记录切换
      if (attempt > 1) {
        console.log(`🔄 Auto-switching to ${provider} (attempt ${attempt}/${maxRetries})`);
      }
      
      // 执行请求
      const result = await makeApiRequest(provider, req.body);
      
      // 成功 - 更新健康状态并返回
      updateApiHealth(provider, true);
      return res.json(result);
      
    } catch (error) {
      // 失败 - 标记不健康并重试
      const currentProvider = selectApiProvider('imageAnalysis', triedProviders);
      if (currentProvider) {
        updateApiHealth(currentProvider, false, error.message);
        triedProviders.push(currentProvider);
      }
      
      if (attempt >= maxRetries) {
        // 所有尝试都失败
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'All API providers are currently unavailable.'
        });
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});
```

---

## 📝 迁移现有端点

### 步骤 1: 识别需要迁移的端点

当前需要迁移的端点：
- ✅ `/api/analyze-image` - 图像分析（智能鉴伪）
- ✅ `/api/modify-image` - 图像修改（去水印）
- ⚠️ `/api/translate-image-text` - 文本翻译
- ⚠️ `/api/detect-text-translate` - 文本检测和翻译

### 步骤 2: 备份现有代码

```bash
# 创建备份
cp server/index.js server/index.js.backup
```

### 步骤 3: 逐个迁移端点

#### 示例：迁移 `/api/modify-image`

**旧代码**（简化版）:
```javascript
app.post('/api/modify-image', async (req, res) => {
  try {
    const provider = selectApiProvider('imageModification');
    const result = await callApi(provider, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**新代码**（带故障转移）:
```javascript
import { createImageModificationHandler } from './api-handlers.js';

app.post('/api/modify-image', createImageModificationHandler(
  getApiKeys,
  selectApiProvider,
  updateApiHealth,
  detectApiKeyLeak
));
```

### 步骤 4: 测试

```bash
# 重启服务器
npm run dev:all

# 测试功能
# 1. 正常情况
# 2. 模拟故障（暂时禁用主用 API）
# 3. 查看日志确认故障转移
```

---

## 🧪 测试故障转移

### 测试 1: 模拟 API 密钥失效

```bash
# 临时禁用 Google API
cd server
node disable-google-api.js

# 重启服务器
npm run dev:all

# 测试功能 - 应该自动切换到 Cloudflare
```

**预期日志**:
```
🔑 Using provider: google [imageAnalysis]
❌ API error for google: Invalid API key
🔄 Auto-switching to cloudflare (attempt 2/3)
✅ Successfully switched to cloudflare
```

### 测试 2: 模拟网络错误

修改代码暂时模拟网络错误：

```javascript
// 在 buildRequest 中添加
if (provider === 'google' && Math.random() < 0.5) {
  throw new Error('Simulated network error');
}
```

**预期行为**: 自动切换到备用提供商

### 测试 3: 模拟配额超限

使用大量请求快速消耗配额，观察自动切换。

---

## 📊 监控和调试

### 查看故障转移日志

```bash
# 实时查看日志
npm run dev:all

# 搜索故障转移记录
# 在日志中查找 "Auto-switching"
```

### 关键日志标识

- `🔑 Using provider` - 选择提供商
- `🔄 Auto-switching` - 故障转移
- `✅ Successfully switched` - 切换成功
- `❌ API error` - API 错误
- `🚨 CRITICAL` - 严重问题（如密钥泄露）

---

## ⚙️ 配置选项

### 调整重试参数

```javascript
await executeWithAutoFailover(req, res, capability, buildRequest, processResponse, {
  maxRetries: 5,        // 增加重试次数
  retryDelay: 2000,     // 增加重试延迟
  // ...
});
```

### 自定义回调

```javascript
await executeWithAutoFailover(req, res, capability, buildRequest, processResponse, {
  maxRetries: 3,
  retryDelay: 1000,
  onProviderSwitch: (newProvider, failedProviders) => {
    // 自定义切换逻辑
    console.log(`Switched to ${newProvider}`);
    // 可以发送通知、记录指标等
  },
  onError: (provider, error, retryCount) => {
    // 自定义错误处理
    console.error(`Provider ${provider} failed`);
    // 可以发送警报、更新监控等
  }
});
```

---

## 🎯 最佳实践

### 1. 渐进式迁移

不要一次性迁移所有端点：
1. 先迁移一个端点
2. 测试验证
3. 观察一段时间
4. 再迁移下一个

### 2. 保留备份

在迁移过程中保留旧代码：
```javascript
// 旧端点（备份）
app.post('/api/analyze-image-old', oldHandler);

// 新端点（故障转移）
app.post('/api/analyze-image', newHandler);
```

### 3. 监控指标

记录以下指标：
- 故障转移次数
- 各提供商成功率
- 平均响应时间
- 用户满意度

### 4. 逐步优化

根据实际使用情况调整：
- 重试次数
- 重试延迟
- 提供商优先级
- 超时时间

---

## 🆘 故障排除

### 问题 1: 导入错误

**错误**: `Cannot find module './api-handlers.js'`

**解决方案**:
```javascript
// 确保使用正确的导入路径
import { executeWithAutoFailover } from './api-handlers.js';
```

### 问题 2: 函数未定义

**错误**: `selectApiProvider is not a function`

**解决方案**:
```javascript
// 确保传递了所有必需的函数
await executeWithAutoFailover(req, res, capability, buildRequest, processResponse, {
  getApiKeys,           // ✅ 必需
  selectApiProvider,    // ✅ 必需
  updateApiHealth,      // ✅ 必需
  detectApiKeyLeak      // ✅ 必需
});
```

### 问题 3: 无限重试

**症状**: 日志中大量重试记录

**原因**: `maxRetries` 设置过大或没有正确排除失败的提供商

**解决方案**:
```javascript
// 确保 maxRetries 合理
maxRetries: 3  // 推荐值

// 确保 selectApiProvider 正确排除失败的提供商
const provider = selectApiProvider(capability, triedProviders);
```

---

## ✅ 完成检查清单

### 代码迁移

- [ ] 备份现有代码
- [ ] 创建 `api-handlers.js`
- [ ] 更新 `selectApiProvider` 函数
- [ ] 迁移 `/api/analyze-image` 端点
- [ ] 迁移 `/api/modify-image` 端点
- [ ] 迁移其他端点

### 测试验证

- [ ] 测试正常情况
- [ ] 测试单次故障转移
- [ ] 测试多次故障转移
- [ ] 测试所有提供商失败
- [ ] 检查日志输出

### 文档和监控

- [ ] 阅读 `AUTO_FAILOVER_SYSTEM.md`
- [ ] 配置日志监控
- [ ] 设置性能指标
- [ ] 通知团队成员

---

## 📚 相关文档

- `AUTO_FAILOVER_SYSTEM.md` - 完整系统文档
- `server/api-handlers.js` - 实现代码
- `server/index.js` - API 提供商选择

---

## 🎉 总结

### 实现方式

| 方式 | 难度 | 灵活性 | 推荐度 |
|------|------|--------|--------|
| 方案 1: executeWithAutoFailover | 中 | 高 | ⭐⭐⭐⭐⭐ |
| 方案 2: 预构建处理器 | 低 | 中 | ⭐⭐⭐⭐ |
| 方案 3: 手动实现 | 高 | 最高 | ⭐⭐⭐ |

### 推荐流程

1. **理解系统** - 阅读 `AUTO_FAILOVER_SYSTEM.md`
2. **选择方案** - 推荐方案 1
3. **备份代码** - 创建备份
4. **逐步迁移** - 一次一个端点
5. **测试验证** - 全面测试
6. **监控优化** - 持续改进

---

**准备好升级您的 API 系统了吗？** 🚀

**开始时间**: 30-60 分钟  
**难度**: 中等  
**收益**: 企业级高可用性

