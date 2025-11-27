@echo off
chcp 65001 >nul
title PixelGenie 后端服务器
color 0A

echo.
echo ╔════════════════════════════════════════╗
echo ║    PixelGenie 后端服务器启动工具      ║
echo ╚════════════════════════════════════════╝
echo.

cd /d "%~dp0server"

echo [检查] 检查 .env 配置文件...
if not exist ".env" (
    echo ⚠️ .env 文件不存在，正在创建...
    copy env.example .env >nul
    echo ✅ .env 文件已创建
    echo.
    echo ⚠️ 重要提示：
    echo    请编辑 server\.env 文件，添加您的 API 密钥
    echo    至少需要配置以下之一：
    echo    - GOOGLE_API_KEY （推荐）
    echo    - CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
    echo    - HUGGINGFACE_API_KEY
    echo.
    echo 按任意键继续启动服务器...
    pause >nul
) else (
    echo ✅ .env 文件存在
)

echo.
echo [启动] 正在启动后端服务器...
echo.
echo ════════════════════════════════════════
echo.

node index.js

echo.
echo ════════════════════════════════════════
echo.
echo ⚠️ 服务器已停止
echo.
pause

