# 🔒 GitHub 发布安全指南 - 防止 API 密钥泄露

## 📋 目录
1. [当前安全状态检查](#当前安全状态检查)
2. [立即执行的安全措施](#立即执行的安全措施)
3. [Git Hooks 自动检查](#git-hooks-自动检查)
4. [检查历史记录](#检查历史记录)
5. [持续安全实践](#持续安全实践)

---

## 🔍 当前安全状态检查

### ✅ 已配置的保护

您的 `.gitignore` 已经配置了以下保护：

```gitignore
# Environment variables (contains sensitive API keys)
.env
.env.local
.env.*.local
server/.env
server/.env.local
server/.env.*.local
*.env
*.env.local

# Sensitive files
**/secrets.json
**/credentials.json
**/*.pem
**/*.key
**/*.cert
```

**这很好！** 但我们需要确保这些文件没有被意外添加到 Git。

---

## ⚠️ 立即执行的安全措施

### 步骤 1: 检查 server/.env 状态

```bash
git status server/.env
```

**如果显示 "modified"**，说明它之前被跟踪了。我们需要移除它。

### 步骤 2: 从 Git 跟踪中移除 .env 文件

```bash
# 从 Git 跟踪中移除，但保留本地文件
git rm --cached server/.env

# 确认移除
git status
```

### 步骤 3: 提交移除操作

```bash
git add .gitignore
git commit -m "security: Remove .env file from Git tracking and update .gitignore"
```

### 步骤 4: 验证 .env 不再被跟踪

```bash
git status server/.env
```

**应该显示**: `fatal: pathspec 'server/.env' did not match any files`

这说明文件不再被 Git 跟踪。✅

---

## 🔐 Git Hooks 自动检查

### 什么是 Git Hooks？

Git Hooks 是在特定 Git 操作前后自动运行的脚本，可以防止意外提交敏感信息。

### 安装 Pre-commit Hook

我将为您创建一个自动检查脚本。

---

## 📝 安全检查清单

### 发布前必查项目

- [ ] `.env` 文件不在 Git 跟踪中
- [ ] `.gitignore` 包含所有敏感文件模式
- [ ] 代码中没有硬编码的 API 密钥
- [ ] Git 历史中没有敏感信息
- [ ] 创建了 `.env.example` 模板文件

---

## 🛡️ 多层防护策略

### 第 1 层: .gitignore（已完成）
✅ 防止敏感文件被添加到 Git

### 第 2 层: Git Hooks（即将创建）
✅ 提交前自动检查

### 第 3 层: 环境变量模板
✅ 提供配置示例，不包含真实密钥

### 第 4 层: 代码审查
✅ 提交前人工检查

---

## 📚 最佳实践

### 1. 使用环境变量

✅ **正确做法**:
```javascript
const API_KEY = process.env.GOOGLE_API_KEY;
```

❌ **错误做法**:
```javascript
const API_KEY = "AIzaSyC..."; // 永远不要这样做！
```

### 2. 创建 .env.example

提供配置模板，不包含真实值：

```env
# .env.example
GOOGLE_API_KEY=your_google_api_key_here
CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

### 3. 在 README 中说明

```markdown
## 配置

1. 复制 `server/.env.example` 为 `server/.env`
2. 填入您的 API 密钥
3. 不要提交 `.env` 文件到 Git
```

### 4. 定期检查

```bash
# 检查是否有敏感文件被跟踪
git ls-files | grep -E '\\.env$|secrets|credentials'

# 应该返回空结果
```

---

## 🚨 紧急响应：如果密钥已泄露

### 如果密钥已经被推送到 GitHub

1. **立即撤销密钥**
   - Google: https://aistudio.google.com/app/apikey
   - Cloudflare: https://dash.cloudflare.com/profile/api-tokens

2. **生成新密钥**

3. **清理 Git 历史**（高级操作）
   ```bash
   # 使用 git filter-branch 或 BFG Repo-Cleaner
   # 建议先备份仓库
   ```

4. **强制推送**（谨慎使用）
   ```bash
   git push --force
   ```

5. **通知协作者**

---

## 🎯 快速安全检查命令

```bash
# 检查当前状态
git status

# 检查 .env 是否被跟踪
git ls-files | grep .env

# 检查代码中是否有 API 密钥模式
grep -r "AIzaSy" . --exclude-dir=node_modules --exclude-dir=.git

# 检查是否有硬编码的密钥
grep -r "API_KEY.*=" . --exclude-dir=node_modules --exclude-dir=.git | grep -v "process.env"
```

---

## 📊 安全评分

### 当前项目安全状态

| 检查项 | 状态 | 说明 |
|--------|:----:|------|
| .gitignore 配置 | ✅ | 已配置完整 |
| .env 文件保护 | ⚠️ | 需要从跟踪中移除 |
| 代码中无硬编码 | ✅ | 使用环境变量 |
| Git Hooks | ⚠️ | 即将创建 |
| .env.example | ⚠️ | 即将创建 |

---

## 🔄 持续安全实践

### 每次提交前

1. 运行 `git status` 检查文件
2. 确认没有 `.env` 文件
3. 检查代码变更中没有密钥

### 每周

1. 检查 GitHub 是否有安全警告
2. 审查最近的提交
3. 更新依赖包

### 每月

1. 轮换 API 密钥
2. 审查访问权限
3. 检查使用量

---

## 📞 相关资源

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Git Secret Management](https://git-secret.io/)
- [Environment Variables Guide](https://12factor.net/config)

---

**接下来我将为您创建自动化脚本来实现这些安全措施。**

