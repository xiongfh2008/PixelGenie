#!/bin/bash

# PixelGenie 安全检查脚本
# 用于检查代码中是否有敏感信息泄露

echo "🔍 PixelGenie 安全检查"
echo "========================================================================"
echo ""

ERRORS=0

# 检查 1: .gitignore 配置
echo "📋 检查 1: .gitignore 配置"
echo "------------------------------------------------------------------------"
if [ ! -f .gitignore ]; then
  echo "   ❌ .gitignore 文件不存在！"
  ERRORS=$((ERRORS + 1))
elif grep -q ".env" .gitignore && grep -q "server/.env" .gitignore; then
  echo "   ✅ .gitignore 配置正确"
else
  echo "   ❌ .gitignore 缺少 .env 配置"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 检查 2: .env 文件是否被跟踪
echo "📋 检查 2: .env 文件跟踪状态"
echo "------------------------------------------------------------------------"
ENV_FILES=$(git ls-files | grep -E '\.env$|\.env\.local$' || true)
if [ -n "$ENV_FILES" ]; then
  echo "   ❌ 发现被跟踪的 .env 文件:"
  echo "$ENV_FILES" | sed 's/^/      /'
  echo "   请执行: git rm --cached <文件名>"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ .env 文件未被跟踪"
fi
echo ""

# 检查 3: 硬编码的 API 密钥
echo "📋 检查 3: 硬编码的 API 密钥"
echo "------------------------------------------------------------------------"
PATTERNS=(
  "AIzaSy[0-9A-Za-z_-]{33}"  # Google API Key
  "sk-[0-9A-Za-z]{48}"        # OpenAI API Key
  "hf_[0-9A-Za-z]{37}"        # HuggingFace Token
)

FOUND_KEYS=0
for pattern in "${PATTERNS[@]}"; do
  RESULTS=$(grep -rn "$pattern" \
    --include="*.js" \
    --include="*.ts" \
    --include="*.jsx" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    . 2>/dev/null || true)
  
  if [ -n "$RESULTS" ]; then
    echo "   ❌ 发现可能的 API 密钥:"
    echo "$RESULTS" | sed 's/^/      /'
    FOUND_KEYS=1
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $FOUND_KEYS -eq 0 ]; then
  echo "   ✅ 未发现硬编码的密钥"
fi
echo ""

# 检查 4: .env.example 文件
echo "📋 检查 4: .env.example 模板文件"
echo "------------------------------------------------------------------------"
if [ ! -f server/.env.example ]; then
  echo "   ⚠️  server/.env.example 不存在（建议创建）"
else
  echo "   ✅ server/.env.example 存在"
fi

if [ ! -f .env.example ]; then
  echo "   ⚠️  .env.example 不存在（建议创建）"
else
  echo "   ✅ .env.example 存在"
fi
echo ""

# 检查 5: Git 历史中的密钥
echo "📋 检查 5: Git 历史中的敏感信息"
echo "------------------------------------------------------------------------"
echo "   ⏳ 扫描 Git 历史（这可能需要一些时间）..."
HISTORY_KEYS=$(git log -p | grep -E "AIzaSy[0-9A-Za-z_-]{33}|sk-[0-9A-Za-z]{48}" | head -5 || true)
if [ -n "$HISTORY_KEYS" ]; then
  echo "   ❌ 在 Git 历史中发现可能的 API 密钥！"
  echo "   这是严重的安全问题，需要清理 Git 历史"
  echo "   请参考 SECURITY_SETUP.md 中的'清理 Git 历史'部分"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ Git 历史中未发现密钥"
fi
echo ""

# 检查 6: 当前暂存区
echo "📋 检查 6: 当前暂存区"
echo "------------------------------------------------------------------------"
STAGED_ENV=$(git diff --cached --name-only | grep -E '\.env$|\.env\.local$' || true)
if [ -n "$STAGED_ENV" ]; then
  echo "   ❌ 暂存区中有 .env 文件:"
  echo "$STAGED_ENV" | sed 's/^/      /'
  echo "   请执行: git reset HEAD <文件名>"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ 暂存区中没有 .env 文件"
fi
echo ""

# 总结
echo "========================================================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ 所有安全检查通过！代码可以安全地推送到 GitHub。"
  echo ""
  echo "💡 建议:"
  echo "   - 定期运行此脚本检查安全性"
  echo "   - 配置 pre-commit hook 自动检查"
  echo "   - 定期轮换 API 密钥"
  exit 0
else
  echo "❌ 发现 $ERRORS 个安全问题，请修复后再推送代码！"
  echo ""
  echo "🔧 修复建议:"
  echo "   1. 确保 .env 文件在 .gitignore 中"
  echo "   2. 移除硬编码的 API 密钥，使用环境变量"
  echo "   3. 如果 .env 文件已被跟踪，执行: git rm --cached server/.env"
  echo "   4. 如果 Git 历史中有密钥，参考 SECURITY_SETUP.md 清理历史"
  echo ""
  echo "📚 详细信息请查看: SECURITY_SETUP.md"
  exit 1
fi

