# Install Git hooks for security checks (PowerShell version)

Write-Host ""
Write-Host "🔧 Installing Git Hooks for Security" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Get the Git hooks directory
$gitHooksDir = ".git\hooks"

# Check if .git directory exists
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a Git repository" -ForegroundColor Red
    Write-Host "   Please run this script from the root of your Git repository" -ForegroundColor Yellow
    exit 1
}

# Create hooks directory if it doesn't exist
if (-not (Test-Path $gitHooksDir)) {
    New-Item -ItemType Directory -Path $gitHooksDir | Out-Null
}

# Create pre-commit hook
$preCommitHook = @"
#!/bin/sh
# Pre-commit hook - runs security checks

# Run PowerShell security check script
powershell.exe -ExecutionPolicy Bypass -File scripts/pre-commit-check.ps1
exit `$?
"@

$preCommitPath = Join-Path $gitHooksDir "pre-commit"

# Write the hook
Set-Content -Path $preCommitPath -Value $preCommitHook -Encoding UTF8

Write-Host "✅ Pre-commit hook installed" -ForegroundColor Green
Write-Host "   Location: $preCommitPath" -ForegroundColor Gray

# Make the hook executable (Git Bash on Windows)
if (Get-Command git -ErrorAction SilentlyContinue) {
    git update-index --chmod=+x $preCommitPath 2>$null
}

Write-Host ""
Write-Host "📋 What this does:" -ForegroundColor Cyan
Write-Host "   • Checks for .env files before commit" -ForegroundColor White
Write-Host "   • Scans for API key patterns" -ForegroundColor White
Write-Host "   • Detects potential secrets" -ForegroundColor White
Write-Host "   • Verifies .gitignore configuration" -ForegroundColor White
Write-Host ""

Write-Host "🧪 Testing the hook..." -ForegroundColor Cyan
Write-Host ""

# Test the hook
& powershell.exe -ExecutionPolicy Bypass -File scripts/pre-commit-check.ps1

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Git hooks installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. The hook will run automatically before each commit" -ForegroundColor White
Write-Host "   2. If checks fail, the commit will be blocked" -ForegroundColor White
Write-Host "   3. Fix the issues and try committing again" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To manually run checks:" -ForegroundColor Cyan
Write-Host "   powershell -ExecutionPolicy Bypass -File scripts/pre-commit-check.ps1" -ForegroundColor Gray
Write-Host ""

