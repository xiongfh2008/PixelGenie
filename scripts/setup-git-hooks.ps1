# 设置 Git Hooks 以防止密钥泄露 (PowerShell 版本)

Write-Host "🔧 设置 Git Hooks" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# 创建 hooks 目录（如果不存在）
if (-not (Test-Path .git\hooks)) {
    New-Item -ItemType Directory -Path .git\hooks -Force | Out-Null
}

# 创建 pre-commit hook
Write-Host "📝 创建 pre-commit hook..." -ForegroundColor Yellow
$preCommitContent = @'
#!/bin/sh

echo "🔍 执行提交前安全检查..."

# 检查是否有 .env 文件被添加
ENV_FILES=$(git diff --cached --name-only | grep -E '\.env$|\.env\.local$' || true)
if [ -n "$ENV_FILES" ]; then
  echo ""
  echo "❌ 错误: 检测到 .env 文件！"
  echo ""
  echo "以下文件包含敏感信息，不应该提交到 Git:"
  echo "$ENV_FILES"
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
'@

Set-Content -Path .git\hooks\pre-commit -Value $preCommitContent -Encoding UTF8
Write-Host "   ✅ pre-commit hook 已创建" -ForegroundColor Green
Write-Host ""

# 创建 pre-push hook
Write-Host "📝 创建 pre-push hook..." -ForegroundColor Yellow
$prePushContent = @'
#!/bin/sh

echo "🔍 执行推送前安全检查..."

# 检查 .env 文件
ENV_FILES=$(git ls-files | grep -E '\.env$|\.env\.local$' || true)
if [ -n "$ENV_FILES" ]; then
  echo ""
  echo "❌ 发现被跟踪的 .env 文件！"
  echo "$ENV_FILES"
  echo ""
  echo "推送已取消，请先移除这些文件:"
  echo "   git rm --cached <文件名>"
  exit 1
fi

echo "✅ 推送前检查通过"
exit 0
'@

Set-Content -Path .git\hooks\pre-push -Value $prePushContent -Encoding UTF8
Write-Host "   ✅ pre-push hook 已创建" -ForegroundColor Green
Write-Host ""

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "✅ Git Hooks 设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "已创建的 hooks:" -ForegroundColor Yellow
Write-Host "   - pre-commit:  提交前检查 .env 文件和 API 密钥"
Write-Host "   - pre-push:    推送前检查被跟踪的 .env 文件"
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "   - 这些 hooks 会在相应的 Git 操作前自动运行"
Write-Host "   - 如果检查失败，操作会被取消"
Write-Host "   - 您可以手动运行: powershell scripts\check-security.ps1"
Write-Host ""

