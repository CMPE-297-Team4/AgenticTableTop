.PHONY: help test format setup run clean coverage install install-dev install-all lint check api frontend start-all

# Default target - show help
help:
	@echo "================================"
	@echo "AgenticTableTop - Makefile Commands"
	@echo "================================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make install        - Install core dependencies"
	@echo "  make install-dev    - Install development dependencies"
	@echo "  make install-all    - Install all dependencies (including optional)"
	@echo "  make setup          - Full development environment setup"
	@echo ""
	@echo "Development Commands:"
	@echo "  make test           - Run all tests"
	@echo "  make coverage       - Run tests with coverage report"
	@echo "  make format         - Format and lint code (black, isort, flake8)"
	@echo "  make lint           - Run linter only (flake8)"
	@echo "  make check          - Run format check without modifying files"
	@echo ""
	@echo "Runtime Commands:"
	@echo "  make run            - Run the campaign generator (CLI)"
	@echo "  make api            - Start the backend API server"
	@echo "  make frontend       - Start the frontend UI"
	@echo "  make start-all      - Start both backend and frontend"
	@echo ""
	@echo "Cleanup Commands:"
	@echo "  make clean          - Remove generated files and caches"
	@echo "  make clean-all      - Deep clean (includes venv, if managed)"
	@echo ""

# Installation targets
install:
	@echo "Installing core dependencies..."
	pip install -r requirements.txt

install-dev:
	@echo "Installing development dependencies..."
	pip install -r requirements-dev.txt

install-all: install install-dev
	@echo "Installing optional dependencies..."
	pip install -r requirements-optional.txt

# Setup development environment
setup:
	@bash scripts/setup_dev.sh

# Run tests
test:
	@bash scripts/test.sh

# Run tests with coverage (requires pytest-cov)
coverage:
	@echo "Running tests with coverage..."
	@pytest -v --cov=utils --cov=main --cov-report=term-missing --cov-report=html
	@echo ""
	@echo "HTML coverage report generated: htmlcov/index.html"

# Format and lint code
format:
	@bash scripts/format.sh

# Lint only (no formatting)
lint:
	@echo "Running flake8..."
	@flake8 utils/ main.py tests/

# Check formatting without modifying files
check:
	@echo "Checking code formatting..."
	@black --check utils/ main.py tests/
	@echo "Checking import ordering..."
	@isort --check-only utils/ main.py tests/
	@echo "Running flake8..."
	@flake8 utils/ main.py tests/

# Run the main application (CLI)
run:
	@echo "Running D&D Campaign Generator..."
	@python main.py

# Run the backend API
api:
	@bash scripts/start-backend.sh

# Run the frontend UI
frontend:
	@bash scripts/start-frontend.sh

# Start both backend and frontend
start-all:
	@bash scripts/start-all.sh

# Clean up generated files
clean:
	@echo "Cleaning up generated files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf .pytest_cache 2>/dev/null || true
	@rm -rf htmlcov 2>/dev/null || true
	@rm -rf .coverage 2>/dev/null || true
	@rm -rf dist build 2>/dev/null || true
	@echo "Cleanup complete!"

# Deep clean (includes removing venv if present)
clean-all: clean
	@echo "Performing deep clean..."
	@rm -rf venv 2>/dev/null || true
	@rm -rf .venv 2>/dev/null || true
	@rm -rf env 2>/dev/null || true
	@echo "Deep clean complete!"

