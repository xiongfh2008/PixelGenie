# 🔒 安全发布到 GitHub - 完整指南

## ✅ 已完成的安全措施

### 1. ✅ 从 Git 跟踪中移除 .env 文件
```bash
git rm --cached server/.env
```
**状态**: 已完成 - `.env` 文件已从 Git 跟踪中删除

### 2. ✅ 配置 .gitignore
已配置完整的 `.gitignore`，包括：
- `.env` 和所有变体
- 敏感文件模式
- 临时文件
- 凭证文件

### 3. ✅ 安装 Git Hooks
Pre-commit hook 已安装，会自动检查：
- .env 文件
- API 密钥模式
- 敏感信息
- .gitignore 配置

### 4. ✅ 创建环境变量模板
`server/env.example` - 提供配置示例，不包含真实密钥

---

## 🚀 立即发布步骤

### 步骤 1: 添加文件到 Git

```bash
# 添加安全配置文件
git add .gitignore
git add server/env.example
git add scripts/

# 添加文档
git add *.md

# 添加代码更改
git add server/index.js

# 添加其他安全脚本
git add server/disable-google-api.js
git add server/enable-google-api.js
git add server/reset-google-health.js
git add server/test-new-google-key.js
git add server/update-google-key.js
```

### 步骤 2: 提交更改

```bash
git commit -m "security: Remove .env from tracking and add security measures

- Remove server/.env from Git tracking
- Update .gitignore with comprehensive patterns
- Add pre-commit hooks for security checks
- Add env.example template file
- Add security documentation and scripts
- Update API provider selection logic
- Fix dewatermark functionality

BREAKING CHANGE: .env file is no longer tracked
Users need to create their own .env file from env.example"
```

**Git Hook 会自动运行检查！**

### 步骤 3: 推送到 GitHub

```bash
git push origin main
```

---

## 🔍 发布前最终检查

### 运行安全检查

```bash
# 手动运行 pre-commit 检查
powershell -ExecutionPolicy Bypass -File scripts/pre-commit-check.ps1
```

### 检查 .env 文件状态

```bash
# 确认 .env 不在跟踪中
git ls-files | grep .env
```
**应该返回空结果！**

### 检查代码中的硬编码密钥

```bash
# 搜索 API 密钥模式
git diff --cached | Select-String -Pattern "AIzaSy"
```
**应该没有匹配！**

### 查看将要提交的内容

```bash
git diff --cached
```
**确认没有敏感信息！**

---

## 📋 GitHub 仓库设置

### 发布后在 GitHub 上配置

1. **启用 Secret Scanning**
   - Settings → Code security and analysis
   - 启用 "Secret scanning"
   - 启用 "Push protection"

2. **添加 .env 到 Secrets**（如果使用 GitHub Actions）
   - Settings → Secrets and variables → Actions
   - 添加必要的环境变量

3. **配置分支保护**
   - Settings → Branches
   - 添加规则保护 main 分支
   - 要求 pull request reviews

4. **添加 README 说明**
   确保 README.md 包含配置说明：
   ```markdown
   ## 配置

   1. 复制 `server/env.example` 为 `server/.env`
   2. 填入您的 API 密钥
   3. 不要提交 `.env` 文件
   ```

---

## 🛡️ 多层安全保护

### 第 1 层: .gitignore ✅
防止敏感文件被添加到 Git

### 第 2 层: Git Hooks ✅
提交前自动检查敏感信息

### 第 3 层: env.example ✅
提供配置模板，不包含真实密钥

### 第 4 层: GitHub Secret Scanning
GitHub 自动扫描已提交的密钥

### 第 5 层: 代码审查
人工审查每次提交

---

## 🚨 如果发现历史中有密钥

### 检查 Git 历史

```bash
# 搜索历史中的 API 密钥
git log -p | Select-String -Pattern "AIzaSy"
```

### 如果找到密钥

1. **立即撤销密钥**
   - 访问相应的 API 平台
   - 删除泄露的密钥
   - 生成新密钥

2. **清理 Git 历史**（高级操作）
   ```bash
   # 使用 BFG Repo-Cleaner (推荐)
   # 下载: https://rtyley.github.io/bfg-repo-cleaner/
   
   # 或使用 git filter-branch
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch server/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **强制推送**（谨慎！）
   ```bash
   git push --force --all
   ```

4. **通知协作者**
   让所有协作者重新克隆仓库

---

## 📊 安全检查清单

### 提交前

- [ ] 运行 `git status` 检查文件列表
- [ ] 确认没有 `.env` 文件
- [ ] 运行安全检查脚本
- [ ] 查看 `git diff --cached`
- [ ] 确认没有硬编码的密钥

### 提交时

- [ ] Git hook 自动检查通过
- [ ] 提交信息清晰
- [ ] 没有警告或错误

### 推送后

- [ ] 检查 GitHub 仓库
- [ ] 确认没有 `.env` 文件
- [ ] 检查 GitHub Security 警告
- [ ] 更新 README 配置说明

---

## 🔧 维护和监控

### 每次提交

- Git hook 自动检查
- 人工审查变更

### 每周

- 检查 GitHub Security 警告
- 审查最近的提交
- 更新依赖包

### 每月

- 轮换 API 密钥
- 审查访问权限
- 检查使用量

---

## 📚 相关文档

- `SECURITY_GITHUB_GUIDE.md` - 详细安全指南
- `server/env.example` - 环境变量模板
- `scripts/pre-commit-check.ps1` - 安全检查脚本
- `scripts/install-git-hooks.ps1` - Git hooks 安装脚本

---

## 💡 最佳实践

### 1. 永远不要硬编码密钥

✅ **正确**:
```javascript
const API_KEY = process.env.GOOGLE_API_KEY;
```

❌ **错误**:
```javascript
const API_KEY = "AIzaSyC...";
```

### 2. 使用环境变量

所有敏感配置都应该通过环境变量传递。

### 3. 定期轮换密钥

建议每 3-6 个月更换一次 API 密钥。

### 4. 监控使用量

定期检查 API 使用量，及时发现异常。

### 5. 最小权限原则

只授予必要的 API 权限。

---

## ✅ 完成！

您的项目现在已经配置了完整的安全措施：

1. ✅ `.env` 文件已从 Git 跟踪中移除
2. ✅ `.gitignore` 已配置
3. ✅ Git hooks 已安装
4. ✅ `env.example` 已创建
5. ✅ 安全文档已完善

**现在可以安全地发布到 GitHub 了！** 🚀

---

## 🎯 快速命令参考

```bash
# 检查状态
git status

# 运行安全检查
powershell -ExecutionPolicy Bypass -File scripts/pre-commit-check.ps1

# 添加文件
git add .gitignore server/env.example scripts/ *.md server/*.js

# 提交（会自动运行检查）
git commit -m "security: Add comprehensive security measures"

# 推送
git push origin main
```

---

**祝您安全发布！** 🔒

