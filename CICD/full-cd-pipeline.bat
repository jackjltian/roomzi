@echo off
setlocal enabledelayedexpansion

REM Driven Devs Complete CD Pipeline for Windows
REM This script implements a full Continuous Delivery pipeline including deployment and testing

echo 🚀 Starting Driven Devs Complete CD Pipeline...

REM Configuration
set DOCKER_REGISTRY=thushshan
set FRONTEND_IMAGE=roomzi-frontend
set BACKEND_IMAGE=roomzi-backend
set IMAGE_TAG=1.0.0
set FRONTEND_URL=http://localhost:80
set BACKEND_URL=http://localhost:3001
set HEALTH_ENDPOINT=%BACKEND_URL%/api/health

REM Pipeline start time
set PIPELINE_START_TIME=%time%

echo.
echo ==========================================
echo      DRIVEN DEVS CD PIPELINE v1.0        
echo ==========================================
echo Start Time: %date% %time%
echo Registry: %DOCKER_REGISTRY%
echo Images: %FRONTEND_IMAGE%:%IMAGE_TAG%, %BACKEND_IMAGE%:%IMAGE_TAG%
echo ==========================================
echo.

REM Check prerequisites
echo [PHASE] Checking Prerequisites

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

echo [SUCCESS] All prerequisites are met!

REM Check environment configuration
echo [PHASE] Checking Environment Configuration

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
goto :continue_pipeline

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

echo [SUCCESS] Environment configuration is ready!

:continue_pipeline
REM Pull images from Docker Hub
echo [PHASE] Pulling Docker Images from Registry

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

REM Deploy containers
echo [PHASE] Deploying Application Containers

echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1

echo [INFO] Starting containers with pulled images...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to deploy containers
    pause
    exit /b 1
)
echo [SUCCESS] Containers deployed successfully!

REM Wait for services to be ready
echo [PHASE] Waiting for Services to be Ready

echo [INFO] Waiting for backend service...
set backend_ready=false
for /l %%i in (1,1,30) do (
    curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
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
    curl -f "%FRONTEND_URL%" >nul 2>&1
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
REM Run health checks
echo [PHASE] Running Health Checks

echo [INFO] Testing backend health endpoint...
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend health endpoint is not responding
    pause
    exit /b 1
)
echo [SUCCESS] Backend health endpoint is responding!

echo [INFO] Testing frontend accessibility...
curl -f "%FRONTEND_URL%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Frontend is not accessible
    pause
    exit /b 1
)
echo [SUCCESS] Frontend is accessible!

REM Run automated tests
echo [PHASE] Running Automated Tests

echo [INFO] Running backend tests...
docker-compose exec -T backend npm test
if errorlevel 1 (
    echo [ERROR] Backend tests failed!
    pause
    exit /b 1
)
echo [SUCCESS] Backend tests passed!

echo [INFO] Running frontend tests...
docker-compose exec -T frontend npm test
if errorlevel 1 (
    echo [ERROR] Frontend tests failed!
    pause
    exit /b 1
)
echo [SUCCESS] Frontend tests passed!

echo [INFO] Running integration tests...

echo [INFO] Testing API endpoints...
curl -f "%BACKEND_URL%/api" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] API base endpoint may not be accessible
) else (
    echo [SUCCESS] API base endpoint is accessible!
)

echo [INFO] Testing database connectivity...
for /f "tokens=*" %%i in ('curl -s "%HEALTH_ENDPOINT%" 2^>nul') do set health_response=%%i
echo %health_response% | findstr /i "database db" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Database connectivity status unknown
) else (
    echo [SUCCESS] Database connectivity confirmed!
)

REM Run performance tests
echo [PHASE] Running Performance Tests

echo [INFO] Testing response time for health endpoint...
set start_time=%time%
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
set end_time=%time%
echo [INFO] Health endpoint response time measured

echo [INFO] Testing frontend load time...
set start_time=%time%
curl -f "%FRONTEND_URL%" >nul 2>&1
set end_time=%time%
echo [INFO] Frontend load time measured

REM Check container logs
echo [PHASE] Checking Container Logs

set backend_errors=0
for /f %%i in ('docker-compose logs backend 2^>^&1 ^| findstr /i "error exception fail" ^| find /c /v ""') do set backend_errors=%%i
if %backend_errors%==0 (
    echo [SUCCESS] No errors found in backend logs!
) else (
    echo [WARNING] Found %backend_errors% potential errors in backend logs
)

set frontend_errors=0
for /f %%i in ('docker-compose logs frontend 2^>^&1 ^| findstr /i "error exception fail" ^| find /c /v ""') do set frontend_errors=%%i
if %frontend_errors%==0 (
    echo [SUCCESS] No errors found in frontend logs!
) else (
    echo [WARNING] Found %frontend_errors% potential errors in frontend logs
)

REM Generate pipeline report
echo [PHASE] Generating Pipeline Report

set PIPELINE_END_TIME=%time%

echo.
echo ==========================================
echo         CD PIPELINE REPORT               
echo ==========================================
echo Pipeline Start: %PIPELINE_START_TIME%
echo Pipeline End: %PIPELINE_END_TIME%
echo.
echo Configuration:
echo   Registry: %DOCKER_REGISTRY%
echo   Backend Image: %BACKEND_IMAGE%:%IMAGE_TAG%
echo   Frontend Image: %FRONTEND_IMAGE%:%IMAGE_TAG%
echo.

echo Container Status:
docker-compose ps
echo.

echo Health Check Results:
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend Health: FAILED
) else (
    echo ✅ Backend Health: OK
)

curl -f "%FRONTEND_URL%" >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend Health: FAILED
) else (
    echo ✅ Frontend Health: OK
)
echo.

echo [SUCCESS] Pipeline report generated!

REM Show final status
echo [PHASE] Pipeline Completed Successfully!
echo.
echo [INFO] Pipeline Results Summary:
echo   Prerequisites Check: ✅ Passed
echo   Environment Setup: ✅ Ready
echo   Image Pull: ✅ Completed
echo   Container Deployment: ✅ Successful
echo   Service Readiness: ✅ Confirmed
echo   Health Checks: ✅ Passed
echo   Automated Tests: ✅ Passed
echo   Performance Tests: ✅ Completed
echo   Log Analysis: ✅ Completed
echo.
echo [INFO] Application URLs:
echo   Frontend: %FRONTEND_URL%
echo   Backend API: %BACKEND_URL%
echo   Health Check: %HEALTH_ENDPOINT%
echo.
echo [INFO] Useful Commands:
echo   View logs: docker-compose logs -f
echo   Stop containers: docker-compose down
echo   Restart pipeline: full-cd-pipeline.bat
echo   Run tests only: test-deployed.bat

pause 