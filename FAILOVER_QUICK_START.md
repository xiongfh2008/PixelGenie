# 🚀 智能故障转移系统 - 快速开始

## ⚡ 5 分钟快速部署

### 方法 1: 自动集成（推荐）

```bash
# 1. 运行自动集成脚本
node server/integrate-failover.js

# 2. 测试系统
node server/test-failover.js

# 3. 重启服务器
npm run dev:all
```

**就这么简单！** ✨

---

### 方法 2: 手动集成

如果自动集成失败，可以手动操作：

```bash
# 1. 备份原文件
cp server/index.js server/index.backup.js

# 2. 使用新实现
cp server/index-with-failover.js server/index.js

# 3. 重启服务器
npm run dev:all
```

---

## ✅ 验证集成

### 1. 测试故障转移

```bash
node server/test-failover.js
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
```

### 2. 检查健康状态

```bash
curl http://localhost:3001/api/health-report
```

**预期响应**：
```json
{
  "timestamp": "2025-11-26T...",
  "providers": {
    "google": { "healthy": true, "errorCount": 0 },
    "cloudflare": { "healthy": true, "errorCount": 0 },
    ...
  }
}
```

### 3. 测试前端功能

1. 打开浏览器：http://localhost:5173
2. 使用智能鉴伪功能上传图片
3. 检查响应中的 `_meta` 字段：
   ```json
   {
     "_meta": {
       "provider": "google",
       "attempts": 1
     }
   }
   ```

---

## 🎯 核心功能

### ✨ 自动故障转移

当 API 出现异常时，系统会自动切换到备用 API：

```
Google API 失败 → 自动切换到 Cloudflare
Cloudflare 失败 → 自动切换到 HuggingFace
...
```

**用户完全感知不到切换过程！**

### 🏥 健康状态跟踪

系统实时监控所有 API 的健康状态：

- ✅ 正常：自动使用
- ⚠️ 异常：自动跳过
- 🔒 泄露：永久禁用

### 🎯 智能选择

根据功能需求自动选择最合适的 API：

- **图像分析**：Google → 讯飞 → Cloudflare → ...
- **图像修改**：Google（唯一支持）
- **文本翻译**：Google → Cloudflare → ...

---

## 📊 实时监控

### 查看日志

服务器日志会显示详细的故障转移过程：

```
🔄 Attempt 1/3: Using provider google for imageAnalysis
✅ Success with provider: google
```

或

```
🔄 Attempt 1/3: Using provider google
❌ Error with provider google: timeout
🔄 Switching to next available provider...
🔄 Attempt 2/3: Using provider cloudflare
✅ Success with provider: cloudflare
```

### 健康状态 API

```bash
# 查看所有提供商状态
curl http://localhost:3001/api/health-report

# 重置某个提供商状态
curl -X POST http://localhost:3001/api/reset-health-status \
  -H "Content-Type: application/json" \
  -d '{"provider":"google"}'
```

---

## 🔧 配置选项

### 调整重试次数

在代码中修改 `callWithFailover` 的第 4 个参数：

```javascript
// 默认 3 次
await callWithFailover(fn, capability, params, 3);

// 增加到 5 次
await callWithFailover(fn, capability, params, 5);

// 不重试（只尝试 1 次）
await callWithFailover(fn, capability, params, 1);
```

### 调整超时时间

在 `api-failover.js` 中修改：

```javascript
export async function fetchWithTimeout(fetch, url, options, timeout = 30000) {
  // 改为 60 秒
  // timeout = 60000
}
```

### 调整错误阈值

在 `api-health.js` 中修改：

```javascript
if (status.errorCount >= 3) {
  // 改为 5 次
  // if (status.errorCount >= 5)
  status.healthy = false;
}
```

---

## 🎯 常见场景

### 场景 1: API 密钥泄露

**系统行为**：
1. 检测到泄露 → 自动标记为 `leaked`
2. 自动切换到其他 API
3. 在日志中显示警告
4. 永久跳过该 API

**用户体验**：功能继续正常工作，完全无感知

### 场景 2: API 服务暂时不可用

**系统行为**：
1. 检测到错误 → 错误计数 +1
2. 如果错误 ≥ 3 次 → 标记为不健康
3. 自动切换到其他 API
4. 当 API 恢复后自动重新使用

**用户体验**：功能继续正常工作，完全无感知

### 场景 3: 所有 API 都失败

**系统行为**：
1. 尝试所有可用的 API
2. 全部失败后返回错误
3. 在日志中记录详细信息

**用户体验**：看到友好的错误提示

---

## 📚 完整文档

- **系统详解**: `INTELLIGENT_FAILOVER_SYSTEM.md`
- **集成指南**: `FAILOVER_INTEGRATION_GUIDE.md`
- **代码实现**: `server/api-failover.js`, `server/api-health.js`

---

## 🆘 故障排除

### 问题 1: 自动集成失败

**解决方案**：
```bash
# 恢复备份
cp server/index.backup.js server/index.js

# 使用手动集成
cp server/index-with-failover.js server/index.js
```

### 问题 2: 测试失败

**解决方案**：
```bash
# 检查 .env 文件
cat server/.env

# 确保至少有一个 API key 配置正确
# GOOGLE_API_KEY=...
# CLOUDFLARE_API_TOKEN=...
```

### 问题 3: 前端功能异常

**解决方案**：
```bash
# 查看服务器日志
# 检查是否有错误信息

# 查看健康状态
curl http://localhost:3001/api/health-report

# 重置所有提供商状态
curl -X POST http://localhost:3001/api/reset-health-status \
  -d '{"provider":"google"}'
```

---

## 🎊 完成！

恭喜！您的 PixelGenie 现在拥有：

✅ 企业级可靠性  
✅ 自动故障转移  
✅ 智能 API 选择  
✅ 实时健康监控  
✅ 用户无感知切换  

**享受更稳定的服务吧！** 🚀

