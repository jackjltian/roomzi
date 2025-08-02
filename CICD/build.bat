@echo off
setlocal enabledelayedexpansion

REM Driven Devs Docker Build Script for Windows
REM This script builds and runs the Docker containers for the Driven Devs application

echo 🚀 Starting Driven Devs Docker Build Process...

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

REM Function to check if .env file exists
if not exist "..\.env" (
    echo [WARNING] .env file not found in the root directory.
    echo [INFO] Creating a template .env file...
    
    (
        echo # Database Configuration
        echo DATABASE_URL="postgresql://username:password@localhost:5432/driven_devs"
        echo.
        echo # Supabase Configuration
        echo SUPABASE_URL="your_supabase_project_url"
        echo SUPABASE_ANON_KEY="your_supabase_anon_key"
        echo SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
        echo.
        echo # Application Configuration
        echo FRONTEND_URL="http://localhost:80"
        echo NODE_ENV="production"
        echo PORT="3001"
        echo.
        echo # Frontend Environment Variables
        echo VITE_SUPABASE_URL="your_supabase_project_url"
        echo VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
        echo VITE_API_URL="http://localhost:3001"
    ) > ..\.env
    
    echo [WARNING] Please update the .env file with your actual configuration values before running the containers.
    pause
    exit /b 1
)

REM Main script logic
if "%1"=="" (
    goto build
) else if "%1"=="build" (
    goto build
) else if "%1"=="logs" (
    goto logs
) else if "%1"=="stop" (
    goto stop
) else if "%1"=="restart" (
    goto restart
) else if "%1"=="cleanup" (
    goto cleanup
) else if "%1"=="status" (
    goto status
) else (
    goto help
)

:build
echo [INFO] Building Docker images...

echo [INFO] Building backend image...
docker build -f Dockerfile.backend -t driven-devs-backend ..

echo [INFO] Building frontend image...
docker build -f Dockerfile.frontend -t driven-devs-frontend ..

echo [SUCCESS] Docker images built successfully!

echo [INFO] Starting containers with docker-compose...
docker-compose down >nul 2>&1
docker-compose up -d

echo [SUCCESS] Containers started successfully!
goto status

:logs
echo [INFO] Showing container logs (Ctrl+C to exit)...
docker-compose logs -f
goto end

:stop
echo [INFO] Stopping containers...
docker-compose down
echo [SUCCESS] Containers stopped successfully!
goto end

:restart
echo [INFO] Stopping containers...
docker-compose down
echo [INFO] Starting containers...
docker-compose up -d
echo [SUCCESS] Containers restarted successfully!
goto status

:cleanup
echo [INFO] Cleaning up Docker resources...
docker-compose down -v >nul 2>&1
docker rmi driven-devs-backend driven-devs-frontend >nul 2>&1
docker volume prune -f >nul 2>&1
echo [SUCCESS] Cleanup completed!
goto end

:status
echo [INFO] Container status:
docker-compose ps

echo.
echo [INFO] Application URLs:
echo   Frontend: http://localhost:80
echo   Backend API: http://localhost:3001

echo.
echo [INFO] Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop containers: docker-compose down
echo   Restart containers: docker-compose restart
goto end

:help
echo Usage: %0 {build^|logs^|stop^|restart^|cleanup^|status}
echo.
echo Commands:
echo   build    - Build and start containers (default)
echo   logs     - Show container logs
echo   stop     - Stop containers
echo   restart  - Restart containers
echo   cleanup  - Stop containers and remove images/volumes
echo   status   - Show container status and URLs
goto end

:end
pause 