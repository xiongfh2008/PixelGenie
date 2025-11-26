# 一键修复网络连接错误
Write-Host "`n🔧 一键修复网络连接错误`n" -ForegroundColor Cyan
Write-Host "=" * 70

# 步骤 1: 检查后端服务器
Write-Host "`n📝 步骤 1: 检查后端服务器..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 后端服务器正常运行" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 后端服务器未响应" -ForegroundColor Red
    Write-Host "   请先启动后端服务器" -ForegroundColor Yellow
    exit 1
}

# 步骤 2: 检查环境变量
Write-Host "`n📝 步骤 2: 检查环境变量..." -ForegroundColor Yellow
if (Test-Path .env) {
    $envContent = Get-Content .env
    if ($envContent -match "VITE_API_BASE_URL") {
        Write-Host "✅ 环境变量已配置" -ForegroundColor Green
        Write-Host "   $($envContent | Where-Object { $_ -match 'VITE_API_BASE_URL' })"
    } else {
        Write-Host "⚠️  环境变量未配置，正在添加..." -ForegroundColor Yellow
        Add-Content .env "`nVITE_API_BASE_URL=http://localhost:3001"
        Write-Host "✅ 已添加 VITE_API_BASE_URL" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  .env 文件不存在，正在创建..." -ForegroundColor Yellow
    "VITE_API_BASE_URL=http://localhost:3001" | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ 已创建 .env 文件" -ForegroundColor Green
}

# 步骤 3: 清除缓存
Write-Host "`n📝 步骤 3: 清除缓存..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Write-Host "✅ 缓存已清除" -ForegroundColor Green

# 步骤 4: 检查端口占用
Write-Host "`n📝 步骤 4: 检查端口占用..." -ForegroundColor Yellow
$port3001 = netstat -ano | findstr ":3001.*LISTENING"
$port5173 = netstat -ano | findstr ":5173.*LISTENING"
$port5174 = netstat -ano | findstr ":5174.*LISTENING"

if ($port3001) {
    Write-Host "✅ 端口 3001 正在使用（后端）" -ForegroundColor Green
} else {
    Write-Host "⚠️  端口 3001 未被占用" -ForegroundColor Yellow
}

if ($port5173) {
    Write-Host "⚠️  端口 5173 被占用" -ForegroundColor Yellow
} else {
    Write-Host "✅ 端口 5173 可用" -ForegroundColor Green
}

if ($port5174) {
    Write-Host "⚠️  端口 5174 被占用" -ForegroundColor Yellow
} else {
    Write-Host "✅ 端口 5174 可用" -ForegroundColor Green
}

# 完成
Write-Host "`n" + "=" * 70
Write-Host "🎉 修复完成！" -ForegroundColor Green
Write-Host "=" * 70

Write-Host "`n📋 下一步操作：" -ForegroundColor Cyan
Write-Host "   1. 停止当前运行的服务（如果有）：按 Ctrl+C"
Write-Host "   2. 重启服务：npm run dev:all"
Write-Host "   3. 在浏览器中："
Write-Host "      - 关闭所有 localhost:5174 标签页"
Write-Host "      - 按 Ctrl+Shift+Delete 清除浏览器缓存"
Write-Host "      - 重新打开 http://localhost:5174/"
Write-Host "      - 按 Ctrl+Shift+R 强制刷新"
Write-Host "   4. 测试功能`n"

Write-Host "💡 提示：" -ForegroundColor Yellow
Write-Host "   如果问题仍然存在，请："
Write-Host "   1. 打开浏览器控制台（F12）"
Write-Host "   2. 切换到 Network 标签"
Write-Host "   3. 上传图片并查看失败的请求详情"
Write-Host "   4. 截图并提供错误信息`n"

