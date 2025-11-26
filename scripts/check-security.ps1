# PixelGenie 安全检查脚本 (PowerShell 版本)
# 用于检查代码中是否有敏感信息泄露

Write-Host "🔍 PixelGenie 安全检查" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

$ERRORS = 0

# 检查 1: .gitignore 配置
Write-Host "📋 检查 1: .gitignore 配置" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------------------"
if (-not (Test-Path .gitignore)) {
    Write-Host "   ❌ .gitignore 文件不存在！" -ForegroundColor Red
    $ERRORS++
} elseif ((Get-Content .gitignore) -match "\.env" -and (Get-Content .gitignore) -match "server/\.env") {
    Write-Host "   ✅ .gitignore 配置正确" -ForegroundColor Green
} else {
    Write-Host "   ❌ .gitignore 缺少 .env 配置" -ForegroundColor Red
    $ERRORS++
}
Write-Host ""

# 检查 2: .env 文件是否被跟踪
Write-Host "📋 检查 2: .env 文件跟踪状态" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------------------"
$envFiles = git ls-files | Select-String -Pattern "\.env$|\.env\.local$"
if ($envFiles) {
    Write-Host "   ❌ 发现被跟踪的 .env 文件:" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "      $_" }
    Write-Host "   请执行: git rm --cached <文件名>"
    $ERRORS++
} else {
    Write-Host "   ✅ .env 文件未被跟踪" -ForegroundColor Green
}
Write-Host ""

# 检查 3: 硬编码的 API 密钥
Write-Host "📋 检查 3: 硬编码的 API 密钥" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------------------"
$patterns = @(
    "AIzaSy[0-9A-Za-z_-]{33}",  # Google API Key
    "sk-[0-9A-Za-z]{48}",        # OpenAI API Key
    "hf_[0-9A-Za-z]{37}"         # HuggingFace Token
)

$foundKeys = $false
foreach ($pattern in $patterns) {
    $results = Get-ChildItem -Path . -Recurse -Include *.js,*.ts,*.jsx,*.tsx -Exclude node_modules,dist,.git |
        Select-String -Pattern $pattern
    
    if ($results) {
        Write-Host "   ❌ 发现可能的 API 密钥:" -ForegroundColor Red
        $results | ForEach-Object { Write-Host "      $($_.Path):$($_.LineNumber)" }
        $foundKeys = $true
        $ERRORS++
    }
}

if (-not $foundKeys) {
    Write-Host "   ✅ 未发现硬编码的密钥" -ForegroundColor Green
}
Write-Host ""

# 检查 4: .env.example 文件
Write-Host "📋 检查 4: .env.example 模板文件" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------------------"
if (-not (Test-Path server\.env.example)) {
    Write-Host "   ⚠️  server\.env.example 不存在（建议创建）" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ server\.env.example 存在" -ForegroundColor Green
}

if (-not (Test-Path .env.example)) {
    Write-Host "   ⚠️  .env.example 不存在（建议创建）" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ .env.example 存在" -ForegroundColor Green
}
Write-Host ""

# 检查 5: 当前暂存区
Write-Host "📋 检查 5: 当前暂存区" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------------------"
$stagedEnv = git diff --cached --name-only | Select-String -Pattern "\.env$|\.env\.local$"
if ($stagedEnv) {
    Write-Host "   ❌ 暂存区中有 .env 文件:" -ForegroundColor Red
    $stagedEnv | ForEach-Object { Write-Host "      $_" }
    Write-Host "   请执行: git reset HEAD <文件名>"
    $ERRORS++
} else {
    Write-Host "   ✅ 暂存区中没有 .env 文件" -ForegroundColor Green
}
Write-Host ""

# 总结
Write-Host "========================================================================" -ForegroundColor Cyan
if ($ERRORS -eq 0) {
    Write-Host "✅ 所有安全检查通过！代码可以安全地推送到 GitHub。" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 建议:" -ForegroundColor Yellow
    Write-Host "   - 定期运行此脚本检查安全性"
    Write-Host "   - 定期轮换 API 密钥"
    exit 0
} else {
    Write-Host "❌ 发现 $ERRORS 个安全问题，请修复后再推送代码！" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 修复建议:" -ForegroundColor Yellow
    Write-Host "   1. 确保 .env 文件在 .gitignore 中"
    Write-Host "   2. 移除硬编码的 API 密钥，使用环境变量"
    Write-Host "   3. 如果 .env 文件已被跟踪，执行: git rm --cached server\.env"
    Write-Host ""
    Write-Host "📚 详细信息请查看: SECURITY_SETUP.md" -ForegroundColor Cyan
    exit 1
}

