# 🚀 快速集成指南 - 智能API故障转移

## 📋 概述

本指南将帮助您在 **5分钟内** 将智能API故障转移机制集成到现有的 PixelGenie 服务器中。

---

## ✅ 测试结果

所有测试场景均已通过：

| 场景 | 状态 | 说明 |
|------|:----:|------|
| 场景 1: 所有API正常 | ✅ | 使用第一个可用API（google） |
| 场景 2: 第一个API失败 | ✅ | 自动切换到第二个API（cloudflare） |
| 场景 3: 多次失败后成功 | ✅ | 尝试4次后成功（xunfei） |
| 场景 4: 所有API都失败 | ✅ | 正确抛出错误 |
| 场景 5: 能力过滤 | ✅ | 只选择支持特定能力的API |

---

## 🎯 集成步骤

### 步骤 1: 导入智能路由器

在 `server/index.js` 的顶部添加导入：

```javascript
import { createApiWrapper } from './smart-api-router.js';
```

### 步骤 2: 创建API包装器实例

在 `getApiKeys()` 函数之后添加：

```javascript
// 创建智能API包装器
const apiWrapper = createApiWrapper({
  selectApiProvider,
  updateApiHealth,
  getApiKeys
});
```

### 步骤 3: 更新图像分析端点

找到 `/api/analyze-image` 端点，替换为：

```javascript
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64, mfrBase64, mimeType, lang } = req.body;

    // 验证输入
    if (!originalBase64 || !elaBase64) {
      return res.status(400).json({ error: 'Missing required image data' });
    }

    // 构建parts（保持原有逻辑）
    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
      { inlineData: { mimeType: 'image/png', data: elaBase64 } }
    ];
    
    if (mfrBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: mfrBase64 } });
    }

    // 添加提示词（保持原有逻辑）
    const langMap = { /* ... */ };
    const targetLang = langMap[lang] || 'English';
    const prompt = `You are a Lead Digital Forensic Analyst...`;
    parts.push({ text: prompt });

    // 🎯 使用智能路由器（唯一的改动！）
    const result = await apiWrapper.analyzeImage(parts, 'imageAnalysis');

    // 返回结果
    res.json(result.data);

  } catch (error) {
    console.error('Analyze image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze image'
    });
  }
});
```

### 步骤 4: 更新图像修改端点

找到 `/api/modify-image` 端点，替换为：

```javascript
app.post('/api/modify-image', async (req, res) => {
  try {
    const { base64, mimeType, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 🎯 使用智能路由器
    const result = await apiWrapper.modifyImage(base64, mimeType, prompt, 'imageModification');

    res.json(result.data);

  } catch (error) {
    console.error('Modify image error:', error);
    res.status(500).json({
      error: error.message || 'Failed to modify image'
    });
  }
});
```

### 步骤 5: 重启服务器

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm run dev:all
```

---

## 🎨 完整的代码示例

### 最小化改动版本

如果您想最小化改动，只需在现有的API调用外面包装一层：

```javascript
// 原有代码
try {
  const provider = selectApiProvider('imageAnalysis');
  const response = await fetch(url, { ... });
  const data = await response.json();
  res.json(data);
} catch (error) {
  res.status(500).json({ error: error.message });
}

