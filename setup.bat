@echo off
setlocal enabledelayedexpansion
REM hzero-front-i18n skill setup script
REM Copies commands to AI tool command directories (opencode + Claude Code if present)

set SKILL_DIR=%~dp0
set SOURCE=%SKILL_DIR%commands\hzero-front-i18n-*.md

echo Setting up hzero-front-i18n skill...

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
echo   /hzero-front-i18n-query     - Query i18n entries
echo   /hzero-front-i18n-add       - Add new i18n entry
echo   /hzero-front-i18n-modify    - Modify i18n entry
echo   /hzero-front-i18n-delete    - Delete i18n entry
echo   /hzero-front-i18n-check     - Check code for i18n issues
echo   /hzero-front-i18n-translate - Translate i18n entries
echo   /hzero-front-i18n-export    - Export to Excel/CSV
echo   /hzero-front-i18n-import    - Import from Excel/CSV
echo   /hzero-front-i18n-update    - Check for skill updates
echo   /hzero-front-i18n-release   - Release: changelog + commit + push
echo.
echo Restart your AI tool to use the commands.
echo Tip: after "git pull" updates, re-run this script to refresh commands.
endlocal
