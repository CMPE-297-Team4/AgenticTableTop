#!/bin/bash
# Run tests with coverage

set -e  # Exit on error

echo "================================"
echo "Running Test Suite"
echo "================================"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."

# Determine which Python to use
PYTHON_CMD="python3"
VENV_PYTHON=""

# Check for virtual environment and use its Python if available
if [ -f venv/bin/python3 ]; then
    VENV_PYTHON="venv/bin/python3"
    PYTHON_CMD="$VENV_PYTHON"
elif [ -f .venv/bin/python3 ]; then
    VENV_PYTHON=".venv/bin/python3"
    PYTHON_CMD="$VENV_PYTHON"
fi

# Activate virtual environment if it exists (for PATH)
if [ -f venv/bin/activate ]; then
    source venv/bin/activate
elif [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
fi

# Add src/ to PYTHONPATH so modules can be imported
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Find pytest command - try multiple methods
PYTEST_CMD=""

# Try venv python first if available
if [ -n "$VENV_PYTHON" ] && $VENV_PYTHON -m pytest --version >/dev/null 2>&1; then
    PYTEST_CMD="$VENV_PYTHON -m pytest"
# Try python3 -m pytest (system-wide)
elif python3 -m pytest --version >/dev/null 2>&1; then
    PYTEST_CMD="python3 -m pytest"
# Try python -m pytest
elif python -m pytest --version >/dev/null 2>&1; then
    PYTEST_CMD="python -m pytest"
# Try direct pytest command (if in PATH and functional)
elif command -v pytest >/dev/null 2>&1; then
    if pytest --version >/dev/null 2>&1; then
        PYTEST_CMD="pytest"
    fi
fi

# If still not found, provide helpful error
if [ -z "$PYTEST_CMD" ]; then
    echo "Error: pytest not found!"
    echo ""
    echo "Please install pytest:"
    if [ -n "$VENV_PYTHON" ]; then
        echo "  $VENV_PYTHON -m pip install pytest"
        echo "  or"
        echo "  source venv/bin/activate && pip install -r requirements-dev.txt"
    else
        echo "  pip install pytest"
        echo "  or"
        echo "  pip install -r requirements-dev.txt"
    fi
    exit 1
fi

# Check if pytest-cov is installed using the same Python
PYTHON_FOR_CHECK="$PYTHON_CMD"
if [ -z "$PYTHON_FOR_CHECK" ]; then
    PYTHON_FOR_CHECK="python3"
fi

if $PYTHON_FOR_CHECK -c "import pytest_cov" 2>/dev/null; then
    # Run pytest with coverage
    echo "Running tests with coverage..."
    $PYTEST_CMD -v --cov=src --cov=api --cov-report=term-missing --cov-report=html
    
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
    $PYTEST_CMD -v
    
    echo ""
    echo "================================"
    echo "Test Results"
    echo "================================"
    echo "Install requirements-dev.txt for coverage reports."
    echo ""
fi

