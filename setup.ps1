# hzero-il8n skill setup script
# Copies commands to opencode commands directory

$SkillDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommandsDir = Join-Path $env:USERPROFILE ".config\opencode\commands"

Write-Host "Setting up hzero-il8n skill..." -ForegroundColor Cyan

# Create commands directory if not exists
if (-not (Test-Path $CommandsDir)) {
    New-Item -ItemType Directory -Path $CommandsDir -Force | Out-Null
}

# Copy command files
Copy-Item -Path "$SkillDir\commands\hzero-il8n-*.md" -Destination $CommandsDir -Force

Write-Host ""
Write-Host "Setup complete! Commands registered:" -ForegroundColor Green
Write-Host "  /hzero-il8n-query     - Query i18n entries"
Write-Host "  /hzero-il8n-add       - Add new i18n entry"
Write-Host "  /hzero-il8n-modify    - Modify i18n entry"
Write-Host "  /hzero-il8n-delete    - Delete i18n entry"
Write-Host "  /hzero-il8n-check     - Check code for i18n issues"
Write-Host "  /hzero-il8n-translate - Translate i18n entries"
Write-Host "  /hzero-il8n-export    - Export to Excel/CSV"
Write-Host "  /hzero-il8n-import    - Import from Excel/CSV"
Write-Host ""
Write-Host "Please restart opencode to use the commands." -ForegroundColor Yellow
