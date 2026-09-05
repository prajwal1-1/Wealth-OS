@echo off
cd /d "%~dp0"
start "" "http://127.0.0.1:3000/visiting-card-extractor.html"
"C:\Users\ADMIN\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
pause
