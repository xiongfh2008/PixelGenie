# 一键修复 API 错误
Write-Host "`n🔧 一键修复 API 错误`n" -ForegroundColor Cyan
Write-Host "=" * 70

# 步骤 1: 清除缓存
Write-Host "`n📝 步骤 1: 清除缓存..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force server\node_modules\.cache -ErrorAction SilentlyContinue
Write-Host "✅ 缓存已清除" -ForegroundColor Green

# 步骤 2: 检查配置
Write-Host "`n📝 步骤 2: 检查配置..." -ForegroundColor Yellow
node fix-vite-api-error.js

# 步骤 3: 检查 API 状态
Write-Host "`n📝 步骤 3: 检查 API 状态..." -ForegroundColor Yellow
node check-api-status.js

# 完成
Write-Host "`n" + "=" * 70
Write-Host "🎉 修复完成！" -ForegroundColor Green
Write-Host "=" * 70

Write-Host "`n📋 下一步：" -ForegroundColor Cyan
Write-Host "   1. 重启开发服务器: npm run dev:all"
Write-Host "   2. 在浏览器中按 Ctrl+Shift+R 强制刷新"
Write-Host "   3. 测试智能鉴伪功能`n"

