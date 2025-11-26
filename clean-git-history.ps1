# 清理 Git 历史中的 .env 文件
# 这个脚本会从所有历史提交中移除 .env 文件

Write-Host "🔒 清理 Git 历史中的 .env 文件" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# 检查是否在 Git 仓库中
if (-not (Test-Path ".git")) {
    Write-Host "❌ 错误: 当前目录不是 Git 仓库" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  警告: 此操作会重写 Git 历史!" -ForegroundColor Yellow
Write-Host "   - 会从所有历史提交中移除 .env 文件" -ForegroundColor Yellow
Write-Host "   - 如果已经推送到远程，需要强制推送" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "是否继续? (输入 YES 继续)"

if ($confirm -ne "YES") {
    Write-Host "❌ 操作已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔍 检查历史中的 .env 文件..." -ForegroundColor Cyan

# 检查历史中是否有 .env 文件
$envHistory = git log --all --full-history --oneline -- .env server/.env 2>&1

if ($LASTEXITCODE -eq 0 -and $envHistory) {
    Write-Host "📋 找到以下包含 .env 的提交:" -ForegroundColor Yellow
    Write-Host $envHistory
    Write-Host ""
} else {
    Write-Host "✅ 历史中没有找到 .env 文件，无需清理" -ForegroundColor Green
    exit 0
}

Write-Host "🧹 开始清理..." -ForegroundColor Cyan
Write-Host ""

# 方法 1: 使用 git filter-repo (推荐，如果已安装)
$hasFilterRepo = git filter-repo --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 使用 git filter-repo (推荐方法)" -ForegroundColor Green
    
    git filter-repo --invert-paths --path .env --path server/.env --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 清理完成!" -ForegroundColor Green
    } else {
        Write-Host "❌ 清理失败" -ForegroundColor Red
        exit 1
    }
} else {
    # 方法 2: 使用 git filter-branch (备用方法)
    Write-Host "⚠️  git filter-repo 未安装，使用 git filter-branch" -ForegroundColor Yellow
    Write-Host "   (建议安装 git filter-repo: pip install git-filter-repo)" -ForegroundColor Yellow
    Write-Host ""
    
    # 使用 Git Bash 执行 filter-branch
    $filterCmd = @"
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env server/.env' \
  --prune-empty --tag-name-filter cat -- --all
"@
    
    Write-Host "执行命令: $filterCmd" -ForegroundColor Cyan
    
    # 在 Git Bash 中执行
    & "C:\Program Files\Git\bin\bash.exe" -c $filterCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 清理完成!" -ForegroundColor Green
        
        # 清理引用
        Write-Host "🧹 清理引用..." -ForegroundColor Cyan
        git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
        
        Write-Host "✅ 引用清理完成!" -ForegroundColor Green
    } else {
        Write-Host "❌ 清理失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔍 验证清理结果..." -ForegroundColor Cyan

$envHistoryAfter = git log --all --full-history --oneline -- .env server/.env 2>&1

if (-not $envHistoryAfter -or $envHistoryAfter -match "fatal") {
    Write-Host "✅ 验证成功: .env 文件已从历史中完全移除" -ForegroundColor Green
} else {
    Write-Host "⚠️  警告: 可能还有残留" -ForegroundColor Yellow
    Write-Host $envHistoryAfter
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 清理完成!" -ForegroundColor Green
Write-Host ""
Write-Host "下一步:" -ForegroundColor White
Write-Host "  1. 检查仓库状态: git status" -ForegroundColor Yellow
Write-Host "  2. 提交其他更改: git commit -m 'your message'" -ForegroundColor Yellow
Write-Host "  3. 推送到 GitHub: git push origin main --force" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  注意: 如果之前已经推送过，需要使用 --force 强制推送" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

