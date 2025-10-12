#!/bin/bash
# Set up development environment

set -e  # Exit on error

echo "================================"
echo "Setting Up Development Environment"
echo "================================"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."

echo "Installing development dependencies..."
pip install -r requirements-dev.txt

echo ""
echo "Installing project dependencies..."
pip install -r requirements.txt

echo ""
echo "Installing pre-commit hooks..."
pre-commit install

echo ""
echo "Running initial code formatting..."
bash scripts/format.sh

echo ""
echo "================================"
echo "Development Environment Ready!"
echo "================================"
echo ""
echo "Available commands:"
echo "  - bash scripts/test.sh      : Run tests"
echo "  - bash scripts/format.sh    : Format code"
echo "  - pre-commit run --all-files: Run pre-commit hooks"
echo ""

