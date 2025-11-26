# 🔧 修复 "API Key Error: API key expired" 问题

## 📋 问题诊断

您遇到的错误：
```
API Key Error: API key expired. Please renew the API key
Please set VITE_API_KEY in your .env file.
```

**好消息**：经过检查，您的 API 密钥都是有效的！✅

这个错误很可能是由以下原因之一引起的：

---

## 🎯 解决方案

### 方案 1: 清除浏览器缓存并重启（最常见）

```bash
# 1. 停止当前运行的服务器
# 按 Ctrl+C

# 2. 清除构建缓存
Remove-Item -Recurse -Force dist, node_modules\.vite

# 3. 重启服务器
npm run dev:all
```

**然后在浏览器中**：
1. 按 `Ctrl + Shift + Delete` 打开清除浏览器数据
2. 选择"缓存的图像和文件"
3. 点击"清除数据"
4. 刷新页面 (`Ctrl + F5` 强制刷新)

---

### 方案 2: 确保后端服务器正常运行

```bash
# 检查后端服务器是否在运行
curl http://localhost:3001/api/health

# 预期响应:
# {"status":"ok","message":"Server is running"}
```

如果没有响应，说明后端服务器没有运行：

```bash
# 重启服务器
npm run dev:all
```

---

### 方案 3: 检查环境变量

```bash
# 运行诊断脚本
node fix-vite-api-error.js
node check-api-status.js
```

**确认以下配置**：

#### 根目录 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3001
```

#### `server/.env` 文件：
```env
GOOGLE_API_KEY=你的密钥
CLOUDFLARE_API_TOKEN=你的token
CLOUDFLARE_ACCOUNT_ID=你的账户ID
```

---

### 方案 4: 完全重置（终极方案）

如果以上方法都不行，执行完全重置：

```bash
# 1. 停止所有服务
# Ctrl+C

# 2. 清除所有缓存
Remove-Item -Recurse -Force dist, node_modules\.vite, server\node_modules\.cache

# 3. 重新安装依赖（可选）
npm install
cd server
npm install
cd ..

# 4. 重启服务器
npm run dev:all
```

**然后清除浏览器**：
1. 关闭所有 `localhost:5173` 标签页
2. 清除浏览器缓存
3. 重新打开 `http://localhost:5173`

---

## 🧪 验证修复

### 1. 检查后端健康状态

```bash
curl http://localhost:3001/api/health
```

**预期响应**：
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 2. 检查 API 密钥状态

```bash
node check-api-status.js
```

**预期输出**：
```
✅ GOOGLE_API_KEY 已配置
✅ Google API 测试成功
✅ Cloudflare 配置完整
✅ Cloudflare API 测试成功
```

### 3. 测试智能鉴伪功能

1. 打开浏览器：http://localhost:5173
2. 上传一张图片
3. 点击"智能鉴伪"
4. 查看是否正常工作

---

## 🔍 深度诊断

如果问题仍然存在，请检查浏览器控制台：

### 打开浏览器控制台（F12）

查看是否有以下错误：

#### 错误 1: 网络错误
```
Failed to fetch
NetworkError
```

**解决**：后端服务器没有运行，执行 `npm run dev:all`

---

#### 错误 2: CORS 错误
```
CORS policy: No 'Access-Control-Allow-Origin' header
```

**解决**：检查 `server/index.js` 是否有 CORS 配置：
```javascript
app.use(cors());
```

---

#### 错误 3: 404 错误
```
GET http://localhost:3001/api/analyze-image 404
```

**解决**：后端路由配置问题，检查 `server/index.js`

---

## 📊 常见原因排查

| 原因 | 症状 | 解决方案 |
|------|------|---------|
| 浏览器缓存 | 旧的错误信息 | 清除缓存 + 强制刷新 |
| 后端未运行 | 网络错误 | `npm run dev:all` |
| 端口冲突 | 服务器启动失败 | 更改端口或关闭占用进程 |
| 环境变量未加载 | API 密钥错误 | 重启服务器 |
| 代码版本不匹配 | 各种奇怪错误 | 完全重置 |

---

## 🎯 快速修复命令

**一键修复脚本**：

```powershell
# 停止服务器（如果正在运行）
# 按 Ctrl+C

# 清除缓存
Remove-Item -Recurse -Force dist, node_modules\.vite -ErrorAction SilentlyContinue

# 重启服务器
npm run dev:all
```

**然后在浏览器中按 `Ctrl + Shift + R` 强制刷新**

---

## 💡 预防措施

为了避免将来出现类似问题：

### 1. 定期清除缓存

```bash
# 添加到 package.json scripts
"clean": "rm -rf dist node_modules/.vite server/node_modules/.cache"
```

### 2. 使用环境变量检查

在 `services/geminiService.ts` 开头添加：

```typescript
// 开发环境检查
if (import.meta.env.DEV) {
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
}
```

### 3. 添加更好的错误提示

在前端添加更详细的错误处理，显示实际的错误信息而不是通用的 "API key expired"。

---

## 🆘 仍然无法解决？

如果以上所有方法都尝试过了，问题仍然存在，请提供以下信息：

1. **浏览器控制台完整错误信息**（F12 → Console）
2. **Network 标签页的请求详情**（F12 → Network）
3. **后端服务器日志**
4. **运行以下命令的输出**：
   ```bash
   node check-api-status.js
   curl http://localhost:3001/api/health
   ```

---

## 🎊 总结

**最可能的原因**：浏览器缓存

**最快的解决方案**：
1. 清除浏览器缓存
2. 重启开发服务器
3. 强制刷新页面（Ctrl + Shift + R）

**验证修复**：上传图片测试智能鉴伪功能

---

**现在请执行以下命令：**

```bash
# 1. 清除缓存
Remove-Item -Recurse -Force dist, node_modules\.vite -ErrorAction SilentlyContinue

# 2. 重启服务器
npm run dev:all
```

**然后在浏览器中按 `Ctrl + Shift + R` 强制刷新！** ✨

