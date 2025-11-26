# 🔐 修复 Google API 密钥泄露问题

## 🚨 问题
您的 Google Gemini API 密钥已被检测为泄露并被禁用。

**错误信息**:
```
Your API key was reported as leaked. Please use another API key.
```

---

## ✅ 解决方案 1: 生成新的 Google API 密钥（推荐）

### 步骤 1: 删除旧的 API 密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登录您的 Google 账户
3. 找到被标记为"泄露"的 API 密钥
4. 点击 **删除** 或 **撤销** 按钮

### 步骤 2: 创建新的 API 密钥

1. 在同一页面点击 **Create API Key**
2. 选择您的 Google Cloud 项目（或创建新项目）
3. 点击 **Create API key in existing project**
4. **立即复制** 新的 API 密钥（只会显示一次）

### 步骤 3: 更新环境变量

1. 打开 `server/.env` 文件
2. 找到 `GOOGLE_API_KEY` 这一行
3. 替换为新的 API 密钥：

```env
GOOGLE_API_KEY=your_new_api_key_here
```

### 步骤 4: 重置 API 健康状态

```bash
cd server
node reset-google-health.js
```

### 步骤 5: 重启服务器

```bash
# 停止当前服务器（按 Ctrl+C）
npm run dev:all
```

---

## ✅ 解决方案 2: 暂时使用其他 API 提供商

如果您暂时无法获取新的 Google API 密钥，系统会自动切换到其他可用的 API：

### 当前可用的 API 提供商：
- ✅ **讯飞星火 (Xunfei)** - 已配置并健康
- ✅ **Cloudflare Workers AI** - 已配置并健康
- ✅ **HuggingFace** - 已配置并健康
- ✅ **DeepSeek** - 已配置并健康

### 系统会自动使用备用 API
服务器已经自动切换到讯飞星火 API，您可以继续使用去水印功能。

**日志显示**:
```
🔄 Switching from google to xunfei due to API key leak
🔑 Active provider (primary): xunfei
```

---

## 🔒 防止未来泄露的最佳实践

### 1. 检查 .gitignore
确保 `.env` 文件在 `.gitignore` 中：

```bash
# 检查
cat .gitignore | grep .env
```

应该看到：
```
.env
server/.env
```

### 2. 不要在代码中硬编码 API 密钥
❌ 错误做法：
```javascript
const API_KEY = "AIzaSyC..."; // 永远不要这样做
```

✅ 正确做法：
```javascript
const API_KEY = process.env.GOOGLE_API_KEY;
```

### 3. 检查 Git 历史
如果您曾经提交过包含 API 密钥的代码：

```bash
# 搜索历史记录
git log -p | grep "AIzaSy"
```

如果找到，需要清理 Git 历史（高级操作，请谨慎）。

### 4. 使用环境变量管理工具
- 本地开发：使用 `.env` 文件
- 生产环境：使用环境变量或密钥管理服务

### 5. 定期轮换 API 密钥
建议每 3-6 个月更换一次 API 密钥。

---

## 🧪 验证修复

### 方法 1: 测试 Google API
如果您已更新 API 密钥：

```bash
cd server
node << 'EOF'
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const testGoogleAPI = async () => {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'X-goog-api-key': process.env.GOOGLE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    }
  );
  
  const data = await response.json();
  
  if (data.error) {
    console.log('❌ Google API 测试失败:', data.error.message);
  } else {
    console.log('✅ Google API 测试成功！');
  }
};

testGoogleAPI();
EOF
```

### 方法 2: 使用备用 API
系统已自动切换到讯飞星火，您可以直接使用去水印功能。

---

## 📊 当前系统状态

### API 提供商优先级（自动切换）

1. **主用提供商**:
   - ~~Google Gemini~~ ❌ 已泄露，已跳过
   - **讯飞星火** ✅ 当前使用

2. **备用提供商**:
   - Cloudflare Workers AI ✅
   - HuggingFace ✅
   - DeepSeek ✅

### 去水印功能状态
✅ **可用** - 系统已自动切换到讯飞星火 API

---

## 🎯 快速修复步骤总结

### 如果要继续使用 Google API：
1. 访问 https://aistudio.google.com/app/apikey
2. 删除旧密钥
3. 创建新密钥
4. 更新 `server/.env` 文件
5. 重启服务器

### 如果暂时使用其他 API：
**无需操作** - 系统已自动切换，去水印功能可正常使用

---

## 💡 推荐操作

**立即**: 使用系统自动切换的讯飞星火 API，继续使用去水印功能

**稍后**: 生成新的 Google API 密钥并更新配置，以获得更好的性能

---

## 📞 需要帮助？

如果遇到问题：
1. 查看服务器日志确认当前使用的 API
2. 运行健康检查脚本
3. 参考 `CLOUDFLARE_SUCCESS_REPORT.md` 了解其他 API 配置

---

**重要**: 请立即更换您的 Google API 密钥，以确保账户安全！

