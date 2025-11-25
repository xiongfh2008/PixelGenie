<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PixelGenie - AI 图像分析与处理平台

这是一个功能强大的 AI 图像分析和处理平台，支持智能鉴伪、图像修改、文字翻译等功能。

View your app in AI Studio: https://ai.studio/apps/drive/1d3GbLTY1wX2iTqKSeHGvwrP_uu013-zi

## 主要特性

- 🔍 **智能鉴伪分析**：使用 AI 检测图像真伪和篡改
- 🎨 **图像智能修改**：基于自然语言描述修改图像
- 🌐 **图像文字翻译**：提取并翻译图像中的文字
- 🔄 **多 API 支持**：支持多个 AI 提供商，自动故障转移
- 🆓 **免费备用 API**：集成 Cloudflare Workers AI 作为免费备用方案

## 快速开始

**前置要求：** Node.js 16+

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥

#### 方式 A：使用配置向导（推荐）

```bash
# 快速配置 Cloudflare Workers AI（免费）
powershell -ExecutionPolicy Bypass -File setup-cloudflare.ps1
```

#### 方式 B：手动配置

1. 复制环境变量模板：
   ```bash
   copy server\env.template server\.env
   ```

2. 编辑 `server\.env` 文件，填入您的 API 密钥：
   ```env
   # 至少配置一个 API 密钥
   GOOGLE_API_KEY=your_google_api_key_here
   
   # 推荐：配置 Cloudflare 作为免费备用 API
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
   ```

3. 获取 Cloudflare API 凭证（免费）：
   - 详细步骤请查看 [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)
   - 或访问：https://dash.cloudflare.com/profile/api-tokens

### 3. 启动应用

```bash
# 启动完整应用（前端 + 后端）
npm run dev:all

# 或分别启动
npm run dev          # 前端
npm run dev:server   # 后端
```

### 4. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001

## API 提供商配置

本项目支持多个 AI API 提供商，并具有自动故障转移功能：

### 优先级配置

1. **主用提供商**（Primary）：
   - Google Gemini
   - 讯飞星火

2. **备用提供商**（Backup）：
   - **Cloudflare Workers AI** ⭐ 推荐（免费 10,000 次/天）
   - HuggingFace
   - DeepSeek

3. **后备提供商**（Fallback）：
   - 百度文心
   - 腾讯混元
   - 阿里通义

### Cloudflare Workers AI 集成

✅ **完全免费**：每天 10,000 次请求
✅ **无需信用卡**：免费计划无需绑定支付方式
✅ **自动故障转移**：当主 API 失败时自动切换

详细配置指南：[CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)

## 项目结构

```
PixelGenie/
├── components/          # React 组件
├── services/           # API 服务
├── server/            # 后端服务器
│   ├── index.js       # 主服务器文件
│   ├── .env           # 环境变量（需自行创建）
│   └── env.template   # 环境变量模板
├── CLOUDFLARE_SETUP.md # Cloudflare 配置指南
├── setup-cloudflare.ps1 # 快速配置脚本
└── README.md          # 本文件
```

## 功能说明

### 智能鉴伪分析

- ELA（Error Level Analysis）错误级别分析
- MFR（Median Filter Residual）中值滤波残差分析
- AI 生成图像检测
- 图像篡改检测

### 图像修改

- 基于自然语言描述修改图像
- 智能对象移除
- 风格转换

### 文字翻译

- 自动检测图像中的文字
- 支持多语言翻译
- 保留原始布局信息

## 故障排除

### API 密钥相关

**问题**：服务器启动时提示 "No API keys found"

**解决方案**：
1. 确认 `server\.env` 文件存在
2. 确认至少配置了一个 API 密钥
3. 重启服务器

### Cloudflare API 相关

**问题**：Cloudflare API 调用失败

**解决方案**：
1. 检查 API Token 和 Account ID 是否正确
2. 确认 Token 权限包含 "Workers AI - Read"
3. 查看详细排错指南：[CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)

## 监控和健康检查

查看 API 健康状态：
```bash
# 访问健康检查端点
http://localhost:3001/api/health
```

## 相关文档

- [Cloudflare Workers AI 配置指南](CLOUDFLARE_SETUP.md)
- [安全说明](SECURITY.md)
- [免费 API 选项报告](FREE_API_OPTIONS.md)

## 技术栈

- **前端**：React + TypeScript + Vite
- **后端**：Node.js + Express
- **AI 模型**：
  - Google Gemini 2.0 Flash
  - Cloudflare Llama 3.2 11B Vision
  - HuggingFace Models
  - 其他商业 AI API

## License

MIT License

## 支持

如有问题，请：
1. 查看相关文档
2. 检查服务器日志
3. 提交 Issue
