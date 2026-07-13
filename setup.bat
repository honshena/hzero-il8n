@echo off
setlocal enabledelayedexpansion
REM hzero-il8n skill setup script
REM Copies commands to AI tool command directories (opencode + Claude Code if present)

set SKILL_DIR=%~dp0
set SOURCE=%SKILL_DIR%commands\hzero-il8n-*.md

echo Setting up hzero-il8n skill...

REM opencode (default)
set TARGET=%USERPROFILE%\.config\opencode\commands
if not exist "!TARGET!" mkdir "!TARGET!"
copy /Y "%SOURCE%" "!TARGET!" >nul
echo Copied to: !TARGET!

REM Claude Code (if installed)
if exist "%USERPROFILE%\.claude" (
  set TARGET=%USERPROFILE%\.claude\commands
  if not exist "!TARGET!" mkdir "!TARGET!"
  copy /Y "%SOURCE%" "!TARGET!" >nul
  echo Copied to: !TARGET!
)

echo.
echo Setup complete! Commands registered:
echo   /hzero-il8n-query     - Query i18n entries
echo   /hzero-il8n-add       - Add new i18n entry
echo   /hzero-il8n-modify    - Modify i18n entry
echo   /hzero-il8n-delete    - Delete i18n entry
echo   /hzero-il8n-check     - Check code for i18n issues
echo   /hzero-il8n-translate - Translate i18n entries
echo   /hzero-il8n-export    - Export to Excel/CSV
echo   /hzero-il8n-import    - Import from Excel/CSV
echo   /hzero-il8n-update    - Check for skill updates
echo.
echo Restart your AI tool to use the commands.
echo Tip: after "git pull" updates, re-run this script to refresh commands.
endlocal
