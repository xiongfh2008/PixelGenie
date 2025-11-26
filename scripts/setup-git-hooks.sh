#!/bin/bash

# 设置 Git Hooks 以防止密钥泄露

echo "🔧 设置 Git Hooks"
echo "========================================================================"
echo ""

# 创建 hooks 目录（如果不存在）
mkdir -p .git/hooks

# 创建 pre-commit hook
echo "📝 创建 pre-commit hook..."
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔍 执行提交前安全检查..."

# 检查是否有 .env 文件被添加
ENV_FILES=$(git diff --cached --name-only | grep -E '\.env$|\.env\.local$' || true)
if [ -n "$ENV_FILES" ]; then
  echo ""
  echo "❌ 错误: 检测到 .env 文件！"
  echo ""
  echo "以下文件包含敏感信息，不应该提交到 Git:"
  echo "$ENV_FILES" | sed 's/^/   /'
  echo ""
  echo "请执行以下操作:"
  echo "   1. git reset HEAD .env"
  echo "   2. 确保 .env 在 .gitignore 中"
  echo ""
  exit 1
fi

# 检查是否有 API 密钥
KEYS=$(git diff --cached | grep -E 'AIzaSy[0-9A-Za-z_-]{33}|sk-[0-9A-Za-z]{48}|hf_[0-9A-Za-z]{37}' || true)
if [ -n "$KEYS" ]; then
  echo ""
  echo "❌ 错误: 检测到可能的 API 密钥！"
  echo ""
  echo "请检查您的代码，不要硬编码 API 密钥。"
  echo "使用环境变量代替: process.env.API_KEY"
  echo ""
  exit 1
fi

echo "✅ 安全检查通过"
exit 0
EOF

chmod +x .git/hooks/pre-commit
echo "   ✅ pre-commit hook 已创建"
echo ""

# 创建 pre-push hook
echo "📝 创建 pre-push hook..."
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "🔍 执行推送前安全检查..."

# 运行完整的安全检查脚本
if [ -f scripts/check-security.sh ]; then
  bash scripts/check-security.sh
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 安全检查失败，推送已取消"
    echo "请修复上述问题后再尝试推送"
    exit 1
  fi
else
  echo "⚠️  警告: 找不到 scripts/check-security.sh"
  echo "跳过详细安全检查"
fi

echo "✅ 推送前检查通过"
exit 0
EOF

chmod +x .git/hooks/pre-push
echo "   ✅ pre-push hook 已创建"
echo ""

# 创建 commit-msg hook
echo "📝 创建 commit-msg hook..."
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# 检查提交信息中是否包含 API 密钥
COMMIT_MSG=$(cat "$1")

if echo "$COMMIT_MSG" | grep -qE 'AIzaSy[0-9A-Za-z_-]{33}|sk-[0-9A-Za-z]{48}'; then
  echo ""
  echo "❌ 错误: 提交信息中包含可能的 API 密钥！"
  echo ""
  echo "请修改提交信息，不要包含敏感信息。"
  echo ""
  exit 1
fi

exit 0
EOF

chmod +x .git/hooks/commit-msg
echo "   ✅ commit-msg hook 已创建"
echo ""

echo "========================================================================"
echo "✅ Git Hooks 设置完成！"
echo ""
echo "已创建的 hooks:"
echo "   - pre-commit:  提交前检查 .env 文件和 API 密钥"
echo "   - pre-push:    推送前运行完整安全检查"
echo "   - commit-msg:  检查提交信息中的敏感信息"
echo ""
echo "💡 提示:"
echo "   - 这些 hooks 会在相应的 Git 操作前自动运行"
echo "   - 如果检查失败，操作会被取消"
echo "   - 您可以手动运行: bash scripts/check-security.sh"
echo ""

