# 🔄 智能API故障转移机制

## 📋 概述

实现了一个完全自动化、对用户无感知的API故障转移系统。当某个API提供商出现异常时，系统会自动按优先级切换到其他可用的提供商，确保服务的高可用性。

---

## ✨ 核心特性

### 1. 🎯 自动故障转移
- 当API请求失败时，自动尝试下一个可用的提供商
- 智能跳过已经失败的提供商
- 支持多次重试，直到成功或耗尽所有选项

### 2. 🔍 智能健康检测
- 实时监控每个API提供商的健康状态
- 自动标记不健康的提供商
- 定期健康检查，自动恢复健康的提供商

### 3. ⚡ 指数退避策略
- 失败后等待时间逐渐增加
- 添加随机抖动，避免雷鸣群效应
- 最大等待时间限制，避免长时间阻塞

### 4. 📊 完整的事件日志
- 记录每次请求的详细信息
- 成功/失败事件分类
- 便于监控和问题排查

### 5. 🎨 对用户完全透明
- 用户无需关心使用哪个API
- 自动处理所有故障和重试
- 返回统一的响应格式

---

## 🏗️ 架构设计

### 组件层次

```
┌─────────────────────────────────────────┐
│         用户请求 (User Request)          │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      智能API路由器 (Smart Router)        │
│  - 选择最佳提供商                         │
│  - 执行请求                              │
│  - 处理失败                              │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │Google  │ │Cloudfl.│ │HuggingF│
   │Gemini  │ │Workers │ │  Face  │
   └────────┘ └────────┘ └────────┘
        │          │          │
        └──────────┼──────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         统一响应 (Unified Response)      │
└─────────────────────────────────────────┘
```

### 故障转移流程

```
开始请求
   │
   ▼
选择API提供商 (优先级: Primary → Backup → Fallback)
   │
   ▼
执行API请求
   │
   ├─成功─→ 更新健康状态 ─→ 返回结果 ─→ 结束
   │
   ├─失败─→ 记录失败 ─→ 更新健康状态
   │           │
   │           ▼
   │      还有重试机会？
   │           │
   │       ┌───┴───┐
   │       │       │
   │      是      否
   │       │       │
   │       ▼       ▼
   │    等待后重试  返回错误
   │       │
   └───────┘
```

---

## 🚀 使用方法

### 方法 1: 使用智能API包装器（推荐）

```javascript
import { createApiWrapper } from './smart-api-router.js';

// 创建API包装器
const apiWrapper = createApiWrapper({
  selectApiProvider,
  updateApiHealth,
  getApiKeys
});

// 使用包装器执行请求
try {
  const result = await apiWrapper.analyzeImage(parts, 'imageAnalysis');
  
  // 成功！result包含:
  // - success: true
  // - data: 实际的响应数据
  // - meta: { provider, attempts, attemptedProviders }
  
  res.json(result.data);
} catch (error) {
  // 所有API都失败了
  res.status(500).json({ error: error.message });
}
```

### 方法 2: 使用底层smartApiRequest

```javascript
import { smartApiRequest } from './smart-api-router.js';

const result = await smartApiRequest({
  selectApiProvider,
  updateApiHealth,
  capability: 'imageAnalysis',
  params: { parts },
  maxAttempts: 3,
  
  // 构建请求
  buildRequest: (provider, params) => {
    // 返回 { url, requestBody, headers, provider }
  },
  
  // 执行请求
  executeRequest: async (config) => {
    // 返回 response
  },
  
  // 解析响应
  parseResponse: (response, provider) => {
    // 返回解析后的数据
  }
});
```

---

## 📝 集成到现有代码

### 步骤 1: 导入模块

```javascript
import { createApiWrapper } from './smart-api-router.js';
```

### 步骤 2: 创建包装器实例

```javascript
const apiWrapper = createApiWrapper({
  selectApiProvider,
  updateApiHealth,
  getApiKeys
});
```

### 步骤 3: 替换现有的API调用

