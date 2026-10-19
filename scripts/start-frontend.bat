@echo off
title DermaConnect - Frontend (Next.js)
echo ========================================
echo Starting DermaConnect Frontend...
echo ========================================

cd /d "C:\Users\mansi\derma-connect"
call npm run dev

:: If the server crashes, pause so you can read the error
pause