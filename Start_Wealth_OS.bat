@echo off
set PORT=3001
set BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
start "" "http://localhost:3001/wealth-os.html"
if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" server.js
) else (
  node server.js
)
