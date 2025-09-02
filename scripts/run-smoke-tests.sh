#!/bin/bash

# RehabFlow Smoke Test Runner
# This script provides easy access to run different types of smoke tests

set -e

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

# Function to show usage
show_usage() {
    echo "RehabFlow Smoke Test Runner"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  local     Run tests against local development server"
    echo "  prod      Run tests against production (read-only)"
    echo "  api       Run only API tests (fastest)"
    echo "  mobile    Test mobile responsiveness"
    echo "  all       Run all test types"
    echo "  report    Show test results report"
    echo "  install   Install Playwright browsers"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 local          # Test local development"
    echo "  $0 prod           # Test production"
    echo "  $0 api            # Quick API tests"
    echo "  $0 local prod     # Test both local and production"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! npx playwright --version &> /dev/null; then
        print_warning "Playwright not found. Installing..."
        npm install
        npx playwright install
    fi
    
    print_success "Prerequisites check passed"
}

# Function to run local tests
run_local_tests() {
    print_status "Running local smoke tests..."
    
    # Check if local server is running
    if ! curl -s http://localhost:3000 > /dev/null; then
        print_warning "Local server not running. Starting development server..."
        START_LOCAL_SERVER=true npm run test:smoke:local &
        TEST_PID=$!
        
        # Wait for server to start
        print_status "Waiting for local server to start..."
        for i in {1..30}; do
            if curl -s http://localhost:3000 > /dev/null; then
                print_success "Local server started"
                break
            fi
            sleep 2
        done
        
        # Run tests
        npm run test:smoke:local
        
        # Clean up
        kill $TEST_PID 2>/dev/null || true
    else
        npm run test:smoke:local
    fi
}

# Function to run production tests
run_prod_tests() {
    print_status "Running production smoke tests..."
    npm run test:smoke:prod
}

# Function to run API tests
run_api_tests() {
    print_status "Running API-only smoke tests..."
    npm run test:smoke:api
}

# Function to run mobile tests
run_mobile_tests() {
    print_status "Running mobile smoke tests..."
    npm run test:smoke:mobile
}

# Function to run all tests
run_all_tests() {
    print_status "Running all smoke test types..."
    
    run_local_tests
    run_prod_tests
    run_api_tests
    run_mobile_tests
    
    print_success "All smoke tests completed"
}

# Function to show report
show_report() {
    print_status "Opening test results report..."
    npm run test:smoke:report
}

# Function to install Playwright
install_playwright() {
    print_status "Installing Playwright browsers..."
    npx playwright install
    print_success "Playwright browsers installed"
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    # Check prerequisites first
    check_prerequisites
    
    # Process arguments
    for arg in "$@"; do
        case $arg in
            local)
                run_local_tests
                ;;
            prod)
                run_prod_tests
                ;;
            api)
                run_api_tests
                ;;
            mobile)
                run_mobile_tests
                ;;
            all)
                run_all_tests
                ;;
            report)
                show_report
                ;;
            install)
                install_playwright
                ;;
            help|--help|-h)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $arg"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Run main function with all arguments
main "$@"
