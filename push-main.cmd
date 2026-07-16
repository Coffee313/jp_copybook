@echo off
setlocal
cd /d "%~dp0"

git add -u
git add push-main.cmd pitch-accent.js

git diff --cached --quiet
if %errorlevel%==0 (
  echo Nothing to publish.
  exit /b 0
)

git commit -m "publish updates"
git push -u origin main

endlocal
