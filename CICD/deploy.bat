@echo off
setlocal enabledelayedexpansion

REM Driven Devs CD Pipeline - Deployment Script for Windows
REM This script pulls Docker images from Docker Hub and deploys the application

echo 🚀 Starting Driven Devs CD Pipeline - Deployment Phase...

REM Configuration
set DOCKER_REGISTRY=thushshan
set FRONTEND_IMAGE=roomzi-frontend
set BACKEND_IMAGE=roomzi-backend
set IMAGE_TAG=1.0.0

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker-compose is not installed. Please install Docker Compose and try again.
    pause
    exit /b 1
)

REM Always try to create .env files from GitHub Secrets first (if available)
echo [INFO] Attempting to create .env files from GitHub Secrets...

REM Check if we have access to GitHub Secrets (either in GitHub Actions or locally with secrets)
if "%GITHUB_ACTIONS%"=="true" (
    echo [INFO] GitHub Actions detected - creating .env files from secrets
    goto :create_from_secrets
) else if not "%SUPABASE_URL%"=="" (
    echo [INFO] GitHub Secrets detected locally - creating .env files from secrets
    goto :create_from_secrets
) else if not "%SUPABASE_ANON_KEY%"=="" (
    echo [INFO] GitHub Secrets detected locally - creating .env files from secrets
    goto :create_from_secrets
) else (
    echo [INFO] No GitHub Secrets detected - falling back to templates
    goto :create_from_templates
)

:create_from_secrets
echo [INFO] Creating .env files from GitHub Secrets...

REM Create backend .env from secrets
if not exist "..\backend\.env" (
    echo [INFO] Creating backend .env from GitHub Secrets...
    echo # Backend Environment Variables > ..\backend\.env
    echo # Generated from GitHub Secrets >> ..\backend\.env
    echo # Update these values with your actual configuration >> ..\backend\.env
    echo. >> ..\backend\.env
    echo # Server Configuration >> ..\backend\.env
    echo PORT=3001 >> ..\backend\.env
    echo NODE_ENV=production >> ..\backend\.env
    echo. >> ..\backend\.env
    echo # Frontend URL (for CORS) >> ..\backend\.env
    echo FRONTEND_URL=http://localhost:80 >> ..\backend\.env
    echo. >> ..\backend\.env
    echo # Supabase Configuration >> ..\backend\.env
    echo SUPABASE_URL=%SUPABASE_URL% >> ..\backend\.env
    echo SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY% >> ..\backend\.env
    echo SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_SERVICE_ROLE_KEY% >> ..\backend\.env
    echo. >> ..\backend\.env
    echo # JWT Configuration >> ..\backend\.env
    echo JWT_SECRET=%JWT_SECRET% >> ..\backend\.env
    echo JWT_EXPIRES_IN=7d >> ..\backend\.env
    echo. >> ..\backend\.env
    echo # Session Configuration >> ..\backend\.env
    echo SESSION_SECRET=%SESSION_SECRET% >> ..\backend\.env
    echo. >> ..\backend\.env
    echo # Connect to Supabase via connection pooling >> ..\backend\.env
    echo DATABASE_URL=%DATABASE_URL% >> ..\backend\.env
    echo. >> ..\backend\.env
    echo # Direct connection to the database. Used for migrations >> ..\backend\.env
    echo DIRECT_URL=%DIRECT_URL% >> ..\backend\.env
    echo [SUCCESS] Backend .env file created from GitHub Secrets!
)

REM Create frontend .env from secrets
if not exist "..\frontend\.env" (
    echo [INFO] Creating frontend .env from GitHub Secrets...
    echo # Frontend Environment Variables > ..\frontend\.env
    echo # Generated from GitHub Secrets >> ..\frontend\.env
    echo # Update these values with your actual configuration >> ..\frontend\.env
    echo. >> ..\frontend\.env
    echo VITE_SUPABASE_URL=%SUPABASE_URL% >> ..\frontend\.env
    echo VITE_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY% >> ..\frontend\.env
    echo. >> ..\frontend\.env
    echo # Mapbox Configuration >> ..\frontend\.env
    echo VITE_MAPBOX_TOKEN=%MAPBOX_TOKEN% >> ..\frontend\.env
    echo [SUCCESS] Frontend .env file created from GitHub Secrets!
)

echo [SUCCESS] Environment files created from GitHub Secrets!
goto :continue_deploy

