@echo off
setlocal enabledelayedexpansion
REM hzero-front-i18n skill setup script
REM Copies each commands/*/command.md to AI tool command directories,
REM renaming to hzero-front-i18n-{folder}.md

set SKILL_DIR=%~dp0
set COMMANDS_ROOT=%SKILL_DIR%commands

echo Setting up hzero-front-i18n skill...

if not exist "%COMMANDS_ROOT%" (
  echo   commands/ directory not found, no commands to register
  exit /b 1
)

REM Target 1: opencode (default)
set TARGET1=%USERPROFILE%\.config\opencode\commands
if not exist "!TARGET1!" mkdir "!TARGET1!"

REM Target 2: Claude Code (if present)
set TARGET2=
if exist "%USERPROFILE%\.claude" set TARGET2=%USERPROFILE%\.claude\commands
if defined TARGET2 if not exist "!TARGET2!" mkdir "!TARGET2!"

for /d %%D in ("%COMMANDS_ROOT%\*") do (
  if exist "%%D\command.md" (
    set FOLDER=%%~nxD
    set DEST_NAME=hzero-front-i18n-!FOLDER!.md
    copy /Y "%%D\command.md" "!TARGET1!\!DEST_NAME!" >nul
    echo   Copied to: !TARGET1!\!DEST_NAME!
    if defined TARGET2 (
      copy /Y "%%D\command.md" "!TARGET2!\!DEST_NAME!" >nul
      echo   Copied to: !TARGET2!\!DEST_NAME!
    )
  )
)

echo.
echo Setup complete! Commands registered:
echo   /hzero-front-i18n-check     - Check code for i18n issues
echo   /hzero-front-i18n-update    - Check for skill updates
echo   /hzero-front-i18n-release   - Release: changelog + commit + push
echo.
echo Restart your AI tool to use the commands.
echo Tip: after "git pull" updates, re-run this script to refresh commands.
endlocal
