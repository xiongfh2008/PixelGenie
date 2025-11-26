# Pre-commit hook to prevent committing sensitive information (PowerShell version)

Write-Host "🔒 Running security checks..." -ForegroundColor Cyan

$FAILED = $false

# Check 1: Ensure .env files are not being committed
Write-Host "📝 Checking for .env files..." -ForegroundColor White
$envFiles = git diff --cached --name-only | Select-String -Pattern '\.env$|\.env\.local$'
if ($envFiles) {
    Write-Host "❌ ERROR: .env file detected in commit!" -ForegroundColor Red
    Write-Host "   Please remove .env files from the commit:" -ForegroundColor Yellow
    Write-Host "   git reset HEAD server/.env" -ForegroundColor Yellow
    $FAILED = $true
} else {
    Write-Host "✅ No .env files in commit" -ForegroundColor Green
}

# Check 2: Look for API key patterns in staged files
Write-Host "📝 Checking for API key patterns..." -ForegroundColor White
$apiKeys = git diff --cached | Select-String -Pattern 'AIzaSy[A-Za-z0-9_-]{33}|sk-[A-Za-z0-9]{48}|xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[A-Za-z0-9]{24}'
if ($apiKeys) {
    Write-Host "❌ ERROR: Potential API key detected in commit!" -ForegroundColor Red
    Write-Host "   Please remove hardcoded API keys from your code" -ForegroundColor Yellow
    Write-Host "   Use environment variables instead: process.env.API_KEY" -ForegroundColor Yellow
    $FAILED = $true
} else {
    Write-Host "✅ No API key patterns detected" -ForegroundColor Green
}

# Check 3: Look for common secret patterns
Write-Host "📝 Checking for secret patterns..." -ForegroundColor White
$secrets = git diff --cached | Select-String -Pattern 'password.*=.*["\'][^"\']{8,}["\']|secret.*=.*["\'][^"\']{8,}["\']|token.*=.*["\'][^"\']{16,}["\']'
if ($secrets) {
    Write-Host "⚠️  WARNING: Potential secret detected" -ForegroundColor Yellow
    Write-Host "   Please review your changes carefully" -ForegroundColor Yellow
    Write-Host "   Make sure you're not committing sensitive information" -ForegroundColor Yellow
}

# Check 4: Ensure sensitive files are in .gitignore
Write-Host "📝 Checking .gitignore..." -ForegroundColor White
if (-not (Test-Path .gitignore)) {
    Write-Host "❌ ERROR: .gitignore file not found!" -ForegroundColor Red
    $FAILED = $true
} elseif (-not (Select-String -Path .gitignore -Pattern '\.env' -Quiet)) {
    Write-Host "❌ ERROR: .env not in .gitignore!" -ForegroundColor Red
    $FAILED = $true
} else {
    Write-Host "✅ .gitignore properly configured" -ForegroundColor Green
}

# Check 5: Look for credentials in file names
Write-Host "📝 Checking file names..." -ForegroundColor White
$suspiciousFiles = git diff --cached --name-only | Select-String -Pattern 'secret|credential|password|private|key\.json|\.pem$' -CaseSensitive:$false
if ($suspiciousFiles) {
    Write-Host "⚠️  WARNING: Suspicious file name detected" -ForegroundColor Yellow
    Write-Host "   Please ensure these files don't contain sensitive data" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
if ($FAILED) {
    Write-Host "❌ COMMIT BLOCKED: Security checks failed!" -ForegroundColor Red
    Write-Host "   Please fix the issues above and try again." -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "✅ All security checks passed!" -ForegroundColor Green
    Write-Host "   Safe to commit." -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    exit 0
}

