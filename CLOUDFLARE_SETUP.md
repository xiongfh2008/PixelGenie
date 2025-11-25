# Cloudflare Workers AI 集成指南

## 概述

Cloudflare Workers AI 已成功集成到 PixelGenie 项目中，作为备用 API 提供商。它提供免费的 AI 模型访问，包括 Llama 3.2 11B Vision Instruct 模型，用于图像分析和文本处理。

## 优势

✅ **免费额度充足**：每天 10,000 次免费请求
✅ **无需信用卡**：免费计划无需绑定支付方式
✅ **全球 CDN**：Cloudflare 的全球网络确保低延迟
✅ **视觉理解**：支持 Llama Vision 模型进行图像分析
✅ **自动故障转移**：当主 API 失败时自动切换

## 获取 API 凭证

### 步骤 1：注册 Cloudflare 账户

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 注册或登录您的账户

### 步骤 2：获取 Account ID

1. 登录后，在右侧边栏找到您的 **Account ID**
2. 或访问：`https://dash.cloudflare.com/` → 右侧显示 Account ID
3. 复制这个 ID（格式类似：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`）

### 步骤 3：创建 API Token

1. 访问 [API Tokens 页面](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **"Create Token"**
3. 选择 **"Create Custom Token"**
4. 配置权限：
   - **Permissions（权限）**：
     - Account → Workers AI → Read
   - **Account Resources（账户资源）**：
     - Include → 选择您的账户
   - **TTL（有效期）**：根据需要设置（建议：永久或 1 年）
5. 点击 **"Continue to summary"**
6. 点击 **"Create Token"**
7. **重要**：立即复制并保存 Token（只显示一次！）

## 配置项目

### 更新 server/.env 文件

在 `server/.env` 文件中添加以下配置：

```env
# Cloudflare Workers AI Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
```

**示例**：
```env
CLOUDFLARE_API_TOKEN=abcdefghijklmnopqrstuvwxyz1234567890ABCD
CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 重启服务器

配置完成后，重启服务器以加载新的环境变量：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev:server
```

## 验证集成

### 检查服务器日志

启动服务器后，您应该看到类似以下的日志：

```
✅ Available API keys: google, cloudflare, huggingface
🔑 Active provider (backup): cloudflare
```

### 测试 API

使用智能鉴伪功能上传图片，如果主 API（Google）失败，系统会自动切换到 Cloudflare。

## API 优先级配置

当前配置的 API 优先级：

1. **主用提供商（Primary）**：
   - Google Gemini
   - 讯飞星火

2. **备用提供商（Backup）**：
   - **Cloudflare Workers AI** ⭐ 新增
   - HuggingFace
   - DeepSeek

3. **后备提供商（Fallback）**：
   - 百度文心
   - 腾讯混元
   - 阿里通义

## 支持的功能

Cloudflare Workers AI 当前支持以下功能：

✅ **智能鉴伪分析**（`/api/analyze-image`）
✅ **图像修改**（`/api/modify-image`）
✅ **图像文字翻译**（`/api/translate-image-text`）
✅ **文字检测与翻译**（`/api/detect-text-translate`）

## 使用的模型

- **模型名称**：`@cf/meta/llama-3.2-11b-vision-instruct`
- **类型**：视觉语言模型（Vision-Language Model）
- **能力**：
  - 图像理解和分析
  - 文本提取和翻译
  - 视觉问答
  - 图像描述生成

## 免费额度

Cloudflare Workers AI 免费计划包括：

- **每天 10,000 次请求**
- **无需信用卡**
- **无过期时间**

如果超出免费额度，系统会自动切换到其他可用的 API 提供商。

## 故障排除

### 问题：服务器启动时提示 "No API keys found"

**解决方案**：
1. 确认 `server/.env` 文件存在
2. 确认文件中包含 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`
3. 确认没有多余的空格或引号
4. 重启服务器

### 问题：API 调用失败，返回 401 Unauthorized

**解决方案**：
1. 检查 API Token 是否正确复制（无多余空格）
2. 确认 Token 权限包含 "Workers AI - Read"
3. 检查 Token 是否过期
4. 在 Cloudflare Dashboard 重新生成 Token

### 问题：API 调用失败，返回 404 Not Found

**解决方案**：
1. 检查 Account ID 是否正确
2. 确认您的账户已启用 Workers AI
3. 访问 [Cloudflare Workers AI](https://dash.cloudflare.com/?to=/:account/ai) 确认服务可用

## 监控和健康检查

系统会自动监控 Cloudflare API 的健康状态：

- **成功请求**：标记为健康，优先使用
- **失败请求**：增加错误计数，降低优先级
- **连续失败**：自动切换到其他提供商
- **API 密钥泄露检测**：如检测到密钥泄露，立即停用并切换

查看 API 健康状态：
```bash
# 在浏览器中访问
http://localhost:3001/api/health
```

## 成本优化建议

1. **优先使用免费 API**：
   - Cloudflare（10,000 次/天）
   - HuggingFace（免费，有速率限制）

2. **付费 API 作为后备**：
   - Google Gemini（按使用量付费）
   - 其他商业 API

3. **监控使用量**：
   - 定期检查 Cloudflare Dashboard 的使用统计
   - 设置告警通知

## 相关链接

- [Cloudflare Workers AI 文档](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [API Token 管理](https://dash.cloudflare.com/profile/api-tokens)
- [Workers AI 模型目录](https://developers.cloudflare.com/workers-ai/models/)
- [定价信息](https://developers.cloudflare.com/workers-ai/platform/pricing/)

## 技术支持

如有问题，请：
1. 查看服务器日志获取详细错误信息
2. 访问 [Cloudflare Community](https://community.cloudflare.com/)
3. 查阅项目 README.md 和 SECURITY.md

---

**更新日期**：2025-11-25
**集成版本**：v1.0.0

