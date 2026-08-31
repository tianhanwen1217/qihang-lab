@echo off
set FNM_DIR=D:\fnm
set FNM_MULTISHELL_PATH=%LOCALAPPDATA%\fnm_multishells\vscode_debug
if not exist "%FNM_MULTISHELL_PATH%" mkdir "%FNM_MULTISHELL_PATH%"
set PATH=%FNM_MULTISHELL_PATH%;D:\fnm;%PATH%
D:\fnm\fnm.exe use 22 >nul 2>&1
cd /d "%~dp0"
npm run start:debug
