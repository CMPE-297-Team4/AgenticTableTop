#!/bin/bash
# Format and lint code

set -e  # Exit on error

echo "================================"
echo "Formatting and Linting Code"
echo "================================"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

# Find black command (test if it actually works)
BLACK_CMD=""
if command -v black &> /dev/null && black --version &> /dev/null 2>&1; then
    BLACK_CMD="black"
elif python3 -m black --version &> /dev/null 2>&1; then
    BLACK_CMD="python3 -m black"
else
    echo "Error: black not found or broken. Install with: pip install black"
    echo "Or install dev dependencies: pip install -r requirements-dev.txt"
    exit 1
fi

# Find isort command (test if it actually works)
ISORT_CMD=""
if command -v isort &> /dev/null && isort --version &> /dev/null 2>&1; then
    ISORT_CMD="isort"
elif python3 -m isort --version &> /dev/null 2>&1; then
    ISORT_CMD="python3 -m isort"
else
    echo "Error: isort not found or broken. Install with: pip install isort"
    echo "Or install dev dependencies: pip install -r requirements-dev.txt"
    exit 1
fi

# Find flake8 command (test if it actually works)
FLAKE8_CMD=""
if command -v flake8 &> /dev/null && flake8 --version &> /dev/null 2>&1; then
    FLAKE8_CMD="flake8"
elif python3 -m flake8 --version &> /dev/null 2>&1; then
    FLAKE8_CMD="python3 -m flake8"
fi

echo "Running black..."
$BLACK_CMD src/ api.py tests/ --exclude="/(node_modules|venv|\.venv|__pycache__|\.git)/"

echo ""
echo "Running isort..."
$ISORT_CMD src/ api.py tests/ --skip-glob="**/node_modules/**" --skip-glob="**/venv/**" --skip-glob="**/.venv/**"

echo ""
echo "Running flake8..."
if [ -n "$FLAKE8_CMD" ]; then
    $FLAKE8_CMD src/ api.py tests/ --exclude=node_modules,venv,.venv,__pycache__ || true
else
    echo "Warning: flake8 not found. Skipping linting."
    echo "Install with: pip install flake8"
fi

echo ""
echo "================================"
echo "Formatting Complete"
echo "================================"

