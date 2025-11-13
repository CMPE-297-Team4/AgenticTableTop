#!/bin/bash
# Run tests with coverage

set -e  # Exit on error

echo "================================"
echo "Running Test Suite"
echo "================================"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."

# Add src/ to PYTHONPATH so modules can be imported
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Check if pytest-cov is installed
if pip show pytest-cov >/dev/null 2>&1; then
    # Run pytest with coverage
    echo "Running tests with coverage..."
    pytest -v --cov=src --cov=api --cov-report=term-missing --cov-report=html
    
    echo ""
    echo "================================"
    echo "Test Results"
    echo "================================"
    echo "Coverage report generated in htmlcov/index.html"
    echo ""
else
    # Run pytest without coverage
    echo "Note: pytest-cov not installed. Running tests without coverage."
    echo "To enable coverage, run: pip install -r requirements-dev.txt"
    echo ""
    pytest -v
    
    echo ""
    echo "================================"
    echo "Test Results"
    echo "================================"
    echo "Install requirements-dev.txt for coverage reports."
    echo ""
fi

