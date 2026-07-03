# Aridon GitHub Setup Script
# Run this by right-clicking > "Run with PowerShell"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ARIDON - GitHub Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git is not installed." -ForegroundColor Red
    Write-Host "Download it at: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "Git found: $(git --version)" -ForegroundColor Green

# Navigate to script directory
Set-Location $PSScriptRoot
Write-Host "Working in: $PSScriptRoot" -ForegroundColor Gray
Write-Host ""

# Initialize git if needed
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repo..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Stage and commit
Write-Host "Staging all files..." -ForegroundColor Yellow
git add .
$status = git status --short
Write-Host $status -ForegroundColor Gray

Write-Host ""
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit - Aridon v0.2 AI Executive OS"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Connect to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now go to: https://github.com/new" -ForegroundColor Yellow
Write-Host ""
Write-Host "Create a NEW repo named: aridon-app" -ForegroundColor White
Write-Host "  - Owner: your account" -ForegroundColor Gray
Write-Host "  - Visibility: Private or Public (your choice)" -ForegroundColor Gray
Write-Host "  - Do NOT initialize with README, .gitignore, or license" -ForegroundColor Gray
Write-Host ""

$username = Read-Host "Enter your GitHub username"

if ($username) {
    $remoteUrl = "https://github.com/$username/aridon-app.git"
    Write-Host ""
    Write-Host "Adding remote: $remoteUrl" -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin $remoteUrl

    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    Write-Host "(A browser window or credential prompt may open)" -ForegroundColor Gray
    git push -u origin main

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Code is on GitHub." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next: Go to https://vercel.com/new" -ForegroundColor Cyan
        Write-Host "  1. Import from GitHub -> aridon-app" -ForegroundColor White
        Write-Host "  2. In Environment Variables add:" -ForegroundColor White
        Write-Host "     OPENAI_API_KEY = your-key-here" -ForegroundColor Yellow
        Write-Host "  3. Click Deploy" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "Push failed. You may need to authenticate." -ForegroundColor Red
        Write-Host "Try: git push -u origin main" -ForegroundColor Yellow
        Write-Host "If prompted, use your GitHub username + a Personal Access Token as password." -ForegroundColor Gray
    }
}

Write-Host ""
Read-Host "Press Enter to close"
