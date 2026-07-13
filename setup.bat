@echo off
REM hzero-il8n skill setup script
REM Copies commands to opencode commands directory

set SKILL_DIR=%~dp0
set COMMANDS_DIR=%USERPROFILE%\.config\opencode\commands

echo Setting up hzero-il8n skill...

REM Create commands directory if not exists
if not exist "%COMMANDS_DIR%" (
    mkdir "%COMMANDS_DIR%"
)

REM Copy command files
copy /Y "%SKILL_DIR%commands\hzero-il8n-*.md" "%COMMANDS_DIR%"

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
echo.
echo Please restart opencode to use the commands.
