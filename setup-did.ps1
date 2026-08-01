# setup-did.ps1 — Write D-ID API key to .env.production for Vercel deployment
# Run from PowerShell: powershell -ExecutionPolicy Bypass -File setup-did.ps1

param()

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Aridon — D-ID API Key Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This writes your D-ID key directly into .env.production" -ForegroundColor Gray
Write-Host "so it gets baked into the Vercel build (bypasses dashboard)." -ForegroundColor Gray
Write-Host ""

$key = Read-Host "Paste your D-ID API key (input is hidden)" -AsSecureString
$plainKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($key)
)

if (-not $plainKey -or $plainKey.Trim().Length -eq 0) {
    Write-Host "No key entered. Exiting." -ForegroundColor Red
    exit 1
}

$trimmedKey = $plainKey.Trim()

# Write with Unix line endings, no BOM — avoids Windows encoding issues
$envFile = Join-Path $projectDir ".env.production"
$content = "DID_API_KEY=$trimmedKey"
[System.IO.File]::WriteAllText($envFile, $content + "`n", [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "Written to .env.production" -ForegroundColor Green
$preview = $trimmedKey.Substring(0, [Math]::Min(6, $trimmedKey.Length))
$suffix  = if ($trimmedKey.Length -gt 4) { $trimmedKey.Substring($trimmedKey.Length - 4) } else { "" }
Write-Host "Key preview: $preview...$suffix  (length: $($trimmedKey.Length))" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ready to deploy. Run deploy-now.bat to push to Vercel." -ForegroundColor Cyan
Write-Host ""
