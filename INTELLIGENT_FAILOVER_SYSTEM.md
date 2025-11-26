# 🔄 智能故障转移系统

## 📋 概述

PixelGenie 现在配备了**企业级智能故障转移系统**，当某个 API 模型出现异常时，系统会自动按优先级顺序切换至其他可用模型，整个过程对用户完全透明。

---

## ✨ 核心特性

### 1. 🔄 自动故障转移
- 检测到 API 异常时自动切换
- 按优先级顺序尝试备用模型
- 最多自动重试 3 次
- 对用户完全透明

### 2. 🏥 健康状态跟踪
- 实时监控所有 API 提供商
- 自动标记不健康的提供商
- 错误计数和恢复检测
- API 密钥泄露检测

### 3. 🎯 智能提供商选择
- 基于能力的提供商过滤
- 优先级排序（主用 → 备用 → 后备）
- 排除已失败的提供商
- 自动跳过泄露的密钥

### 4. ⚡ 性能优化
- 30 秒请求超时
- 1 秒重试延迟
- 并发请求支持
- 响应格式统一

---

## 🏗️ 系统架构

### 核心模块

```
server/
├── api-failover.js      # 故障转移核心逻辑
├── api-health.js        # 健康状态管理
├── index.js             # 主服务器（集成故障转移）
└── index-with-failover.js  # 完整示例实现
```

### 数据流

```
用户请求
    ↓
[故障转移包装器]
    ↓
[选择提供商] → 主用 API
    ↓ (失败)
[自动切换] → 备用 API
    ↓ (失败)
[再次切换] → 后备 API
    ↓ (成功)
[返回结果] → 用户
```

---

## 📊 API 提供商优先级

### 图像分析功能

| 优先级 | 提供商 | 状态 | 说明 |
|--------|--------|:----:|------|
| 🥇 主用 | Google Gemini | ✅ | 最高质量 |
| 🥇 主用 | 讯飞星火 | ✅ | 高质量 |
| 🥈 备用 | Cloudflare | ✅ | 免费额度大 |
| 🥈 备用 | HuggingFace | ✅ | 开源模型 |
| 🥈 备用 | DeepSeek | ✅ | 高性能 |
| 🥉 后备 | Baidu | ⚠️ | 需配置 |
| 🥉 后备 | Tencent | ⚠️ | 需配置 |
| 🥉 后备 | Alibaba | ⚠️ | 需配置 |

### 图像修改功能（去水印）

| 优先级 | 提供商 | 状态 | 说明 |
|--------|--------|:----:|------|
| 🥇 唯一 | Google Gemini | ✅ | 唯一支持 |

---

## 🔧 使用方法

### 方法 1: 使用故障转移包装器（推荐）

```javascript
import { callWithFailover } from './api-failover.js';

// 定义 API 调用函数
async function myApiCall(provider, params) {
  // 实现具体的 API 调用逻辑
  const response = await fetch(url, options);
  return response.json();
}

// 使用故障转移
try {
  const result = await callWithFailover(
    myApiCall,              // API 调用函数
    'imageAnalysis',        // 所需能力
    { /* 参数 */ },         // 调用参数
    3                       // 最大重试次数
  );
  
  console.log('Success:', result.data);
  console.log('Provider:', result.provider);
  console.log('Attempts:', result.attempts);
  
} catch (error) {
  console.error('All providers failed:', error);
}
```

### 方法 2: 手动实现故障转移

```javascript
import { selectApiProvider, updateApiHealth } from './api-health.js';

async function myFunctionWithFailover() {
  const excludeProviders = new Set();
  const maxRetries = 3;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 选择提供商
      const provider = selectApiProvider('imageAnalysis', excludeProviders);
      
      if (!provider) {
        throw new Error('No available providers');
      }
      
      excludeProviders.add(provider);
      
      // 调用 API
      const result = await callApi(provider);
      
      // 成功 - 更新健康状态
      updateApiHealth(provider, true);
      
      return result;
      
    } catch (error) {
      // 失败 - 更新健康状态
      const currentProvider = Array.from(excludeProviders).pop();
      updateApiHealth(currentProvider, false, error.message);
      
      // 继续尝试下一个
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      
      throw error;
    }
  }
}
```

---

## 🎯 实际应用示例

### 示例 1: 智能鉴伪功能

