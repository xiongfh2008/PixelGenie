#!/bin/bash
# Pre-commit hook to prevent committing sensitive information

echo "🔒 Running security checks..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Flag to track if any checks fail
FAILED=0

# Check 1: Ensure .env files are not being committed
echo "📝 Checking for .env files..."
if git diff --cached --name-only | grep -E '\.env$|\.env\.local$'; then
    echo -e "${RED}❌ ERROR: .env file detected in commit!${NC}"
    echo "   Please remove .env files from the commit:"
    echo "   git reset HEAD server/.env"
    FAILED=1
else
    echo -e "${GREEN}✅ No .env files in commit${NC}"
fi

# Check 2: Look for API key patterns in staged files
echo "📝 Checking for API key patterns..."
if git diff --cached | grep -E 'AIzaSy[A-Za-z0-9_-]{33}|sk-[A-Za-z0-9]{48}|xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[A-Za-z0-9]{24}'; then
    echo -e "${RED}❌ ERROR: Potential API key detected in commit!${NC}"
    echo "   Please remove hardcoded API keys from your code"
    echo "   Use environment variables instead: process.env.API_KEY"
    FAILED=1
else
    echo -e "${GREEN}✅ No API key patterns detected${NC}"
fi

# Check 3: Look for common secret patterns
echo "📝 Checking for secret patterns..."
if git diff --cached | grep -iE 'password.*=.*["\'][^"\']{8,}["\']|secret.*=.*["\'][^"\']{8,}["\']|token.*=.*["\'][^"\']{16,}["\']'; then
    echo -e "${YELLOW}⚠️  WARNING: Potential secret detected${NC}"
    echo "   Please review your changes carefully"
    echo "   Make sure you're not committing sensitive information"
    # Don't fail on this, just warn
fi

# Check 4: Ensure sensitive files are in .gitignore
echo "📝 Checking .gitignore..."
if [ ! -f .gitignore ]; then
    echo -e "${RED}❌ ERROR: .gitignore file not found!${NC}"
    FAILED=1
elif ! grep -q "\.env" .gitignore; then
    echo -e "${RED}❌ ERROR: .env not in .gitignore!${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
fi

# Check 5: Look for credentials in file names
echo "📝 Checking file names..."
if git diff --cached --name-only | grep -iE 'secret|credential|password|private|key\.json|\.pem$'; then
    echo -e "${YELLOW}⚠️  WARNING: Suspicious file name detected${NC}"
    echo "   Please ensure these files don't contain sensitive data"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 1 ]; then
    echo -e "${RED}❌ COMMIT BLOCKED: Security checks failed!${NC}"
    echo "   Please fix the issues above and try again."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
else
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo "   Safe to commit."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

