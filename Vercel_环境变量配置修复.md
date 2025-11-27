# 🚨 Vercel HTTP 401 错误修复指南

## 🔍 错误原因

**错误信息**：`Error processing image: HTTP 401`

**原因**：Vercel 部署后，环境变量（API 密钥）没有配置或配置错误。

---

## ✅ 立即修复步骤

### 步骤 1：登录 Vercel Dashboard

1. 访问 https://vercel.com
2. 登录您的账号
3. 找到 `pixel-genie-iota` 项目
4. 点击进入项目

### 步骤 2：配置环境变量

1. **点击 Settings 标签**
2. **点击左侧 Environment Variables**
3. **添加以下环境变量**：

#### 必需的环境变量

```bash
# Google API（用于图像分析和生成）
GOOGLE_API_KEY=您的Google API密钥

# Cloudflare API（用于图像分析）
CLOUDFLARE_ACCOUNT_ID=您的Cloudflare账号ID
CLOUDFLARE_API_TOKEN=您的Cloudflare API令牌

# HuggingFace API（用于图像编辑）
HUGGINGFACE_API_KEY=您的HuggingFace API密钥

# 讯飞 API（用于文本识别和翻译）
XUNFEI_APP_ID=您的讯飞APPID
XUNFEI_API_SECRET=您的讯飞API密钥
XUNFEI_API_KEY=您的讯飞API Key
```

#### 添加方法

对于每个环境变量：

1. **Key (名称)**：输入变量名（如 `GOOGLE_API_KEY`）
2. **Value (值)**：输入您的 API 密钥
3. **Environment**：选择 **Production, Preview, Development** ✅（全选）
4. 点击 **Add**

### 步骤 3：重新部署

配置完环境变量后：

1. **进入 Deployments 标签**
2. **找到最新的部署**
3. **点击右侧的 ⋯ 菜单**
4. **选择 "Redeploy"**
5. **确认重新部署**

或者：

1. **推送一个新的提交到 GitHub**
2. Vercel 会自动重新部署

---

## 🔑 获取 API 密钥

如果您没有某些 API 密钥，这里是获取方法：

### 1. Google API Key

1. 访问 https://makersuite.google.com/app/apikey
2. 点击 "Create API Key"
3. 复制密钥

### 2. Cloudflare API

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 创建 API Token
3. 选择 "Workers AI" 权限
4. 复制 Token 和 Account ID

### 3. HuggingFace API Key

1. 访问 https://huggingface.co/settings/tokens
2. 点击 "New token"
3. 选择 "Read" 权限
4. 复制 Token

### 4. 讯飞 API

1. 访问 https://console.xfyun.cn/
2. 创建应用
3. 获取 APPID、API Key、API Secret

---

## 📋 环境变量配置示例

在 Vercel Dashboard 中应该看到：

```
GOOGLE_API_KEY              AIzaSy...              Production, Preview, Development
CLOUDFLARE_ACCOUNT_ID       abc123...              Production, Preview, Development
CLOUDFLARE_API_TOKEN        xyz789...              Production, Preview, Development
HUGGINGFACE_API_KEY         hf_abc...              Production, Preview, Development
XUNFEI_APP_ID               12345678               Production, Preview, Development
XUNFEI_API_SECRET           abc123...              Production, Preview, Development
XUNFEI_API_KEY              def456...              Production, Preview, Development
```

---

## 🔍 验证配置

### 方法 1：检查 Vercel 日志

1. Vercel Dashboard > 您的项目
2. 点击最新的 Deployment
3. 点击 "Functions" 标签
4. 查看 `/api/*` 函数的日志
5. 确认没有 "API key not found" 错误

### 方法 2：测试功能

重新部署后：

1. 访问您的网站
2. 上传一张图片
3. 测试各个功能：
   - ✅ 智能鉴伪
   - ✅ 智能去水印
   - ✅ 图文翻译

---

## ⚠️ 常见问题

### 问题 1：环境变量配置后仍然报错

**解决**：
1. 确认环境变量的 **Environment** 选择了 **Production**
2. 必须 **重新部署** 才能生效
3. 清除浏览器缓存并刷新

### 问题 2：某些功能可用，某些不可用

**原因**：部分 API 密钥配置错误或缺失

**解决**：
1. 检查哪个功能报错
2. 确认对应的 API 密钥是否正确配置
3. 验证 API 密钥是否有效（未过期、有配额）

### 问题 3：本地开发正常，Vercel 部署报错

**原因**：本地 `.env` 文件的环境变量没有同步到 Vercel

**解决**：
1. 检查本地 `.env` 文件
2. 将所有环境变量添加到 Vercel
3. 确保变量名完全一致

---

## 🚀 快速修复脚本

如果您想批量添加环境变量，可以使用 Vercel CLI：

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录

```bash
vercel login
```

### 3. 链接项目

```bash
cd D:\AIProject\PixelGenie
vercel link
```

### 4. 添加环境变量

```bash
# 添加 Google API Key
vercel env add GOOGLE_API_KEY production

# 添加 Cloudflare
vercel env add CLOUDFLARE_ACCOUNT_ID production
vercel env add CLOUDFLARE_API_TOKEN production

# 添加 HuggingFace
vercel env add HUGGINGFACE_API_KEY production

# 添加讯飞
vercel env add XUNFEI_APP_ID production
vercel env add XUNFEI_API_SECRET production
vercel env add XUNFEI_API_KEY production
```

系统会提示您输入每个变量的值。

### 5. 重新部署

```bash
vercel --prod
```

---

## 📊 环境变量检查清单

- [ ] `GOOGLE_API_KEY` 已添加
- [ ] `CLOUDFLARE_ACCOUNT_ID` 已添加
- [ ] `CLOUDFLARE_API_TOKEN` 已添加
- [ ] `HUGGINGFACE_API_KEY` 已添加
- [ ] `XUNFEI_APP_ID` 已添加
- [ ] `XUNFEI_API_SECRET` 已添加
- [ ] `XUNFEI_API_KEY` 已添加
- [ ] 所有变量的 Environment 都选择了 Production
- [ ] 已重新部署
- [ ] 功能测试通过

---

## 🎯 最简单的方法

### 通过 Vercel Dashboard（推荐）

1. **访问** https://vercel.com/dashboard
2. **进入项目** pixel-genie-iota
3. **Settings** > **Environment Variables**
4. **逐个添加** 上面列出的 7 个环境变量
5. **Deployments** > **Redeploy**
6. **等待 2-3 分钟**
7. **刷新网站测试**

---

## 🔐 安全提示

1. **不要在代码中硬编码 API 密钥**
2. **不要将 `.env` 文件提交到 Git**
3. **定期轮换 API 密钥**
4. **为不同环境使用不同的密钥**
5. **监控 API 使用量，防止滥用**

---

## 📖 相关文档

- 📄 Vercel 环境变量文档：https://vercel.com/docs/concepts/projects/environment-variables
- 📄 Google API 文档：https://ai.google.dev/
- 📄 Cloudflare Workers AI 文档：https://developers.cloudflare.com/workers-ai/
- 📄 HuggingFace 文档：https://huggingface.co/docs

---

## 🎊 修复完成后

您应该能够：
- ✅ 上传图片进行智能鉴伪
- ✅ 使用智能去水印功能
- ✅ 使用图文翻译功能
- ✅ 所有 API 调用正常工作

**不会再看到 HTTP 401 错误！**

---

**修复时间**: 2025-11-26  
**状态**: ✅ 详细修复指南  
**预计修复时间**: 5-10 分钟

