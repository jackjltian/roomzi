#!/bin/bash

# Driven Devs CD Pipeline - Deployment Script
# This script pulls Docker images from Docker Hub and deploys the application

set -e  # Exit on any error

echo "🚀 Starting Driven Devs CD Pipeline - Deployment Phase..."

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

# Configuration
DOCKER_REGISTRY="thushshan"
FRONTEND_IMAGE="roomzi-frontend"
BACKEND_IMAGE="roomzi-backend"
IMAGE_TAG="1.0.0"

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

# Function to check if .env files exist
check_env_files() {
    # Always try to create .env files from GitHub Secrets first (if available)
    print_status "Attempting to create .env files from GitHub Secrets..."
    
    # Check if we have access to GitHub Secrets (either in GitHub Actions or locally with secrets)
    if [ "$GITHUB_ACTIONS" = "true" ] || [ -n "$SUPABASE_URL" ] || [ -n "$SUPABASE_ANON_KEY" ]; then
        print_status "GitHub Secrets detected - creating .env files from secrets"
        
        # Create backend .env from secrets
        if [ ! -f "../backend/.env" ]; then
            print_status "Creating backend .env from GitHub Secrets..."
            {
                echo "# Backend Environment Variables"
                echo "# Generated from GitHub Secrets"
                echo "# Update these values with your actual configuration"
                echo ""
                echo "# Server Configuration"
                echo "PORT=3001"
                echo "NODE_ENV=production"
                echo ""
                echo "# Frontend URL (for CORS)"
                echo "FRONTEND_URL=http://localhost:80"
                echo ""
                echo "# Supabase Configuration"
                echo "SUPABASE_URL=${SUPABASE_URL:-https://your-project.supabase.co}"
                echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your_supabase_anon_key_here}"
                echo "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-your_supabase_service_role_key_here}"
                echo ""
                echo "# JWT Configuration"
                echo "JWT_SECRET=${JWT_SECRET:-}"
                echo "JWT_EXPIRES_IN=7d"
                echo ""
                echo "# Session Configuration"
                echo "SESSION_SECRET=${SESSION_SECRET:-}"
                echo ""
                echo "# Connect to Supabase via connection pooling"
                echo "DATABASE_URL=${DATABASE_URL:-}"
                echo ""
                echo "# Direct connection to the database. Used for migrations"
                echo "DIRECT_URL=${DIRECT_URL:-}"
            } > ../backend/.env
            print_success "Backend .env file created from GitHub Secrets!"
        fi
        
        # Create frontend .env from secrets
        if [ ! -f "../frontend/.env" ]; then
            print_status "Creating frontend .env from GitHub Secrets..."
            {
                echo "# Frontend Environment Variables"
                echo "# Generated from GitHub Secrets"
                echo "# Update these values with your actual configuration"
                echo ""
                echo "VITE_SUPABASE_URL=${SUPABASE_URL:-https://your-project.supabase.co}"
                echo "VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your_supabase_anon_key_here}"
                echo ""
                echo "# Mapbox Configuration"
                echo "VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN:-your_mapbox_token_here}"
            } > ../frontend/.env
            print_success "Frontend .env file created from GitHub Secrets!"
        fi
        
        print_success "Environment files created from GitHub Secrets!"
        return
    fi
    
    # Fallback to templates if no secrets available
    print_status "No GitHub Secrets detected - falling back to templates"
    
    # Check for backend .env file
    if [ ! -f "../backend/.env" ]; then
        print_warning ".env file not found in the backend directory."
        print_status "Creating backend .env file from template..."
        
        if [ -f "env_backend.template" ]; then
            {
                echo "# Backend Environment Variables"
                echo "# Generated from CICD/env_backend.template"
                echo "# Update these values with your actual configuration"
                cat env_backend.template
            } > ../backend/.env
            print_success "Backend .env file created successfully from template!"
        else
            print_warning "env_backend.template not found, creating default backend configuration"
            {
                echo "# Backend Environment Variables"
                echo "# Default configuration - please update with your actual values"
                echo "PORT=3001"
                echo 'NODE_ENV="production"'
                echo 'FRONTEND_URL="http://localhost:80"'
                echo 'SUPABASE_URL="https://your-project.supabase.co"'
                echo 'SUPABASE_ANON_KEY="your_supabase_anon_key_here"'
                echo 'SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"'
                echo 'JWT_SECRET=""'
                echo 'JWT_EXPIRES_IN=""'
                echo 'SESSION_SECRET=""'
                echo 'DATABASE_URL=""'
                echo 'DIRECT_URL=""'
            } > ../backend/.env
            print_success "Backend .env file created with default configuration!"
        fi
        print_warning "Please update the backend .env file with your actual configuration values."
        exit 1
    fi
    
    # Check for frontend .env file
    if [ ! -f "../frontend/.env" ]; then
        print_warning ".env file not found in the frontend directory."
        print_status "Creating frontend .env file from template..."
        
        if [ -f "env_frontend.template" ]; then
            {
                echo "# Frontend Environment Variables"
                echo "# Generated from CICD/env_frontend.template"
                echo "# Update these values with your actual configuration"
                cat env_frontend.template
            } > ../frontend/.env
            print_success "Frontend .env file created successfully from template!"
        else
            print_warning "env_frontend.template not found, creating default frontend configuration"
            {
                echo "# Frontend Environment Variables"
                echo "# Default configuration - please update with your actual values"
                echo 'VITE_SUPABASE_URL="https://your-project.supabase.co"'
                echo 'VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"'
                echo 'VITE_MAPBOX_TOKEN="your_mapbox_token_here"'
                echo 'VITE_API_URL="http://localhost:3001"'
            } > ../frontend/.env
            print_success "Frontend .env file created with default configuration!"
        fi
        print_warning "Please update the frontend .env file with your actual configuration values."
        exit 1
    fi
}
            
            echo "# Additional Configuration:"
            echo "# Make sure to update all placeholder values with your actual configuration"
            
        } > ../.env
        
        print_success ".env file created successfully from templates!"
        print_warning "Please update the .env file with your actual configuration values before running the containers."
        exit 1
    fi
}