:create_from_templates
REM Check for backend .env file
if not exist "..\backend\.env" (
    echo [WARNING] .env file not found in the backend directory.
    echo [INFO] Creating backend .env file from template...
    
    if exist "env_backend.template" (
        echo # Backend Environment Variables > ..\backend\.env
        echo # Generated from CICD/env_backend.template >> ..\backend\.env
        echo # Update these values with your actual configuration >> ..\backend\.env
        type env_backend.template >> ..\backend\.env
        echo [SUCCESS] Backend .env file created successfully from template!
    ) else (
        echo [WARNING] env_backend.template not found, creating default backend configuration
        echo # Backend Environment Variables > ..\backend\.env
        echo # Default configuration - please update with your actual values >> ..\backend\.env
        echo PORT=3001 >> ..\backend\.env
        echo NODE_ENV="production" >> ..\backend\.env
        echo FRONTEND_URL="http://localhost:80" >> ..\backend\.env
        echo SUPABASE_URL="https://your-project.supabase.co" >> ..\backend\.env
        echo SUPABASE_ANON_KEY="your_supabase_anon_key_here" >> ..\backend\.env
        echo SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here" >> ..\backend\.env
        echo JWT_SECRET="" >> ..\backend\.env
        echo JWT_EXPIRES_IN="" >> ..\backend\.env
        echo SESSION_SECRET="" >> ..\backend\.env
        echo DATABASE_URL="" >> ..\backend\.env
        echo DIRECT_URL="" >> ..\backend\.env
        echo [SUCCESS] Backend .env file created with default configuration!
    )
    echo [WARNING] Please update the backend .env file with your actual configuration values.
    pause
    exit /b 1
)

REM Check for frontend .env file
if not exist "..\frontend\.env" (
    echo [WARNING] .env file not found in the frontend directory.
    echo [INFO] Creating frontend .env file from template...
    
    if exist "env_frontend.template" (
        echo # Frontend Environment Variables > ..\frontend\.env
        echo # Generated from CICD/env_frontend.template >> ..\frontend\.env
        echo # Update these values with your actual configuration >> ..\frontend\.env
        type env_frontend.template >> ..\frontend\.env
        echo [SUCCESS] Frontend .env file created successfully from template!
    ) else (
        echo [WARNING] env_frontend.template not found, creating default frontend configuration
        echo # Frontend Environment Variables > ..\frontend\.env
        echo # Default configuration - please update with your actual values >> ..\frontend\.env
        echo VITE_SUPABASE_URL="https://your-project.supabase.co" >> ..\frontend\.env
        echo VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here" >> ..\frontend\.env
        echo VITE_MAPBOX_TOKEN="your_mapbox_token_here" >> ..\frontend\.env
        echo VITE_API_URL="http://localhost:3001" >> ..\frontend\.env
        echo [SUCCESS] Frontend .env file created with default configuration!
    )
    echo [WARNING] Please update the frontend .env file with your actual configuration values.
    pause
    exit /b 1
)

:continue_deploy

echo [INFO] Pulling Docker images from Docker Hub...

echo [INFO] Pulling backend image: %DOCKER_REGISTRY%/%BACKEND_IMAGE%:%IMAGE_TAG%
docker pull %DOCKER_REGISTRY%/%BACKEND_IMAGE%:%IMAGE_TAG%
if errorlevel 1 (
    echo [ERROR] Failed to pull backend image
    pause
    exit /b 1
)
echo [SUCCESS] Backend image pulled successfully!

echo [INFO] Pulling frontend image: %DOCKER_REGISTRY%/%FRONTEND_IMAGE%:%IMAGE_TAG%
docker pull %DOCKER_REGISTRY%/%FRONTEND_IMAGE%:%IMAGE_TAG%
if errorlevel 1 (
    echo [ERROR] Failed to pull frontend image
    pause
    exit /b 1
)
echo [SUCCESS] Frontend image pulled successfully!

echo [INFO] Deploying containers...

echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1

echo [INFO] Starting containers with pulled images...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)

echo [SUCCESS] Containers deployed successfully!

echo [INFO] Waiting for services to be ready...

echo [INFO] Waiting for backend service...
set backend_ready=false
for /l %%i in (1,1,30) do (
    curl -f http://localhost:3001/api/health >nul 2>&1
    if not errorlevel 1 (
        set backend_ready=true
        echo [SUCCESS] Backend service is ready!
        goto :backend_ready
    )
    echo -n .
    timeout /t 2 /nobreak >nul
)
echo [WARNING] Backend service may not be fully ready

:backend_ready
echo [INFO] Waiting for frontend service...
set frontend_ready=false
for /l %%i in (1,1,30) do (
    curl -f http://localhost:80 >nul 2>&1
    if not errorlevel 1 (
        set frontend_ready=true
        echo [SUCCESS] Frontend service is ready!
        goto :frontend_ready
    )
    echo -n .
    timeout /t 2 /nobreak >nul
)
echo [WARNING] Frontend service may not be fully ready

:frontend_ready
echo [INFO] Deployment completed successfully!

echo.
echo [INFO] Container status:
docker-compose ps

echo.
echo [INFO] Application URLs:
echo   Frontend: http://localhost:80
echo   Backend API: http://localhost:3001
echo   Health Check: http://localhost:3001/api/health

echo.
echo [INFO] Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop containers: docker-compose down
echo   Run tests: test-deployed.bat

pause 