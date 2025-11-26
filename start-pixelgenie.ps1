# PixelGenie 一键启动脚本
param(
    [switch]$KillOld = $false
)

Write-Host "`n🚀 PixelGenie 启动脚本`n" -ForegroundColor Cyan
Write-Host "=" * 70

# 检查并终止占用端口的进程
Write-Host "`n📝 检查端口占用..." -ForegroundColor Yellow

$port3001 = netstat -ano | findstr ":3001.*LISTENING"
if ($port3001) {
    $pid = ($port3001 -split '\s+')[-1]
    Write-Host "⚠️  端口 3001 被进程 $pid 占用" -ForegroundColor Yellow
    
    if ($KillOld) {
        Write-Host "   正在终止旧进程..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ 旧进程已终止" -ForegroundColor Green
    } else {
        Write-Host "   使用 -KillOld 参数自动终止旧进程" -ForegroundColor Yellow
        $response = Read-Host "   是否终止该进程? (y/n)"
        if ($response -eq 'y') {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Write-Host "✅ 旧进程已终止" -ForegroundColor Green
        } else {
            Write-Host "❌ 已取消，请手动终止进程" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "✅ 端口 3001 可用" -ForegroundColor Green
}

# 启动后端服务器
Write-Host "`n📝 启动后端服务器..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; Write-Host '🔧 后端服务器' -ForegroundColor Cyan; node index.js"
Start-Sleep -Seconds 3

# 验证后端启动
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 后端服务器启动成功" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 后端服务器启动失败" -ForegroundColor Red
    Write-Host "   请检查后端窗口的错误信息" -ForegroundColor Yellow
    exit 1
}

# 启动前端
Write-Host "`n📝 启动前端..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '🎨 前端服务器' -ForegroundColor Cyan; npm run dev"

Write-Host "`n" + "=" * 70
Write-Host "🎉 PixelGenie 启动完成！" -ForegroundColor Green
Write-Host "=" * 70

Write-Host "`n📋 访问地址：" -ForegroundColor Cyan
Write-Host "   前端: http://localhost:5173/ 或 http://localhost:5174/"
Write-Host "   后端: http://localhost:3001/"

Write-Host "`n💡 提示：" -ForegroundColor Yellow
Write-Host "   - 两个 PowerShell 窗口已打开（前端和后端）"
Write-Host "   - 关闭窗口或按 Ctrl+C 停止服务"
Write-Host "   - 查看窗口日志了解运行状态`n"

