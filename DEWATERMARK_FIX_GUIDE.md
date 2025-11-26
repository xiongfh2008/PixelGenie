# 🔧 去水印功能修复指南

## 🚨 问题
使用去水印功能时提示：
```
Dewatermark Failed: API key security issue detected
```

---

## ✅ 快速解决方案

### **方案 1: 使用自动切换的备用 API（推荐，立即可用）**

系统已经自动切换到讯飞星火 API，去水印功能应该可以正常使用了。

#### 验证步骤：
1. **刷新浏览器页面** (按 F5 或 Ctrl+R)
2. 重新上传图片
3. 切换到"去水印"功能
4. 尝试使用去水印功能

**如果仍然失败**，请查看浏览器控制台（按 F12）的错误信息，并继续下面的步骤。

---

### **方案 2: 更换 Google API 密钥（长期解决方案）**

#### 步骤 1: 删除旧的泄露密钥

1. 访问 [Google AI Studio API Keys](https://aistudio.google.com/app/apikey)
2. 登录您的 Google 账户
3. 找到被标记为"泄露"或"已禁用"的 API 密钥
4. 点击删除按钮（垃圾桶图标）

#### 步骤 2: 创建新的 API 密钥

1. 在同一页面点击 **Create API Key** 按钮
2. 选择您的 Google Cloud 项目
   - 如果没有项目，点击 **Create new project**
   - 输入项目名称（如 "PixelGenie"）
3. 点击 **Create API key in existing project**
4. **立即复制新密钥**（只显示一次！）

#### 步骤 3: 更新环境变量

1. 打开项目文件夹中的 `server/.env` 文件
2. 找到这一行：
   ```env
   GOOGLE_API_KEY=旧的密钥
   ```
3. 替换为新密钥：
   ```env
   GOOGLE_API_KEY=新的密钥
   ```
4. 保存文件

#### 步骤 4: 重置健康状态

```bash
cd server
node reset-google-health.js
```

#### 步骤 5: 重启服务器

```bash
# 停止当前服务器（在终端按 Ctrl+C）
# 然后重新启动
npm run dev:all
```

#### 步骤 6: 验证

查看终端输出，应该看到：
```
✅ Health check passed for google
🔑 Active provider (primary): google
```

---

## 🔍 为什么会发生密钥泄露？

### 常见原因：

1. **提交到 Git 仓库**
   - `.env` 文件被意外提交到 GitHub/GitLab
   - API 密钥在代码中硬编码

2. **公开分享**
   - 在论坛、聊天中分享了包含密钥的代码
   - 截图中包含了密钥

3. **日志文件**
   - 密钥被写入了公开的日志文件
   - 错误信息中包含了密钥

### Google 的自动检测
Google 会自动扫描：
- 公开的 GitHub 仓库
- 公开的 Gist
- 公开的网站和日志
- 其他可访问的网络资源

一旦检测到密钥泄露，会立即禁用该密钥以保护您的账户。

---

## 🔒 防止未来泄露

### 1. 确保 .gitignore 正确配置

检查项目根目录的 `.gitignore` 文件是否包含：

```gitignore
# Environment variables
.env
.env.local
.env.*.local
server/.env
```

验证命令：
```bash
cat .gitignore | grep .env
```

### 2. 检查 Git 历史

如果您曾经提交过密钥：

```bash
# 搜索历史记录中的 API 密钥
git log --all -p | grep "AIzaSy"
```

如果找到，需要清理 Git 历史（高级操作）：
```bash
# 使用 git filter-branch 或 BFG Repo-Cleaner
# 建议先备份仓库
```

### 3. 使用环境变量

✅ **正确做法**：
```javascript
const API_KEY = process.env.GOOGLE_API_KEY;
```

❌ **错误做法**：
```javascript
const API_KEY = "AIzaSyC..."; // 永远不要这样做！
```

### 4. 定期轮换密钥

建议每 3-6 个月更换一次 API 密钥。

### 5. 限制密钥权限

在 Google Cloud Console 中：
- 只授予必要的 API 权限
- 设置 IP 限制（如果可能）
- 设置 HTTP referrer 限制

---

## 📊 当前系统状态

### API 提供商状态

| 提供商 | 状态 | 说明 |
|--------|------|------|
| Google Gemini | ❌ 已泄露 | 需要更换密钥 |
| 讯飞星火 | ✅ 健康 | **当前使用中** |
| Cloudflare | ✅ 健康 | 备用 |
| HuggingFace | ✅ 健康 | 备用 |
| DeepSeek | ✅ 健康 | 备用 |

### 自动切换机制

系统会自动：
1. 检测到 Google API 密钥泄露
2. 标记 Google 为不健康
3. 自动切换到讯飞星火 API
4. 跳过 Google API，不再尝试使用

**终端日志**：
```
🚨 CRITICAL: API key leak detected for google!
🔄 Switching from google to xunfei due to API key leak
🚫 Skipping google due to detected API key leak
🔑 Active provider (primary): xunfei
```

---

## 🧪 测试去水印功能

### 测试步骤：

1. **刷新浏览器**
   ```
   按 F5 或 Ctrl+R
   ```

2. **上传测试图片**
   - 选择一张带水印的图片
   - 或使用任意图片进行测试

3. **切换到去水印模式**
   - 点击左侧菜单的"去水印"选项

4. **选择模式**
   - **手动模式**：用画笔标记水印区域
   - **自动模式**：输入水印描述（如 "watermark", "logo"）

5. **点击"Remove Watermark"按钮**

6. **查看结果**
   - 如果成功，会显示处理后的图片
   - 如果失败，查看错误信息

### 预期结果：

✅ **成功**：
```
[显示处理后的图片]
```

❌ **如果仍然失败**：
1. 打开浏览器控制台（F12）
2. 查看 Network 标签页
3. 找到 `/api/modify-image` 请求
4. 查看响应内容
5. 将错误信息反馈给开发者

---

## 🆘 故障排除

### 问题 1: 刷新后仍然报错

**原因**：浏览器缓存了旧的错误状态

**解决方案**：
1. 硬刷新：Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
2. 清除浏览器缓存
3. 使用隐私/无痕模式测试

### 问题 2: 服务器没有切换 API

**原因**：服务器需要重启以应用新的健康状态

**解决方案**：
```bash
# 停止服务器（Ctrl+C）
npm run dev:all
```

### 问题 3: 所有 API 都失败

**原因**：网络问题或所有 API 密钥都有问题

**解决方案**：
1. 检查网络连接
2. 查看服务器日志
3. 运行健康检查：
   ```bash
   cd server
   node test-cloudflare.js
   ```

### 问题 4: 讯飞 API 也失败

**原因**：讯飞 API 配置不完整或密钥无效

**解决方案**：
检查 `server/.env` 文件中的讯飞配置：
```env
XUNFEI_API_KEY=your_key
XUNFEI_APP_ID=your_app_id
XUNFEI_API_SECRET=your_secret
```

如果缺少任何一项，需要：
1. 访问 [讯飞开放平台](https://www.xfyun.cn/)
2. 获取完整的凭证
3. 更新 `.env` 文件

---

## 📝 总结

### 当前状态
- ✅ 系统已自动切换到讯飞星火 API
- ✅ 去水印功能应该可以正常使用
- ⚠️ Google API 需要更换新密钥

### 立即可做
1. **刷新浏览器**，尝试使用去水印功能
2. 如果可用，继续使用即可

### 后续建议
1. 更换 Google API 密钥（参考上面的步骤）
2. 检查 `.gitignore` 配置
3. 定期轮换 API 密钥

---

## 📞 获取帮助

如果问题仍未解决：

1. **查看服务器日志**
   - 查看终端输出
   - 寻找错误信息

2. **查看浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签页

3. **参考相关文档**
   - `FIX_GOOGLE_API_KEY.md` - Google API 密钥修复指南
   - `CLOUDFLARE_SUCCESS_REPORT.md` - Cloudflare API 配置
   - `README.md` - 项目总览

---

**祝您使用顺利！** 🎉