// 改为
try {
  const result = await apiWrapper.analyzeImage(parts, 'imageAnalysis');
  res.json(result.data);
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

### 保留现有逻辑的版本

如果您想保留现有的所有逻辑，可以创建一个适配器：

```javascript
// 在 server/index.js 中添加
async function analyzeImageWithFailover(parts) {
  return apiWrapper.analyzeImage(parts, 'imageAnalysis');
}

// 在端点中使用
app.post('/api/analyze-image', async (req, res) => {
  try {
    // ... 原有的验证和构建逻辑 ...
    
    // 使用适配器
    const result = await analyzeImageWithFailover(parts);
    
    res.json(result.data);
  } catch (error) {
    // ... 原有的错误处理 ...
  }
});
```

---

## 📊 预期效果

### 用户体验

**之前**:
```
用户上传图片 → Google API失败 → 显示错误 ❌
```

**现在**:
```
用户上传图片 → Google API失败 → 自动切换到Cloudflare → 成功返回结果 ✅
```

### 服务器日志

**之前**:
```
❌ Health check failed for google
Error: API key leaked
```

**现在**:
```
🔄 Attempt 1/3: Using google for imageAnalysis
❌ Attempt 1 failed with google: API key leaked
⏳ Waiting 1000ms before next attempt...
🔄 Attempt 2/3: Using cloudflare for imageAnalysis
✅ Success with cloudflare (attempt 2/3)
📊 [SUCCESS] {"provider":"cloudflare","attempts":2}
```

---

## 🔧 高级配置

### 调整重试次数

```javascript
// 在 smart-api-router.js 中
const result = await smartApiRequest({
  // ... 其他配置
  maxAttempts: 5  // 增加到5次
});
```

### 调整退避时间

```javascript
// 在 smart-api-router.js 中修改 calculateBackoff 函数
function calculateBackoff(attempt) {
  const baseDelay = 500;   // 改为500ms
  const maxDelay = 3000;   // 改为3秒
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  return delay + Math.random() * 500;  // 减少抖动
}
```

### 自定义日志记录

```javascript
// 在 smart-api-router.js 中修改 logEvent 函数
function logEvent(event) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, ...event };
  
  // 发送到监控服务
  if (process.env.MONITORING_ENABLED === 'true') {
    sendToMonitoring(logEntry);
  }
  
  // 写入日志文件
  if (process.env.LOG_TO_FILE === 'true') {
    fs.appendFileSync('failover.log', JSON.stringify(logEntry) + '\n');
  }
  
  // 控制台输出
  console.log('📊 [EVENT]', JSON.stringify(logEntry));
}
```

---

## 🐛 故障排查

### 问题 1: 导入错误

**错误**: `Cannot find module './smart-api-router.js'`

**解决**:
```bash
# 确保文件存在
ls server/smart-api-router.js

# 检查导入路径
# 应该是相对路径: './smart-api-router.js'
```

### 问题 2: 函数未定义

**错误**: `apiWrapper.analyzeImage is not a function`

**解决**:
```javascript
// 确保正确创建了包装器
const apiWrapper = createApiWrapper({
  selectApiProvider,
  updateApiHealth,
  getApiKeys
});

// 检查函数是否存在
console.log('Available methods:', Object.keys(apiWrapper));
```

### 问题 3: 所有API都失败

**错误**: `All API providers failed after 3 attempts`

**解决**:
```bash
# 1. 检查API密钥
cat server/.env

# 2. 测试单个API
cd server && node test-cloudflare.js

# 3. 检查健康状态
curl http://localhost:3001/api/health

# 4. 重置健康状态
cd server && node reset-google-health.js
```

---

## 📈 监控和维护

### 查看故障转移统计

在服务器启动时添加统计信息：

```javascript
// 在 server/index.js 中添加
let failoverStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  providerUsage: {}
};

// 在每次请求后更新
failoverStats.totalRequests++;
if (result.success) {
  failoverStats.successfulRequests++;
  failoverStats.providerUsage[result.meta.provider] = 
    (failoverStats.providerUsage[result.meta.provider] || 0) + 1;
}

// 添加统计端点
app.get('/api/stats', (req, res) => {
  res.json({
    ...failoverStats,
    successRate: (failoverStats.successfulRequests / failoverStats.totalRequests * 100).toFixed(2) + '%'
  });
});
```

### 定期健康检查

```javascript
// 每5分钟检查一次所有API的健康状态
setInterval(async () => {
  const providers = ['google', 'cloudflare', 'huggingface', 'xunfei'];
  for (const provider of providers) {
    try {
      const isHealthy = await checkApiHealth(provider, apiKeys[provider]);
      updateApiHealth(provider, isHealthy);
    } catch (error) {
      console.error(`Health check failed for ${provider}:`, error.message);
    }
  }
}, 5 * 60 * 1000);
```

---

## 🎉 完成！

### 您现在拥有：

✅ **自动故障转移** - API失败时自动切换  
✅ **智能重试** - 指数退避策略  
✅ **能力过滤** - 只选择支持特定功能的API  
✅ **完整日志** - 详细的事件记录  
✅ **对用户透明** - 无感知的切换过程  

### 下一步：

1. **测试功能** - 上传图片，测试去水印功能
2. **查看日志** - 观察故障转移过程
3. **监控统计** - 访问 `/api/stats` 查看使用情况
4. **优化配置** - 根据实际情况调整重试次数和延迟

---

## 📚 相关文档

- `SMART_API_FAILOVER.md` - 完整的技术文档
- `server/smart-api-router.js` - 智能路由器实现
- `server/test-smart-failover.js` - 测试脚本
- `server/integrate-smart-router-example.js` - 集成示例

---

**享受企业级的API可靠性！** 🚀

