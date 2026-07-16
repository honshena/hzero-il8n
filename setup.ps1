# hzero-front-i18n skill setup script
# Copies each command.md under commands/*/ to AI tool command directories,
# renaming to hzero-front-i18n-{folder}.md (e.g. commands/check/command.md -> hzero-front-i18n-check.md)

$SkillDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommandsRoot = Join-Path $SkillDir 'commands'

# Target command directories: opencode (default) + Claude Code (if present)
$Targets = @("$env:USERPROFILE\.config\opencode\commands")
if (Test-Path "$env:USERPROFILE\.claude") {
  $Targets += "$env:USERPROFILE\.claude\commands"
}

Write-Host "Setting up hzero-front-i18n skill..." -ForegroundColor Cyan

if (-not (Test-Path $CommandsRoot)) {
  Write-Host "  commands/ 目录不存在，无命令可注册" -ForegroundColor Red
  exit 1
}

$commandDirs = Get-ChildItem -Path $CommandsRoot -Directory
if (-not $commandDirs) {
  Write-Host "  commands/ 下无子目录，无命令可注册" -ForegroundColor Red
  exit 1
}

foreach ($Dir in $Targets) {
  if (-not (Test-Path $Dir)) {
    New-Item -ItemType Directory -Path $Dir -Force | Out-Null
  }
  foreach ($cmdDir in $commandDirs) {
    $cmdFile = Join-Path $cmdDir.FullName 'command.md'
    if (Test-Path $cmdFile) {
      $destName = "hzero-front-i18n-$($cmdDir.Name).md"
      Copy-Item -Path $cmdFile -Destination (Join-Path $Dir $destName) -Force
      Write-Host "  -> $Dir\$destName" -ForegroundColor DarkGray
    }
  }
}

Write-Host ""
Write-Host "Setup complete! Commands registered:" -ForegroundColor Green
Write-Host "  /hzero-front-i18n-check     - Check code for i18n issues"
Write-Host "  /hzero-front-i18n-update    - Check for skill updates"
Write-Host "  /hzero-front-i18n-release   - Release: changelog + commit + push"
Write-Host ""
Write-Host "Restart your AI tool to use the commands." -ForegroundColor Yellow
Write-Host "Tip: after 'git pull' updates, re-run this script to refresh commands." -ForegroundColor Yellow