# Function to pull images from Docker Hub
pull_images() {
    print_status "Pulling Docker images from Docker Hub..."
    
    # Pull backend image
    print_status "Pulling backend image: ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"
    if docker pull "${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"; then
        print_success "Backend image pulled successfully!"
    else
        print_error "Failed to pull backend image"
        exit 1
    fi
    
    # Pull frontend image
    print_status "Pulling frontend image: ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
    if docker pull "${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"; then
        print_success "Frontend image pulled successfully!"
    else
        print_error "Failed to pull frontend image"
        exit 1
    fi
}

# Function to deploy containers
deploy_containers() {
    print_status "Deploying containers..."
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Start containers using pulled images
    print_status "Starting containers with pulled images..."
    docker-compose up -d
    
    print_success "Containers deployed successfully!"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for backend
    print_status "Waiting for backend service..."
    local backend_ready=false
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            backend_ready=true
            print_success "Backend service is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ "$backend_ready" = false ]; then
        print_warning "Backend service may not be fully ready"
    fi
    
    # Wait for frontend
    print_status "Waiting for frontend service..."
    local frontend_ready=false
    for i in {1..30}; do
        if curl -f http://localhost:80 > /dev/null 2>&1; then
            frontend_ready=true
            print_success "Frontend service is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ "$frontend_ready" = false ]; then
        print_warning "Frontend service may not be fully ready"
    fi
}

# Function to show deployment status
show_deployment_status() {
    print_status "Deployment completed successfully!"
    
    echo ""
    print_status "Container status:"
    docker-compose ps
    
    echo ""
    print_status "Application URLs:"
    echo -e "  Frontend: ${GREEN}http://localhost:80${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:3001${NC}"
    echo -e "  Health Check: ${GREEN}http://localhost:3001/api/health${NC}"
    
    echo ""
    print_status "Useful commands:"
    echo -e "  View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Stop containers: ${YELLOW}docker-compose down${NC}"
    echo -e "  Run tests: ${YELLOW}./test-deployed.sh${NC}"
}

# Main deployment process
main() {
    check_env_files
    pull_images
    deploy_containers
    wait_for_services
    show_deployment_status
}

# Run main function
main 