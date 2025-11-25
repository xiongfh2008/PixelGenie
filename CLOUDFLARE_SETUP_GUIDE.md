# Cloudflare Workers AI 集成指南

## 📋 概述

Cloudflare Workers AI 已经集成到 PixelGenie 项目中作为备用 API。本指南将帮助您完成配置。

## 🎯 集成状态

✅ **已完成的工作**:
- Cloudflare Workers AI 已集成到 `server/index.js`
- 使用 `@cf/meta/llama-3.2-11b-vision-instruct` 模型进行图像分析
- 已添加到备用提供商列表（优先级：主用 > 备用 > 后备）
- 支持自动故障转移和健康检查

⚙️ **需要配置**:
- Cloudflare Account ID
- Cloudflare API Token

---

## 🚀 快速开始

### 步骤 1: 获取 Cloudflare Account ID

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录您的账户（如果没有账户，请先注册）
3. 在右侧边栏找到 **Account ID**
4. 点击复制按钮

**示例**: `1234567890abcdef1234567890abcdef`

### 步骤 2: 创建 API Token

1. 在 Cloudflare Dashboard 中，点击右上角的用户图标
2. 选择 **My Profile** → **API Tokens**
3. 点击 **Create Token**
4. 选择 **Create Custom Token**
5. 配置权限:
   - **Token name**: `PixelGenie Workers AI`
   - **Permissions**:
     - Account → Workers AI → Read
     - Account → Workers AI → Edit
   - **Account Resources**: 选择您的账户
   - **TTL**: 根据需要设置（建议 1 年）
6. 点击 **Continue to summary** → **Create Token**
7. **重要**: 立即复制并保存 Token（只会显示一次）

**示例**: `abcdef1234567890_abcdef1234567890_abcdef1234567890`

### 步骤 3: 更新环境变量

打开 `server/.env` 文件，添加以下内容：

```env
# Cloudflare Workers AI Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

**替换**:
- `your_account_id_here` → 您的 Account ID
- `your_api_token_here` → 您的 API Token

### 步骤 4: 重启服务

```bash
# 停止当前服务（如果正在运行）
# 按 Ctrl+C 停止

# 重新启动服务
npm run dev:all
```

---

## 🎁 免费额度

Cloudflare Workers AI 提供慷慨的免费额度：

| 项目 | 免费额度 |
|------|----------|
| **每日请求数** | 10,000 次 |
| **模型访问** | 所有开源模型 |
| **存储** | 无限制 |
| **带宽** | 无限制 |

**注意**: 超出免费额度后按使用量计费，但价格非常低廉。

---

## 🔧 技术细节

### 使用的模型

- **模型名称**: `@cf/meta/llama-3.2-11b-vision-instruct`
- **类型**: 视觉语言模型（Vision-Language Model）
- **能力**: 
  - 图像理解和分析
  - 文本生成
  - 多模态推理

### API 端点

```
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct
```

### 请求格式

```javascript
{
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "分析这张图片..." },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }
      ]
    }
  ]
}
```

### 响应格式

```javascript
{
  "result": {
    "response": "图像分析结果...",
    "content": "..."
  },
  "success": true
}
```

---

## 🔄 API 优先级

当前 API 提供商优先级：

1. **主用提供商** (Primary):
   - Google Gemini
   - 讯飞星火 (Xunfei Spark)

2. **备用提供商** (Backup):
   - ✨ **Cloudflare Workers AI** ← 新增
   - HuggingFace
   - DeepSeek

3. **后备提供商** (Fallback):
   - Baidu
   - Tencent
   - Alibaba

**自动切换逻辑**:
- 系统会自动选择健康的 API 提供商
- 如果主用提供商失败，自动切换到备用提供商
- 如果检测到 API 密钥泄露，自动跳过该提供商
- 每个提供商都有健康状态跟踪

---

## 🧪 测试集成

### 方法 1: 使用项目功能

1. 启动项目: `npm run dev:all`
2. 打开浏览器访问项目
3. 使用 **智能鉴伪** 功能上传图片
4. 查看控制台日志，确认使用的 API 提供商

### 方法 2: 使用 curl 测试

```bash
curl -X POST https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/meta/llama-3.2-11b-vision-instruct \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": [
          { "type": "text", "text": "Hello, can you see this message?" }
        ]
      }
    ]
  }'
```

**预期响应**:
```json
{
  "result": {
    "response": "Yes, I can see your message..."
  },
  "success": true
}
```

---

## 📊 监控和日志

### 查看 API 使用情况

服务器会在控制台输出详细日志：

```
✅ Available API keys: google, xunfei, deepseek, huggingface, cloudflare
🔑 Active provider (backup): cloudflare
📊 API Response from cloudflare: {...}
```

### 健康检查

每次 API 调用后，系统会自动更新健康状态：

```javascript
apiHealthStatus = {
  cloudflare: { 
    healthy: true, 
    lastCheck: 1700000000000, 
    errorCount: 0 
  }
}
```

---

## ⚠️ 故障排除

### 问题 1: "No API keys configured"

**原因**: 环境变量未正确加载

**解决方案**:
1. 确认 `server/.env` 文件存在
2. 确认文件中包含 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`
3. 重启服务器

### 问题 2: "401 Unauthorized"

**原因**: API Token 无效或权限不足

**解决方案**:
1. 检查 API Token 是否正确复制
2. 确认 Token 权限包含 Workers AI Read/Edit
3. 检查 Token 是否过期
4. 重新创建 Token

### 问题 3: "Account ID not found"

**原因**: Account ID 错误

**解决方案**:
1. 重新从 Cloudflare Dashboard 复制 Account ID
2. 确保没有多余的空格或字符
3. 更新 `.env` 文件

### 问题 4: 响应格式错误

**原因**: 模型返回的格式与预期不符

**解决方案**:
- 已在代码中处理多种响应格式
- 检查 `server/index.js` 中的响应解析逻辑
- 查看控制台日志中的完整响应

---

## 🔐 安全建议

1. **保护 API Token**:
   - 不要将 `.env` 文件提交到 Git
   - 定期轮换 API Token
   - 使用最小权限原则

2. **监控使用量**:
   - 定期检查 Cloudflare Dashboard
   - 设置使用量警报
   - 监控异常流量

3. **密钥泄露检测**:
   - 系统会自动检测密钥泄露
   - 如果检测到泄露，立即轮换密钥
   - 查看日志中的 `🚨 CRITICAL: API key leak detected` 警告

---

## 📚 相关资源

- [Cloudflare Workers AI 文档](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare API 文档](https://developers.cloudflare.com/api/)
- [Llama 3.2 Vision 模型文档](https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)

---

## ✅ 完成检查清单

- [ ] 已获取 Cloudflare Account ID
- [ ] 已创建 API Token
- [ ] 已更新 `server/.env` 文件
- [ ] 已重启服务器
- [ ] 已测试 API 调用
- [ ] 已查看日志确认集成成功

---

## 💡 下一步

完成 Cloudflare Workers AI 集成后，您可以：

1. **配置其他备用 API**:
   - HuggingFace (已集成)
   - DeepSeek (已集成)
   - Baidu, Tencent, Alibaba (待配置)

2. **优化性能**:
   - 调整 API 优先级
   - 配置缓存策略
   - 实现请求限流

3. **增强监控**:
   - 添加使用量统计
   - 实现告警通知
   - 导出日志分析

---

**集成完成后，Cloudflare Workers AI 将作为可靠的备用 API，确保服务的高可用性！** 🎉