**之前的代码**:
```javascript
app.post('/api/analyze-image', async (req, res) => {
  try {
    const provider = selectApiProvider('imageAnalysis');
    
    // 构建请求...
    const response = await fetch(url, { ... });
    const data = await response.json();
    
    // 解析响应...
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**使用智能路由器后**:
```javascript
app.post('/api/analyze-image', async (req, res) => {
  try {
    const result = await apiWrapper.analyzeImage(parts, 'imageAnalysis');
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔧 配置选项

### maxAttempts (最大尝试次数)

```javascript
const result = await smartApiRequest({
  // ... 其他配置
  maxAttempts: 5  // 默认: 3
});
```

### 退避策略

```javascript
// 在 smart-api-router.js 中配置
function calculateBackoff(attempt) {
  const baseDelay = 1000;  // 基础延迟: 1秒
  const maxDelay = 5000;   // 最大延迟: 5秒
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  return delay + Math.random() * 1000;  // 添加随机抖动
}
```

### API优先级

在 `selectApiProvider` 函数中配置:

```javascript
const primaryProviders = ['google', 'xunfei'];        // 主用
const backupProviders = ['cloudflare', 'huggingface']; // 备用
const fallbackProviders = ['baidu', 'tencent'];        // 后备
```

---

## 📊 监控和日志

### 事件类型

1. **SUCCESS** - 请求成功
   ```json
   {
     "type": "success",
     "provider": "google",
     "capability": "imageAnalysis",
     "attempt": 1,
     "totalAttempts": 1,
     "attemptedProviders": ["google"]
   }
   ```

2. **FAILURE** - 单次请求失败
   ```json
   {
     "type": "failure",
     "provider": "google",
     "capability": "imageAnalysis",
     "attempt": 1,
     "error": "API key leaked",
     "attemptedProviders": ["google"]
   }
   ```

3. **ALL_FAILED** - 所有尝试都失败
   ```json
   {
     "type": "all_failed",
     "attemptedProviders": ["google", "cloudflare", "huggingface"],
     "totalAttempts": 3,
     "lastError": "Network timeout",
     "capability": "imageAnalysis"
   }
   ```

### 日志输出示例

```
🔄 Attempt 1/3: Using google for imageAnalysis
✅ Success with google (attempt 1/3)
📊 [SUCCESS] {"timestamp":"2025-11-26T...","type":"success",...}
```

```
🔄 Attempt 1/3: Using google for imageAnalysis
❌ Attempt 1 failed with google: API key leaked
⏳ Waiting 1234ms before next attempt...
🔄 Attempt 2/3: Using cloudflare for imageAnalysis
✅ Success with cloudflare (attempt 2/3)
📊 [SUCCESS] {"timestamp":"2025-11-26T...","type":"success",...}
```

---

## 🎯 最佳实践

### 1. 合理设置重试次数

```javascript
// 对于关键功能，增加重试次数
const result = await smartApiRequest({
  maxAttempts: 5,  // 图像分析等关键功能
  // ...
});

// 对于非关键功能，减少重试次数
const result = await smartApiRequest({
  maxAttempts: 2,  // 日志记录等非关键功能
  // ...
});
```

### 2. 配置合适的超时时间

```javascript
executeRequest: async ({ url, requestBody, headers }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000)  // 30秒超时
  });
  return response.json();
}
```

### 3. 处理不同类型的错误

```javascript
parseResponse: (data, provider) => {
  // 验证响应格式
  if (!data || !data.result) {
    throw new Error('Invalid response format');
  }
  
  // 检查业务错误
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data.result;
}
```

### 4. 记录详细的错误信息

```javascript
catch (error) {
  console.error('API request failed:', {
    error: error.message,
    stack: error.stack,
    attemptedProviders,
    capability
  });
}
```

---

## 🔍 故障排查

### 问题 1: 所有API都失败

**症状**: 收到 "All API providers failed" 错误

**检查**:
1. 查看日志中的 `attemptedProviders`
2. 检查每个提供商的健康状态
3. 验证API密钥是否有效
4. 检查网络连接

**解决**:
```bash
# 检查API健康状态
curl http://localhost:3001/api/health

# 手动测试API
cd server && node test-cloudflare.js
```

### 问题 2: 频繁切换提供商

**症状**: 日志显示频繁的故障转移

**原因**:
- API配额用完
- API密钥无效
- 网络不稳定

**解决**:
1. 检查API使用量
2. 更新API密钥
3. 增加重试延迟

### 问题 3: 响应时间过长

**症状**: 请求需要很长时间才返回

**原因**:
- 多次重试导致
- 退避时间过长

**解决**:
```javascript
// 减少最大尝试次数
maxAttempts: 2

// 或调整退避策略
function calculateBackoff(attempt) {
  return 500 * attempt;  // 更短的延迟
}
```

---

## 📈 性能优化

### 1. 并行健康检查

```javascript
// 定期并行检查所有API的健康状态
async function checkAllProviders() {
  const providers = ['google', 'cloudflare', 'huggingface'];
  await Promise.all(
    providers.map(p => checkApiHealth(p, apiKeys[p]))
  );
}
```

### 2. 缓存API响应

```javascript
const cache = new Map();

parseResponse: (data, provider) => {
  const cacheKey = JSON.stringify(params);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const result = parseData(data);
  cache.set(cacheKey, result);
  return result;
}
```

### 3. 预热API连接

```javascript
// 服务器启动时预热连接
async function warmupConnections() {
  const providers = ['google', 'cloudflare'];
  for (const provider of providers) {
    try {
      await checkApiHealth(provider, apiKeys[provider]);
    } catch (error) {
      console.warn(`Warmup failed for ${provider}`);
    }
  }
}
```

---

## 🎊 总结

### 优势

✅ **高可用性** - 自动故障转移确保服务持续可用  
✅ **用户无感知** - 所有重试和切换对用户透明  
✅ **智能路由** - 根据健康状态和能力选择最佳API  
✅ **完整日志** - 便于监控和问题排查  
✅ **易于集成** - 简单的API，快速集成到现有代码  

### 使用场景

- 🖼️ 图像分析和处理
- 📝 文本翻译
- 🎨 图像生成和编辑
- 🔍 AI检测
- 📊 任何需要高可用性的API调用

---

## 📚 相关文档

- `server/smart-api-router.js` - 智能路由器实现
- `server/api-failover.js` - 故障转移工具函数
- `server/index.js` - 主服务器文件
- `GOOGLE_API_RESTORED.md` - API配置指南

---

**现在您的API调用拥有企业级的可靠性！** 🚀

