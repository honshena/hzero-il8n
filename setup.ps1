# hzero-il8n skill setup script
# Copies commands to AI tool command directories (opencode + Claude Code if present)

$SkillDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Source = "$SkillDir\commands\hzero-il8n-*.md"

# Target command directories: opencode (default) + Claude Code (if installed)
$Targets = @("$env:USERPROFILE\.config\opencode\commands")
if (Test-Path "$env:USERPROFILE\.claude") {
  $Targets += "$env:USERPROFILE\.claude\commands"
}

Write-Host "Setting up hzero-il8n skill..." -ForegroundColor Cyan

foreach ($Dir in $Targets) {
  if (-not (Test-Path $Dir)) {
    New-Item -ItemType Directory -Path $Dir -Force | Out-Null
  }
  Copy-Item -Path $Source -Destination $Dir -Force
  Write-Host "  -> $Dir" -ForegroundColor DarkGray
}

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
Write-Host "  /hzero-il8n-update    - Check for skill updates"
Write-Host ""
Write-Host "Restart your AI tool to use the commands." -ForegroundColor Yellow
Write-Host "Tip: after 'git pull' updates, re-run this script to refresh commands." -ForegroundColor Yellow
