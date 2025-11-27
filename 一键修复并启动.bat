@echo off
chcp 65001 >nul
title PixelGenie 一键修复并启动
color 0B

echo ========================================
echo   PixelGenie 一键修复并启动
echo ========================================
echo.

echo [步骤 1/4] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装
echo.

echo [步骤 2/4] 检查依赖...
cd /d "%~dp0"
if not exist "node_modules" (
    echo ⚠️  依赖未安装，正在安装...
    call npm install
) else (
    echo ✅ 依赖已安装
)
echo.

echo [步骤 3/4] 启动后端服务器...
start "PixelGenie 后端" cmd /k "cd /d %~dp0server && echo 🚀 正在启动后端服务器... && echo. && node index.js"
echo ✅ 后端服务器已在新窗口中启动
echo.

echo [步骤 4/4] 等待后端启动...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   ✅ 启动完成！
echo ========================================
echo.
echo 📌 服务地址：
echo    前端界面: http://localhost:5173
echo    后端 API: http://localhost:3001
echo    健康检查: http://localhost:3001/api/health
echo.
echo 💡 提示：
echo    - 后端已在新窗口中运行
echo    - 前端请在 Cursor 中重启（Ctrl+C 停止，然后 npm run dev）
echo    - 或者按任意键在新窗口中启动前端
echo.
pause

echo.
echo [可选] 启动前端服务器...
start "PixelGenie 前端" cmd /k "cd /d %~dp0 && echo 🎨 正在启动前端服务器... && echo. && npm run dev"
echo ✅ 前端服务器已在新窗口中启动
echo.

echo ========================================
echo   🎉 全部启动完成！
echo ========================================
echo.
echo 请访问: http://localhost:5173
echo.
pause

