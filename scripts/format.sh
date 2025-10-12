#!/bin/bash
# Format and lint code

set -e  # Exit on error

echo "================================"
echo "Formatting and Linting Code"
echo "================================"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."

echo "Running black..."
black utils/ main.py tests/

echo ""
echo "Running isort..."
isort utils/ main.py tests/

echo ""
echo "Running flake8..."
flake8 utils/ main.py tests/ || true

echo ""
echo "================================"
echo "Formatting Complete"
echo "================================"

