# Cloudflare Workers AI 快速配置指南 ⚡

## 🎯 3 分钟完成配置

### 第 1 步: 获取凭证（2 分钟）

1. **打开浏览器访问**: https://dash.cloudflare.com/
2. **登录或注册** Cloudflare 账户（完全免费）
3. **复制 Account ID**:
   - 在右侧边栏找到 **Account ID**
   - 点击复制按钮
4. **创建 API Token**:
   - 点击右上角头像 → **My Profile** → **API Tokens**
   - 点击 **Create Token** → **Create Custom Token**
   - 设置名称: `PixelGenie`
   - 权限: Account → Workers AI → Read + Edit
   - 点击 **Create Token** 并复制

### 第 2 步: 配置项目（30 秒）

打开 `server/.env` 文件，找到这两行：

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

**替换为您刚才复制的值**，例如：

```env
CLOUDFLARE_ACCOUNT_ID=1234567890abcdef1234567890abcdef
CLOUDFLARE_API_TOKEN=abcdef1234567890_abcdef1234567890_abcdef1234567890
```

保存文件。

### 第 3 步: 测试配置（30 秒）

在项目根目录运行：

```bash
npm run test:cloudflare
```

**预期输出**:

```
🧪 Cloudflare Workers AI 配置测试
============================================================

📋 步骤 1: 检查环境变量
------------------------------------------------------------
✅ CLOUDFLARE_ACCOUNT_ID: 12345678...
✅ CLOUDFLARE_API_TOKEN: abcdef1234...

🔐 步骤 2: 验证 API Token
------------------------------------------------------------
✅ API Token 验证成功
   Token Status: active

📦 步骤 3: 获取可用模型列表
------------------------------------------------------------
✅ 成功获取模型列表
   找到 X 个视觉模型:
   - @cf/meta/llama-3.2-11b-vision-instruct

💬 步骤 4: 测试文本生成（无图像）
------------------------------------------------------------
✅ 文本生成测试成功

🖼️  步骤 5: 测试图像分析
------------------------------------------------------------
✅ 图像分析测试成功

============================================================
🎉 测试完成！
============================================================
```

### 第 4 步: 启动服务（10 秒）

```bash
npm run dev:all
```

**完成！** 🎉 Cloudflare Workers AI 现在已作为备用 API 集成到您的项目中。

---

## 🔍 验证集成

使用项目的 **智能鉴伪** 功能上传图片，在控制台查看日志：

```
✅ Available API keys: google, xunfei, deepseek, huggingface, cloudflare
🔑 Active provider (backup): cloudflare
```

如果看到 `cloudflare` 出现在日志中，说明集成成功！

---

## ❓ 遇到问题？

### 问题 1: 测试脚本报错 "未配置"

**解决**: 确保 `.env` 文件中的值不是 `your_account_id_here` 或 `your_api_token_here`

### 问题 2: "401 Unauthorized"

**解决**: 
1. 检查 API Token 是否正确复制（不要有多余空格）
2. 确认 Token 权限包含 Workers AI Read + Edit
3. 重新创建 Token

### 问题 3: "Account ID not found"

**解决**: 重新从 Cloudflare Dashboard 复制 Account ID

---

## 📚 更多信息

- **完整文档**: `CLOUDFLARE_SETUP_GUIDE.md`
- **免费额度**: 每天 10,000 次请求
- **模型**: Llama 3.2 11B Vision Instruct
- **优先级**: 备用 API（主用失败时自动切换）

---

**享受高可用的 AI 图像分析服务！** 🚀

