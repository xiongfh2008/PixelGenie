# Fix Git Pre-commit Hook Error
# 修复 Git pre-commit 钩子错误

Write-Host "🔧 修复 Git Pre-commit 钩子..." -ForegroundColor Cyan
Write-Host ""

$hookPath = ".git\hooks\pre-commit"

# 检查 .git 目录是否存在
if (-not (Test-Path ".git")) {
    Write-Host "❌ 错误: 当前目录不是 Git 仓库" -ForegroundColor Red
    Write-Host "   请在项目根目录运行此脚本" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git 仓库检测成功" -ForegroundColor Green
Write-Host ""

# 创建 hooks 目录（如果不存在）
if (-not (Test-Path ".git\hooks")) {
    New-Item -ItemType Directory -Path ".git\hooks" -Force | Out-Null
    Write-Host "✅ 创建 hooks 目录" -ForegroundColor Green
}

# 创建 pre-commit 钩子
Write-Host "📝 创建 pre-commit 钩子..." -ForegroundColor Cyan

$hookContent = @'
#!/bin/sh
# Pre-commit hook - Security checks for PixelGenie

echo "🔍 Running pre-commit security checks..."

# Check for .env files being ADDED or MODIFIED (not deleted)
ENV_FILES=$(git diff --cached --name-only --diff-filter=AM | grep -E "\.env$")

if [ -n "$ENV_FILES" ]; then
    echo "❌ Error: .env file detected in commit (added or modified)"
    echo "   Files:"
    echo "$ENV_FILES" | sed 's/^/     /'
    echo ""
    echo "   Please remove .env files from your commit"
    echo "   Run: git reset HEAD .env server/.env"
    exit 1
fi

# Allow deletion of .env files
ENV_DELETED=$(git diff --cached --name-only --diff-filter=D | grep -E "\.env$")
if [ -n "$ENV_DELETED" ]; then
    echo "✅ Allowing deletion of .env files:"
    echo "$ENV_DELETED" | sed 's/^/     /'
fi

# Check for API keys in staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=AM)
if [ -n "$STAGED_FILES" ]; then
    for file in $STAGED_FILES; do
        if [ -f "$file" ]; then
            # Check for common API key patterns
            if grep -qE "(GOOGLE_API_KEY|CLOUDFLARE_API_KEY|XUNFEI_API_KEY|HUGGINGFACE_API_KEY|DEEPSEEK_API_KEY|CLIPDROP_API_KEY|REMOVEBG_API_KEY|REPLICATE_API_TOKEN|STABILITY_API_KEY).*=.*[A-Za-z0-9_-]{20,}" "$file"; then
                echo "⚠️  Warning: Possible API key found in $file"
                echo "   Please review this file carefully"
            fi
        fi
    done
fi

echo "✅ Pre-commit checks passed"
exit 0
'@

# 写入文件（使用 UTF-8 without BOM）
[System.IO.File]::WriteAllText($hookPath, $hookContent, [System.Text.UTF8Encoding]::new($false))

Write-Host "✅ Pre-commit 钩子已创建" -ForegroundColor Green
Write-Host ""

# 配置 Git 钩子路径
Write-Host "⚙️  配置 Git 钩子路径..." -ForegroundColor Cyan
git config core.hooksPath .git/hooks
Write-Host "✅ Git 钩子路径已配置" -ForegroundColor Green
Write-Host ""

# 备份旧的钩子文件
if (Test-Path ".git\hooks\pre-commit.bat") {
    if (-not (Test-Path ".git\hooks\pre-commit.bat.bak")) {
        Copy-Item ".git\hooks\pre-commit.bat" ".git\hooks\pre-commit.bat.bak"
        Write-Host "✅ 已备份旧的 pre-commit.bat 文件" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 修复完成！" -ForegroundColor Green
Write-Host ""
Write-Host "现在可以正常提交代码了:" -ForegroundColor White
Write-Host "  git commit -m 'your message'" -ForegroundColor Yellow
Write-Host "  git push origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "钩子会自动检查:" -ForegroundColor White
Write-Host "  ✅ .env 文件是否被包含" -ForegroundColor Green
Write-Host "  ✅ API 密钥是否泄露" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
