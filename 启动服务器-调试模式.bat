@echo off
chcp 65001 >nul
title PixelGenie 后端服务器 - 调试模式
color 0A

echo ========================================
echo   PixelGenie 后端服务器 - 调试模式
echo ========================================
echo.

cd /d "%~dp0server"

echo [检查] 当前目录：
cd
echo.

echo [检查] Node.js 版本：
node --version
echo.

echo [检查] .env 文件是否存在：
if exist .env (
    echo ✅ .env 文件存在
) else (
    echo ❌ .env 文件不存在！
    echo.
    echo 请创建 server\.env 文件并添加以下内容：
    echo GOOGLE_API_KEY=你的密钥
    echo CLOUDFLARE_API_TOKEN=你的令牌
    echo CLOUDFLARE_ACCOUNT_ID=你的账号ID
    echo.
    pause
    exit /b 1
)
echo.

echo [检查] 端口 3001 是否被占用：
netstat -ano | findstr :3001
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ 端口 3001 已被占用！
    echo.
    set /p KILL_PORT="是否结束占用端口的进程？(y/n): "
    if /i "%KILL_PORT%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
            echo 正在结束进程 %%a...
            taskkill /PID %%a /F
        )
    )
) else (
    echo ✅ 端口 3001 未被占用
)
echo.

echo ========================================
echo   正在启动后端服务器...
echo ========================================
echo.
echo 如果服务器立即退出，请检查上面的错误信息
echo.

node index.js

echo.
echo ========================================
echo   服务器已停止
echo ========================================
echo.
pause

