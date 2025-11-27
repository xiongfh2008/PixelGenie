@echo off
chcp 65001 >nul
cd /d %~dp0server
echo 正在启动后端服务器...
echo.
node index.js
pause

