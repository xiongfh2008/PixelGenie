# Cloudflare Workers AI 快速配置脚本
# 此脚本帮助您快速配置 Cloudflare Workers AI

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Cloudflare Workers AI 配置向导" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查 .env 文件是否存在
$envPath = "server\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  未找到 server\.env 文件" -ForegroundColor Yellow
    Write-Host "正在从模板创建..." -ForegroundColor Yellow
    
    if (Test-Path "server\env.template") {
        Copy-Item "server\env.template" $envPath
        Write-Host "✅ 已创建 server\.env 文件" -ForegroundColor Green
    } else {
        Write-Host "❌ 错误：未找到 server\env.template 文件" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 请按照以下步骤获取 Cloudflare API 凭证：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 访问 Cloudflare Dashboard：" -ForegroundColor White
Write-Host "   https://dash.cloudflare.com/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 获取 Account ID：" -ForegroundColor White
Write-Host "   - 登录后在右侧边栏查看" -ForegroundColor Gray
Write-Host "   - 格式类似：a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 创建 API Token：" -ForegroundColor White
Write-Host "   - 访问：https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Cyan
Write-Host "   - 点击 'Create Token' → 'Create Custom Token'" -ForegroundColor Gray
Write-Host "   - 权限：Account → Workers AI → Read" -ForegroundColor Gray
Write-Host ""

# 提示用户输入凭证
Write-Host "请输入您的 Cloudflare 凭证：" -ForegroundColor Yellow
Write-Host ""

$accountId = Read-Host "Account ID"
$apiToken = Read-Host "API Token"

if ([string]::IsNullOrWhiteSpace($accountId) -or [string]::IsNullOrWhiteSpace($apiToken)) {
    Write-Host ""
    Write-Host "❌ 错误：Account ID 和 API Token 不能为空" -ForegroundColor Red
    Write-Host "💡 提示：如果您暂时没有凭证，请先访问 Cloudflare Dashboard 获取" -ForegroundColor Yellow
    Write-Host "   详细指南：查看 CLOUDFLARE_SETUP.md" -ForegroundColor Yellow
    exit 1
}

# 更新 .env 文件
Write-Host ""
Write-Host "正在更新配置文件..." -ForegroundColor Yellow

$envContent = Get-Content $envPath -Raw

# 检查是否已存在配置
if ($envContent -match "CLOUDFLARE_API_TOKEN=") {
    $envContent = $envContent -replace "CLOUDFLARE_API_TOKEN=.*", "CLOUDFLARE_API_TOKEN=$apiToken"
} else {
    $envContent += "`nCLOUDFLARE_API_TOKEN=$apiToken"
}

if ($envContent -match "CLOUDFLARE_ACCOUNT_ID=") {
    $envContent = $envContent -replace "CLOUDFLARE_ACCOUNT_ID=.*", "CLOUDFLARE_ACCOUNT_ID=$accountId"
} else {
    $envContent += "`nCLOUDFLARE_ACCOUNT_ID=$accountId"
}

Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host "✅ 配置已保存到 $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "配置完成！" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 重启服务器：npm run dev:server" -ForegroundColor White
Write-Host "2. 查看详细文档：CLOUDFLARE_SETUP.md" -ForegroundColor White
Write-Host "3. 测试 API：使用智能鉴伪功能上传图片" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示：Cloudflare Workers AI 提供每天 10,000 次免费请求" -ForegroundColor Cyan
Write-Host ""

