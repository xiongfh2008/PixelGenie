@echo off
chcp 65001 >nul
title PixelGenie 项目启动

echo ========================================
echo   PixelGenie AI 图像处理平台
echo ========================================
echo.

echo [步骤 1/2] 启动后端服务器...
echo.
start "PixelGenie 后端" cmd /k "cd /d %~dp0server && echo 正在启动后端服务器... && node index.js"

timeout /t 3 /nobreak >nul

echo [步骤 2/2] 启动前端服务器...
echo.
start "PixelGenie 前端" cmd /k "cd /d %~dp0 && echo 正在启动前端服务器... && npm run dev"

echo.
echo ========================================
echo   ✅ 启动完成！
echo ========================================
echo.
echo 📌 访问地址：
echo    前端界面: http://localhost:5173
echo    后端 API: http://localhost:3001
echo    健康检查: http://localhost:3001/api/health
echo.
echo 💡 提示：
echo    - 两个新窗口已打开（前端和后端）
echo    - 请保持这两个窗口运行
echo    - 关闭窗口将停止对应服务
echo.
pause

