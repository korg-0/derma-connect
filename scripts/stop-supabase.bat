@echo off
title DermaConnect - Stopping Backend
echo ========================================
echo Stopping Supabase Backend...
echo ========================================

cd /d "C:\Users\mansi\derma-connect\supabase-repo\docker"
docker compose down

echo.
echo Backend stopped successfully.
timeout /t 3