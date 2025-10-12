#!/bin/bash
# Run tests with coverage

set -e  # Exit on error

echo "================================"
echo "Running Test Suite"
echo "================================"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."

# Run pytest with coverage
pytest -v --cov=utils --cov=main --cov-report=term-missing --cov-report=html

echo ""
echo "================================"
echo "Test Results"
echo "================================"
echo "Coverage report generated in htmlcov/index.html"
echo ""