```javascript
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { originalBase64, elaBase64 } = req.body;
    
    // 构建请求参数
    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
      { inlineData: { mimeType: 'image/png', data: elaBase64 } },
      { text: 'Analyze this image for AI generation...' }
    ];
    
    // 使用故障转移
    const result = await callWithFailover(
      analyzeImageWithProvider,
      'imageAnalysis',
      { parts, apiKeys: getApiKeys() },
      3
    );
    
    // 返回结果（包含元数据）
    res.json({
      ...JSON.parse(result.data),
      _meta: {
        provider: result.provider,    // 使用的提供商
        attempts: result.attempts,    // 尝试次数
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**用户体验**：
- 如果 Google API 失败 → 自动切换到讯飞
- 如果讯飞也失败 → 自动切换到 Cloudflare
- 用户完全感知不到切换过程
- 只要有一个 API 可用，功能就能正常工作

### 示例 2: 去水印功能

```javascript
app.post('/api/modify-image', async (req, res) => {
  try {
    const { base64, prompt } = req.body;
    
    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: base64 } },
      { text: prompt }
    ];
    
    // 使用故障转移（只有 Google 支持）
    const result = await callWithFailover(
      modifyImageWithProvider,
      'imageModification',
      { parts, apiKeys: getApiKeys() },
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
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📈 健康状态管理

### 健康状态结构

```javascript
{
  provider: {
    healthy: true,           // 是否健康
    lastCheck: 1234567890,   // 最后检查时间
    errorCount: 0,           // 错误计数
    leaked: false,           // 是否检测到密钥泄露
    leakDetectedAt: null,    // 泄露检测时间
    lastError: null          // 最后的错误信息
  }
}
```

### 健康状态更新规则

1. **成功时**：
   - `healthy = true`
   - `errorCount = 0`
   - 清除 `lastError`

2. **失败时**：
   - `errorCount += 1`
   - 记录 `lastError`
   - 如果 `errorCount >= 3`，标记为不健康

3. **检测到密钥泄露**：
   - `leaked = true`
   - `healthy = false`
   - 记录 `leakDetectedAt`
   - 自动跳过该提供商

### API 端点

```javascript
// 获取健康状态报告
GET /api/health-report

// 重置提供商健康状态
POST /api/reset-health-status
Body: { provider: "google" }
```

---

## 🔍 故障检测机制

### 可重试的错误

- 网络超时 (timeout)
- 连接重置 (ECONNRESET)
- 连接超时 (ETIMEDOUT)
- DNS 错误 (ENOTFOUND)
- 503 Service Unavailable
- 502 Bad Gateway
- 429 Too Many Requests

### 致命错误（不重试）

- API 密钥泄露
- 认证失败 (401)
- 权限不足 (403)
- 无效的 API 密钥

### 自动切换触发条件

1. **网络错误**：立即切换
2. **API 错误**：立即切换
3. **超时**：立即切换
4. **响应格式错误**：立即切换
5. **密钥泄露**：永久跳过该提供商

---

## 📊 监控和日志

### 日志示例

```
🔄 Attempt 1/3: Using provider google for imageAnalysis
✅ Success with provider: google

🔄 Attempt 1/3: Using provider google for imageModification
❌ Error with provider google: API key was reported as leaked
🚨 CRITICAL: API key leak detected for google!
🔄 Switching to next available provider...
🔄 Attempt 2/3: Using provider cloudflare for imageModification
❌ Error with provider cloudflare: Image modification not supported
🔄 Attempt 3/3: Using provider huggingface for imageModification
✅ Success with provider: huggingface
```

### 监控指标

- 总请求数
- 成功率
- 平均尝试次数
- 提供商使用分布
- 故障转移次数
- 平均响应时间

---

## 🎯 最佳实践

### 1. 配置多个 API 提供商

```env
# 至少配置 2-3 个提供商
GOOGLE_API_KEY=your_key
CLOUDFLARE_API_TOKEN=your_token
HUGGINGFACE_API_KEY=your_key
```

### 2. 合理设置重试次数

```javascript
// 图像分析：3 次重试（有多个备用）
callWithFailover(fn, 'imageAnalysis', params, 3);

// 图像修改：1 次重试（只有 Google 支持）
callWithFailover(fn, 'imageModification', params, 1);
```

### 3. 监控健康状态

```javascript
// 定期检查健康状态
setInterval(() => {
  const report = getHealthReport();
  console.log('Health Report:', report);
}, 60000); // 每分钟
```

### 4. 及时处理密钥泄露

```javascript
// 检测到泄露时的处理
if (status.leaked) {
  // 1. 发送告警
  sendAlert(`API key leaked: ${provider}`);
  
  // 2. 自动禁用
  // (系统已自动跳过)
  
  // 3. 通知管理员
  notifyAdmin(`Rotate ${provider} API key immediately`);
}
```

### 5. 优雅降级

```javascript
// 如果所有提供商都失败
try {
  const result = await callWithFailover(fn, capability, params);
} catch (error) {
  // 返回降级响应
  return {
    success: false,
    message: '服务暂时不可用，请稍后重试',
    fallback: true
  };
}
```

---

## 🔧 配置选项

### 超时设置

```javascript
// 在 api-failover.js 中
export async function fetchWithTimeout(fetch, url, options, timeout = 30000) {
  // 默认 30 秒，可根据需要调整
}
```

### 重试延迟

```javascript
// 在 callWithFailover 中
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 秒延迟
```

### 错误阈值

```javascript
// 在 api-health.js 中
if (status.errorCount >= 3) {
  status.healthy = false; // 3 次错误后标记为不健康
}
```

---

## 📚 API 参考

### callWithFailover

```javascript
/**
 * 带自动重试和故障转移的 API 调用
 * @param {Function} apiCallFunction - API 调用函数
 * @param {string} requiredCapability - 所需能力
 * @param {Object} params - 调用参数
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<Object>} { success, data, provider, attempts }
 */
```

### selectApiProvider

```javascript
/**
 * 智能选择 API 提供商
 * @param {string} requiredCapability - 所需能力（可选）
 * @param {Set} excludeProviders - 要排除的提供商
 * @returns {string|null} 提供商名称
 */
```

### updateApiHealth

```javascript
/**
 * 更新提供商健康状态
 * @param {string} provider - 提供商名称
 * @param {boolean} isHealthy - 是否健康
 * @param {string} error - 错误信息（可选）
 */
```

---

## 🎊 总结

### 核心优势

✅ **自动故障转移** - 无需人工干预  
✅ **用户无感知** - 透明切换  
✅ **智能选择** - 基于健康状态和能力  
✅ **企业级可靠性** - 多层保护  
✅ **完整监控** - 实时健康跟踪  

### 使用场景

- ✅ 生产环境高可用部署
- ✅ 多 API 提供商管理
- ✅ 自动故障恢复
- ✅ 负载均衡
- ✅ 成本优化

---

**现在您的 PixelGenie 拥有企业级的智能故障转移能力！** 🚀

