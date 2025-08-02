#!/bin/bash

# Driven Devs Docker Build Script
# This script builds and runs the Docker containers for the Driven Devs application

set -e  # Exit on any error

echo "🚀 Starting Driven Devs Docker Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Function to check if .env file exists
check_env_file() {
    if [ ! -f "../.env" ]; then
        print_warning ".env file not found in the root directory."
        print_status "Creating a template .env file..."
        cat > ../.env << EOF
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/driven_devs"

# Supabase Configuration
SUPABASE_URL="your_supabase_project_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Application Configuration
FRONTEND_URL="http://localhost:80"
NODE_ENV="production"
PORT="3001"

# Frontend Environment Variables
VITE_SUPABASE_URL="your_supabase_project_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
VITE_API_URL="http://localhost:3001"
EOF
        print_warning "Please update the .env file with your actual configuration values before running the containers."
        exit 1
    fi
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -f Dockerfile.backend -t driven-devs-backend ..
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -f Dockerfile.frontend -t driven-devs-frontend ..
    
    print_success "Docker images built successfully!"
}

# Function to run containers
run_containers() {
    print_status "Starting containers with docker-compose..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Start containers
    docker-compose up -d
    
    print_success "Containers started successfully!"
}

# Function to show status
show_status() {
    print_status "Container status:"
    docker-compose ps
    
    echo ""
    print_status "Application URLs:"
    echo -e "  Frontend: ${GREEN}http://localhost:80${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:3001${NC}"
    
    echo ""
    print_status "Useful commands:"
    echo -e "  View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Stop containers: ${YELLOW}docker-compose down${NC}"
    echo -e "  Restart containers: ${YELLOW}docker-compose restart${NC}"
}

# Function to show logs
show_logs() {
    print_status "Showing container logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Function to stop containers
stop_containers() {
    print_status "Stopping containers..."
    docker-compose down
    print_success "Containers stopped successfully!"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose down -v 2>/dev/null || true
    
    # Remove images
    docker rmi driven-devs-backend driven-devs-frontend 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f 2>/dev/null || true
    
    print_success "Cleanup completed!"
}

# Main script logic
case "${1:-build}" in
    "build")
        check_env_file
        build_images
        run_containers
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_containers
        ;;
    "restart")
        stop_containers
        run_containers
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {build|logs|stop|restart|cleanup|status}"
        echo ""
        echo "Commands:"
        echo "  build    - Build and start containers (default)"
        echo "  logs     - Show container logs"
        echo "  stop     - Stop containers"
        echo "  restart  - Restart containers"
        echo "  cleanup  - Stop containers and remove images/volumes"
        echo "  status   - Show container status and URLs"
        exit 1
        ;;
esac 