@echo off
chcp 65001 >nul
title PixelGenie 后端服务器
color 0A

echo ========================================
echo   PixelGenie 后端服务器启动中...
echo ========================================
echo.
echo 当前目录: %CD%
echo Node版本:
node --version
echo.
echo ========================================
echo.

cd /d "%~dp0server"
echo 切换到目录: %CD%
echo.
echo 正在启动后端服务器...
echo.

node index.js

echo.
echo ========================================
echo   后端服务器已停止
echo ========================================
pause

