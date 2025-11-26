# 🔒 安全配置指南 - 防止密钥泄露

本指南将帮助您安全地配置 PixelGenie，确保 API 密钥不会泄露到 GitHub 或其他公开平台。

---

## 📋 目录

1. [快速开始](#快速开始)
2. [环境变量配置](#环境变量配置)
3. [Git 安全检查](#git-安全检查)
4. [密钥管理最佳实践](#密钥管理最佳实践)
5. [泄露应急响应](#泄露应急响应)

---

## 🚀 快速开始

### 步骤 1: 创建环境变量文件

```bash
# 复制模板文件
cp server/.env.example server/.env
cp .env.example .env
```

### 步骤 2: 填入 API 密钥

编辑 `server/.env` 文件，填入您的真实 API 密钥：

```env
GOOGLE_API_KEY=AIzaSy...你的密钥
CLOUDFLARE_API_TOKEN=...你的密钥
CLOUDFLARE_ACCOUNT_ID=...你的账户ID
```

### 步骤 3: 验证 .gitignore

确保 `.gitignore` 文件包含：

```gitignore
.env
server/.env
*.env
*.env.local
```

### 步骤 4: 测试配置

```bash
# 启动服务器
npm run dev:all

# 检查日志，确认 API 密钥已加载
# 应该看到: ✅ Available API keys: google, cloudflare, ...
```

---

## 🔐 环境变量配置

### 文件结构

```
PixelGenie/
├── .env.example          # 前端环境变量模板（可提交）
├── .env                  # 前端环境变量（不提交）
├── server/
│   ├── .env.example      # 后端环境变量模板（可提交）
│   └── .env              # 后端环境变量（不提交）⚠️
└── .gitignore            # Git 忽略规则
```

### 重要原则

| 文件 | 是否提交 | 说明 |
|------|:-------:|------|
| `.env.example` | ✅ 是 | 模板文件，不包含真实密钥 |
| `.env` | ❌ 否 | 包含真实密钥，绝不提交 |
| `server/.env.example` | ✅ 是 | 模板文件，不包含真实密钥 |
| `server/.env` | ❌ 否 | 包含真实密钥，绝不提交 |

---

## 🔍 Git 安全检查

### 检查 1: 验证 .gitignore

```bash
# 检查 .env 是否在 .gitignore 中
cat .gitignore | grep .env
```

**预期输出**：
```
.env
server/.env
*.env
```

### 检查 2: 确认文件未被跟踪

```bash
# 检查 Git 状态
git status

# 确保没有看到 .env 文件
# 如果看到 .env 文件，说明有问题！
```

### 检查 3: 搜索历史记录

```bash
# 搜索 Git 历史中是否有 API 密钥
git log -p | grep -i "api_key"
git log -p | grep "AIzaSy"

# 如果找到密钥，需要清理历史（见下文）
```

### 检查 4: 使用 git-secrets 工具

```bash
# 安装 git-secrets（可选但推荐）
# macOS
brew install git-secrets

# Windows (使用 Git Bash)
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# 配置 git-secrets
git secrets --install
git secrets --register-aws

# 添加自定义规则
git secrets --add 'AIzaSy[0-9A-Za-z_-]{33}'  # Google API Key
git secrets --add 'sk-[0-9A-Za-z]{48}'        # OpenAI API Key
git secrets --add 'hf_[0-9A-Za-z]{37}'        # HuggingFace Token

# 扫描仓库
git secrets --scan
```

---

## 🛡️ 密钥管理最佳实践

### 1. 不要硬编码密钥

❌ **错误做法**：
```javascript
const API_KEY = "AIzaSyCqNR9oNsbRL8F-S9NMqUxnAImwgi3HvT4";
```

✅ **正确做法**：
```javascript
const API_KEY = process.env.GOOGLE_API_KEY;
```

### 2. 使用环境变量

```javascript
// 后端 (Node.js)
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const apiKey = process.env.GOOGLE_API_KEY;

// 前端 (Vite)
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

### 3. 验证密钥存在

```javascript
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is not set in environment variables');
}
```

### 4. 不要在前端存储密钥

❌ **错误**：在前端直接调用 API
```javascript
// 前端代码 - 会暴露密钥
fetch('https://api.google.com/...', {
  headers: { 'X-API-Key': 'AIzaSy...' }
});
```

✅ **正确**：通过后端代理
```javascript
// 前端代码 - 调用自己的后端
fetch('http://localhost:3001/api/analyze-image', {
  method: 'POST',
  body: JSON.stringify({ image: base64 })
});

// 后端代码 - 使用密钥
fetch('https://api.google.com/...', {
  headers: { 'X-API-Key': process.env.GOOGLE_API_KEY }
});
```

### 5. 定期轮换密钥

```bash
# 每 3-6 个月执行一次
# 1. 在 API 平台创建新密钥
# 2. 更新 server/.env
# 3. 测试新密钥
# 4. 删除旧密钥
```

### 6. 限制密钥权限

在 API 平台设置：
- **IP 限制**：只允许特定 IP 访问
- **域名限制**：只允许特定域名访问
- **API 限制**：只启用需要的 API
- **配额限制**：设置每日/每月使用上限

---

## 🚨 泄露应急响应

### 如果密钥已经泄露

#### 立即行动（5分钟内）

1. **撤销泄露的密钥**
   ```bash
   # Google API
   # 访问: https://aistudio.google.com/app/apikey
   # 点击删除按钮
   
   # Cloudflare
   # 访问: https://dash.cloudflare.com/profile/api-tokens
   # 撤销 Token
   ```

2. **创建新密钥**
   - 立即创建新的 API 密钥
   - 更新 `server/.env` 文件
   - 重启服务器

3. **检查使用记录**
   - 查看 API 使用日志
   - 检查是否有异常调用
   - 评估损失

#### 清理 Git 历史（如果密钥已提交）

⚠️ **警告**：这会改写 Git 历史，需要谨慎操作

##### 方法 1: 使用 BFG Repo-Cleaner（推荐）

```bash
# 1. 备份仓库
cp -r PixelGenie PixelGenie-backup

# 2. 下载 BFG
# 访问: https://rtyley.github.io/bfg-repo-cleaner/
# 或使用 Homebrew: brew install bfg

# 3. 创建密钥列表文件
echo "AIzaSyCqNR9oNsbRL8F-S9NMqUxnAImwgi3HvT4" > secrets.txt

# 4. 清理历史
bfg --replace-text secrets.txt PixelGenie

# 5. 清理引用
cd PixelGenie
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. 强制推送（需要团队协调）
git push --force
```

##### 方法 2: 使用 git filter-branch

```bash
# 1. 备份仓库
cp -r PixelGenie PixelGenie-backup

# 2. 清理历史
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 清理引用
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. 强制推送
git push --force
```

##### 方法 3: GitHub 支持（最安全）

如果仓库是公开的且已被索引：
1. 联系 GitHub Support
2. 请求缓存清理
3. 提供泄露的密钥信息

---

## ✅ 发布前检查清单

在推送代码到 GitHub 之前，请完成以下检查：

### 必检项

- [ ] `.env` 文件在 `.gitignore` 中
- [ ] `server/.env` 文件在 `.gitignore` 中
- [ ] 运行 `git status` 确认没有 `.env` 文件
- [ ] 代码中没有硬编码的 API 密钥
- [ ] 已创建 `.env.example` 模板文件
- [ ] 已创建 `server/.env.example` 模板文件
- [ ] README 中包含环境变量配置说明

### 推荐项

- [ ] 安装并配置 `git-secrets`
- [ ] 运行 `git secrets --scan` 扫描
- [ ] 设置 API 密钥权限限制
- [ ] 启用 GitHub Secret Scanning
- [ ] 配置 CI/CD 环境变量
- [ ] 文档中说明如何获取 API 密钥

---

## 🔧 自动化检查脚本

### 创建 pre-commit hook

```bash
# 创建 .git/hooks/pre-commit 文件
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# 检查是否有 .env 文件被添加
if git diff --cached --name-only | grep -E '\.env$|\.env\.local$'; then
  echo "❌ 错误: 检测到 .env 文件！"
  echo "这些文件包含敏感信息，不应该提交到 Git。"
  echo ""
  echo "请执行以下操作："
  echo "1. git reset HEAD .env"
  echo "2. 确保 .env 在 .gitignore 中"
  exit 1
fi

# 检查是否有 API 密钥
if git diff --cached | grep -E 'AIzaSy[0-9A-Za-z_-]{33}|sk-[0-9A-Za-z]{48}'; then
  echo "❌ 错误: 检测到可能的 API 密钥！"
  echo "请检查您的代码，不要硬编码 API 密钥。"
  exit 1
fi

echo "✅ 安全检查通过"
exit 0
EOF

# 设置执行权限
chmod +x .git/hooks/pre-commit
```

### 创建检查脚本

```bash
# 创建 scripts/check-security.sh
cat > scripts/check-security.sh << 'EOF'
#!/bin/bash

echo "🔍 执行安全检查..."
echo ""

# 检查 .gitignore
echo "1. 检查 .gitignore 配置..."
if grep -q ".env" .gitignore && grep -q "server/.env" .gitignore; then
  echo "   ✅ .gitignore 配置正确"
else
  echo "   ❌ .gitignore 缺少 .env 配置"
  exit 1
fi

# 检查 .env 文件是否被跟踪
echo "2. 检查 .env 文件状态..."
if git ls-files | grep -E '\.env$'; then
  echo "   ❌ 发现被跟踪的 .env 文件！"
  exit 1
else
  echo "   ✅ .env 文件未被跟踪"
fi

# 检查代码中是否有硬编码的密钥
echo "3. 检查硬编码的 API 密钥..."
if grep -r "AIzaSy" --include="*.js" --include="*.ts" --exclude-dir=node_modules .; then
  echo "   ❌ 发现硬编码的 API 密钥！"
  exit 1
else
  echo "   ✅ 未发现硬编码的密钥"
fi

echo ""
echo "✅ 所有安全检查通过！"
EOF

chmod +x scripts/check-security.sh
```

---

## 📚 相关资源

### 官方文档
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Git Secrets](https://github.com/awslabs/git-secrets)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

### 最佳实践
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [12 Factor App](https://12factor.net/config)
- [Environment Variables Best Practices](https://blog.doppler.com/environment-variables-best-practices)

---

## 🎯 总结

### 核心原则

1. **永远不要提交 .env 文件**
2. **永远不要硬编码 API 密钥**
3. **使用环境变量存储敏感信息**
4. **定期检查和轮换密钥**
5. **使用自动化工具防止泄露**

### 快速检查命令

```bash
# 检查 .gitignore
cat .gitignore | grep .env

# 检查 Git 状态
git status

# 检查被跟踪的文件
git ls-files | grep .env

# 运行安全检查
./scripts/check-security.sh
```

---

**遵循本指南，您的 API 密钥将得到妥善保护！** 🔒
