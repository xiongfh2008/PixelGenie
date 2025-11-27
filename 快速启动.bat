@echo off
chcp 65001 >nul
title PixelGenie 快速启动
color 0B

echo.
echo ╔════════════════════════════════════════╗
echo ║    PixelGenie AI 图像处理平台          ║
echo ║         快速启动工具 v2.0              ║
echo ╚════════════════════════════════════════╝
echo.

:: 检查 Node.js
echo [1/4] 检查 Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js 未安装！
    echo 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)
echo ✅ Node.js 已安装
echo.

:: 检查依赖
echo [2/4] 检查项目依赖...
if not exist "node_modules" (
    echo ⚠️ 依赖未安装，正在安装...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 依赖安装失败！
        pause
        exit /b 1
    )
)
echo ✅ 项目依赖完整
echo.

:: 检查 .env 文件
echo [3/4] 检查配置文件...
if not exist "server\.env" (
    echo ❌ 配置文件不存在！
    echo.
    echo 请创建 server\.env 文件并添加API密钥
    echo 参考 server\env.example 文件
    echo.
    pause
    exit /b 1
)
echo ✅ 配置文件存在
echo.

:: 检查端口占用
echo [4/4] 检查端口占用...
netstat -ano | findstr ":3001" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ 端口 3001 已被占用
    echo 正在尝试释放端口...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

netstat -ano | findstr ":5173" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ 端口 5173 已被占用
    echo 正在尝试释放端口...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)
echo ✅ 端口检查完成
echo.

echo ════════════════════════════════════════
echo   正在启动服务...
echo ════════════════════════════════════════
echo.

:: 启动后端（在新窗口）
echo 🚀 启动后端服务器...
start "PixelGenie 后端 (端口 3001)" cmd /k "cd /d %~dp0server && echo. && echo ╔════════════════════════════════════════╗ && echo ║     PixelGenie 后端服务器              ║ && echo ╚════════════════════════════════════════╝ && echo. && node index.js || (echo. && echo ❌ 服务器启动失败！ && echo 请检查上面的错误信息 && echo. && pause)"

:: 等待后端启动
echo ⏳ 等待后端服务器启动...
timeout /t 5 /nobreak >nul

:: 检查后端是否成功启动
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ 警告：后端服务器可能未成功启动
    echo 请检查"PixelGenie 后端"窗口中的错误信息
    echo.
    set /p CONTINUE="是否继续启动前端？(y/n): "
    if /i not "%CONTINUE%"=="y" (
        exit /b 1
    )
) else (
    echo ✅ 后端服务器已启动
)
echo.

:: 启动前端（在新窗口）
echo 🎨 启动前端服务器...
start "PixelGenie 前端 (端口 5173)" cmd /k "cd /d %~dp0 && echo. && echo ╔════════════════════════════════════════╗ && echo ║     PixelGenie 前端服务器              ║ && echo ╚════════════════════════════════════════╝ && echo. && npm run dev"

:: 等待前端启动
timeout /t 3 /nobreak >nul

echo.
echo ════════════════════════════════════════
echo   ✅ 启动完成！
echo ════════════════════════════════════════
echo.
echo 📌 访问地址：
echo    🌐 前端界面: http://localhost:5173
echo    🔧 后端 API: http://localhost:3001
echo    💚 健康检查: http://localhost:3001/api/health
echo.
echo 💡 提示：
echo    - 两个服务窗口已打开
echo    - 请保持这两个窗口运行
echo    - 关闭窗口将停止对应服务
echo    - 如果遇到问题，请运行"启动服务器-调试模式.bat"
echo.
echo 按任意键打开浏览器...
pause >nul

start http://localhost:5173

echo.
echo 浏览器已打开，祝使用愉快！
echo.
timeout /t 3 /nobreak >nul

