#!/bin/bash

# Driven Devs CD Pipeline - Testing Script
# This script runs automated tests against the deployed application

set -e  # Exit on any error

echo "🧪 Starting Driven Devs CD Pipeline - Testing Phase..."

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
FRONTEND_URL="http://localhost:80"
BACKEND_URL="http://localhost:3001"
HEALTH_ENDPOINT="${BACKEND_URL}/api/health"

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

# Function to check if containers are running
check_containers_running() {
    print_status "Checking if containers are running..."
    
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Containers are not running. Please deploy the application first."
        exit 1
    fi
    
    print_success "Containers are running!"
}

# Function to test health endpoints
test_health_endpoints() {
    print_status "Testing health endpoints..."
    
    # Test backend health endpoint
    print_status "Testing backend health endpoint..."
    if curl -f "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
        print_success "Backend health endpoint is responding!"
    else
        print_error "Backend health endpoint is not responding"
        return 1
    fi
    
    # Test frontend accessibility
    print_status "Testing frontend accessibility..."
    if curl -f "${FRONTEND_URL}" > /dev/null 2>&1; then
        print_success "Frontend is accessible!"
    else
        print_error "Frontend is not accessible"
        return 1
    fi
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend tests..."
    
    # Run tests inside the backend container
    if docker-compose exec -T backend npm test; then
        print_success "Backend tests passed!"
    else
        print_error "Backend tests failed!"
        return 1
    fi
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend tests..."
    
    # Run tests inside the frontend container
    if docker-compose exec -T frontend npm test; then
        print_success "Frontend tests passed!"
    else
        print_error "Frontend tests failed!"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Test API endpoints
    print_status "Testing API endpoints..."
    
    # Test basic API connectivity
    if curl -f "${BACKEND_URL}/api" > /dev/null 2>&1; then
        print_success "API base endpoint is accessible!"
    else
        print_warning "API base endpoint may not be accessible"
    fi
    
    # Test database connectivity (if health endpoint includes DB status)
    health_response=$(curl -s "${HEALTH_ENDPOINT}" 2>/dev/null || echo "{}")
    if echo "$health_response" | grep -q "database\|db"; then
        print_success "Database connectivity confirmed!"
    else
        print_warning "Database connectivity status unknown"
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running basic performance tests..."
    
    # Test response time for health endpoint
    print_status "Testing response time for health endpoint..."
    start_time=$(date +%s%N)
    curl -f "${HEALTH_ENDPOINT}" > /dev/null 2>&1
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        print_success "Health endpoint response time: ${response_time}ms (Good)"
    elif [ $response_time -lt 3000 ]; then
        print_warning "Health endpoint response time: ${response_time}ms (Acceptable)"
    else
        print_error "Health endpoint response time: ${response_time}ms (Slow)"
    fi
    
    # Test frontend load time
    print_status "Testing frontend load time..."
    start_time=$(date +%s%N)
    curl -f "${FRONTEND_URL}" > /dev/null 2>&1
    end_time=$(date +%s%N)
    load_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $load_time -lt 2000 ]; then
        print_success "Frontend load time: ${load_time}ms (Good)"
    elif [ $load_time -lt 5000 ]; then
        print_warning "Frontend load time: ${load_time}ms (Acceptable)"
    else
        print_error "Frontend load time: ${load_time}ms (Slow)"
    fi
}

# Function to check container logs for errors
check_container_logs() {
    print_status "Checking container logs for errors..."
    
    # Check backend logs
    backend_errors=$(docker-compose logs backend 2>&1 | grep -i "error\|exception\|fail" | wc -l)
    if [ $backend_errors -eq 0 ]; then
        print_success "No errors found in backend logs!"
    else
        print_warning "Found $backend_errors potential errors in backend logs"
    fi
    
    # Check frontend logs
    frontend_errors=$(docker-compose logs frontend 2>&1 | grep -i "error\|exception\|fail" | wc -l)
    if [ $frontend_errors -eq 0 ]; then
        print_success "No errors found in frontend logs!"
    else
        print_warning "Found $frontend_errors potential errors in frontend logs"
    fi
}

# Function to generate test report
generate_test_report() {
    print_status "Generating test report..."
    
    echo ""
    echo "=========================================="
    echo "           TEST REPORT SUMMARY            "
    echo "=========================================="
    echo "Timestamp: $(date)"
    echo "Frontend URL: ${FRONTEND_URL}"
    echo "Backend URL: ${BACKEND_URL}"
    echo ""
    
    # Container status
    echo "Container Status:"
    docker-compose ps
    echo ""
    
    # Health check results
    echo "Health Check Results:"
    if curl -f "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
        echo "✅ Backend Health: OK"
    else
        echo "❌ Backend Health: FAILED"
    fi
    
    if curl -f "${FRONTEND_URL}" > /dev/null 2>&1; then
        echo "✅ Frontend Health: OK"
    else
        echo "❌ Frontend Health: FAILED"
    fi
    echo ""
    
    print_success "Test report generated!"
}

# Function to show test results
show_test_results() {
    print_status "Testing completed!"
    
    echo ""
    print_status "Test Results Summary:"
    echo -e "  Health Endpoints: ${GREEN}✅ Tested${NC}"
    echo -e "  Backend Tests: ${GREEN}✅ Executed${NC}"
    echo -e "  Frontend Tests: ${GREEN}✅ Executed${NC}"
    echo -e "  Integration Tests: ${GREEN}✅ Executed${NC}"
    echo -e "  Performance Tests: ${GREEN}✅ Executed${NC}"
    echo -e "  Log Analysis: ${GREEN}✅ Completed${NC}"
    
    echo ""
    print_status "Application URLs:"
    echo -e "  Frontend: ${GREEN}${FRONTEND_URL}${NC}"
    echo -e "  Backend API: ${GREEN}${BACKEND_URL}${NC}"
    echo -e "  Health Check: ${GREEN}${HEALTH_ENDPOINT}${NC}"
}

# Main testing process
main() {
    check_containers_running
    test_health_endpoints
    run_backend_tests
    run_frontend_tests
    run_integration_tests
    run_performance_tests
    check_container_logs
    generate_test_report
    show_test_results
}

# Run main function
main 