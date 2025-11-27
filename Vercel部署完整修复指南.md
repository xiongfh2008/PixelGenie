# 🚀 Vercel部署完整修复指南

## 🔍 问题诊断

**错误**: "去水印失败: 处理失败，请重试"

**原因**: Vercel部署后，前端无法正确连接到后端API，或者后端API密钥未配置。

---

## ✅ 完整修复方案

### 第一步：配置Vercel环境变量

#### 1. 登录Vercel Dashboard

1. 访问 https://vercel.com
2. 登录您的账号
3. 找到您的项目（如 `pixel-genie-iota`）
4. 点击进入项目

#### 2. 添加环境变量

点击 **Settings** → **Environment Variables**，添加以下变量：

#### 🔑 后端API密钥（必需）

```bash
# Google Gemini API（推荐 - 支持所有功能）
GOOGLE_API_KEY=你的Google_API密钥

# Cloudflare Workers AI（备用）
CLOUDFLARE_API_TOKEN=你的Cloudflare令牌
CLOUDFLARE_ACCOUNT_ID=你的Cloudflare账号ID

# HuggingFace API（备用）
HUGGINGFACE_API_KEY=你的HuggingFace密钥

# 讯飞 API（可选）
XUNFEI_APP_ID=你的讯飞APPID
XUNFEI_API_SECRET=你的讯飞密钥
XUNFEI_API_KEY=你的讯飞APIKey

# DeepSeek API（可选）
DEEPSEEK_API_KEY=你的DeepSeek密钥
```

#### 🌐 前端API配置（重要！）

```bash
# Vercel部署时，前端需要知道API的URL
# 由于Vercel会将前后端部署在同一个域名下，使用相对路径
VITE_API_BASE_URL=
```

**注意**: `VITE_API_BASE_URL` 留空或设置为空字符串，这样前端会使用相对路径 `/api`，Vercel会自动路由到后端。

#### 📝 环境变量配置要点

对于每个环境变量：
- **Key**: 变量名（如 `GOOGLE_API_KEY`）
- **Value**: 你的实际密钥值
- **Environment**: ✅ 勾选 **Production, Preview, Development**（全选）
- 点击 **Add** 保存

---

### 第二步：修复Vercel配置文件

确保 `vercel.json` 配置正确：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**关键点**:
- `/api/(.*)` 路由会将所有 `/api/*` 请求转发到后端
- 前端静态文件从 `/dist` 目录提供
- 后端使用 `@vercel/node` 作为Serverless Function运行

---

### 第三步：重新部署

配置完环境变量后，必须重新部署：

#### 方法1: 在Vercel Dashboard重新部署

1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **⋯** 菜单
4. 选择 **Redeploy**
5. 确认重新部署

#### 方法2: 推送新提交触发部署

```bash
git add .
git commit -m "Update Vercel configuration"
git push origin main
```

Vercel会自动检测到新提交并重新部署。

---

### 第四步：验证部署

#### 1. 检查环境变量

在Vercel Dashboard中：
1. 进入 **Settings** → **Environment Variables**
2. 确认所有必需的变量都已添加
3. 确认 **Production** 环境已勾选

#### 2. 检查部署日志

1. 进入 **Deployments** 标签
2. 点击最新的部署
3. 查看 **Build Logs**
4. 确认没有错误

#### 3. 测试API连接

访问你的部署URL，在浏览器控制台运行：

```javascript
// 测试健康检查
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('API Status:', data))
  .catch(err => console.error('API Error:', err));
```

应该看到：
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

#### 4. 测试功能

1. 访问你的Vercel部署URL
2. 上传一张图片
3. 尝试使用去水印功能
4. 应该能正常工作

---

## 🔧 常见问题排查

### 问题1: "处理失败，请重试"

**原因**: 
- API密钥未配置或配置错误
- 环境变量未应用到Production环境

**解决**:
1. 检查Vercel环境变量是否正确配置
2. 确认勾选了 **Production** 环境
3. 重新部署项目

### 问题2: "服务暂时不可用"

**原因**: 
- 前端无法连接到后端API
- `VITE_API_BASE_URL` 配置错误

**解决**:
1. 确认 `VITE_API_BASE_URL` 为空或未设置
2. 检查 `vercel.json` 中的路由配置
3. 重新部署

### 问题3: API调用超时

**原因**: 
- Vercel Serverless Function有10秒超时限制（免费版）
- 图像处理可能需要较长时间

**解决**:
1. 升级到Vercel Pro计划（60秒超时）
2. 优化图像大小（前端自动压缩）
3. 使用更快的API提供商

### 问题4: 环境变量不生效

**原因**: 
- 环境变量添加后未重新部署
- 环境变量未应用到正确的环境

**解决**:
1. 确认环境变量已保存
2. 确认勾选了 **Production** 环境
3. 执行重新部署（Redeploy）
4. 清除浏览器缓存后重试

---

## 📊 Vercel部署架构

```
用户浏览器
    ↓
Vercel CDN (静态文件: HTML, CSS, JS)
    ↓
前端请求 /api/*
    ↓
Vercel路由 (vercel.json)
    ↓
Serverless Function (server/index.js)
    ↓
读取环境变量 (API密钥)
    ↓
调用外部API (Google, Cloudflare等)
    ↓
返回结果给前端
```

**关键点**:
- 前端和后端部署在同一个域名下
- 后端作为Serverless Function运行
- API密钥存储在Vercel环境变量中（安全）
- 前端通过相对路径 `/api` 访问后端

---

## 🎯 快速检查清单

部署前检查：
- [ ] `vercel.json` 配置正确
- [ ] `server/index.js` 可以作为Serverless Function运行
- [ ] 前端构建成功（`npm run build`）

Vercel配置检查：
- [ ] 添加了 `GOOGLE_API_KEY` 或其他API密钥
- [ ] `VITE_API_BASE_URL` 为空或未设置
- [ ] 所有环境变量勾选了 **Production**
- [ ] 执行了重新部署

功能测试：
- [ ] 访问部署URL正常
- [ ] `/api/health` 返回正常
- [ ] 上传图片功能正常
- [ ] 去水印功能正常
- [ ] 智能鉴伪功能正常

---

## 🔐 安全提示

1. **不要在代码中硬编码API密钥**
2. **不要将 `.env` 文件提交到Git**
3. **定期轮换API密钥**（建议3-6个月）
4. **监控API使用量**，防止滥用
5. **使用Vercel环境变量**存储敏感信息

---

## 📞 需要帮助？

如果按照以上步骤仍然无法解决问题，请提供：

1. **Vercel部署URL**
2. **错误截图**（浏览器控制台）
3. **部署日志**（Vercel Dashboard → Deployments → Build Logs）
4. **环境变量配置截图**（隐藏密钥值）

---

## ✅ 成功标志

当一切配置正确时：

### Vercel Dashboard
- ✅ 部署状态：Ready
- ✅ 环境变量：已配置
- ✅ Build Logs：无错误

### 浏览器
- ✅ 访问部署URL正常加载
- ✅ 控制台无错误
- ✅ `/api/health` 返回 `{"status":"ok"}`

### 功能测试
- ✅ 上传图片成功
- ✅ 去水印功能正常
- ✅ 智能鉴伪功能正常
- ✅ 所有AI功能可用

---

**现在请按照上述步骤配置Vercel环境变量并重新部署！** 🚀

