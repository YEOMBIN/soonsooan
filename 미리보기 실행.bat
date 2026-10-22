@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  순수안피부과 가시안 미리보기 (이 컴퓨터에서만 열림 - 127.0.0.1)
echo.
where node >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:5500/
  node serve.js 5500
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:5500/
  python -m http.server 5500 --bind 127.0.0.1
  goto :eof
)
echo  Node.js 또는 Python이 없어 로컬 서버를 열 수 없습니다.
echo  index.html 을 더블클릭해 바로 열어도 대부분 확인할 수 있습니다. (README.md 참고)
pause
