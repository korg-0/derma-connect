@echo off
title DermaConnect - Backend (Supabase)
echo ========================================
echo Starting DermaConnect Backend...
echo ========================================

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Users\mansi\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    
    echo Waiting for Docker to initialize...
    :wait_loop
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto wait_loop
    echo Docker is ready!
)

:: Start Supabase
echo Starting Supabase containers...
cd /d "C:\Users\mansi\derma-connect\supabase-repo\docker"
docker compose up -d

echo.
echo Backend is running at: http://localhost:8000
echo You can close this window, but do NOT close Docker Desktop.
timeout /t 5