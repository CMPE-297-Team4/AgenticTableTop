.PHONY: help test format setup run clean clean-pinecone clean-all coverage install install-dev install-all lint check api frontend start-all fix-characters

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
	@echo "  make api            - Start the backend API server"
	@echo "  make frontend       - Start the frontend UI"
	@echo "  make start-all      - Start both backend and frontend"
	@echo ""
	@echo "Cleanup Commands:"
	@echo "  make clean          - Remove ALL local storage (database, cache, images, logs)"
	@echo "  make clean-pinecone - Remove Pinecone vector storage (cloud)"
	@echo "  make clean-all      - Deep clean (local storage + venv + node_modules)"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make fix-characters - Fix stats for existing characters (regenerate based on race/class)"
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
	@PYTHONPATH=$$(pwd)/src:$$PYTHONPATH pytest -v --cov=src --cov=api --cov-report=term-missing --cov-report=html
	@echo ""
	@echo "HTML coverage report generated: htmlcov/index.html"

# Format and lint code
format:
	@bash scripts/format.sh

# Lint only (no formatting)
lint:
	@bash scripts/format.sh --lint-only || true

# Check formatting without modifying files
check:
	@echo "Checking code formatting..."
	@if [ -f venv/bin/activate ]; then source venv/bin/activate; fi; \
	black --check src/ api.py tests/ --exclude="/(node_modules|venv|\.venv|__pycache__|\.git)/" || \
	python3 -m black --check src/ api.py tests/ --exclude="/(node_modules|venv|\.venv|__pycache__|\.git)/"
	@echo "Checking import ordering..."
	@if [ -f venv/bin/activate ]; then source venv/bin/activate; fi; \
	isort --check-only src/ api.py tests/ --skip-glob="**/node_modules/**" --skip-glob="**/venv/**" || \
	python3 -m isort --check-only src/ api.py tests/ --skip-glob="**/node_modules/**" --skip-glob="**/venv/**"
	@echo "Running flake8..."
	@if [ -f venv/bin/activate ]; then source venv/bin/activate; fi; \
	flake8 src/ api.py tests/ || python3 -m flake8 src/ api.py tests/ || true

# Run the backend API
api:
	@bash scripts/start-backend.sh

# Run the frontend UI
frontend:
	@bash scripts/start-frontend.sh

# Start both backend and frontend
start-all:
	@bash scripts/start-all.sh

# Clean up generated files and database
clean:
	@echo "==================================="
	@echo "Cleaning AgenticTableTop Storage"
	@echo "==================================="
	@echo ""
	@echo "[1/7] Cleaning Python artifacts..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf .pytest_cache 2>/dev/null || true
	@rm -rf htmlcov 2>/dev/null || true
	@rm -rf .coverage 2>/dev/null || true
	@rm -rf dist build 2>/dev/null || true
	@echo "    ✓ Python artifacts cleaned"
	@echo ""
	@echo "[2/7] Cleaning database files..."
	@rm -f agentictabletop.db 2>/dev/null || true
	@rm -f src/agentictabletop.db 2>/dev/null || true
	@rm -f *.db 2>/dev/null || true
	@rm -f src/*.db 2>/dev/null || true
	@rm -f *.db-journal 2>/dev/null || true
	@rm -f src/*.db-journal 2>/dev/null || true
	@echo "    ✓ Database files cleaned"
	@echo ""
	@echo "[3/7] Cleaning LLM cache..."
	@rm -rf cache/llm_responses/*.json 2>/dev/null || true
	@rm -rf cache/llm_responses/ 2>/dev/null || true
	@rm -rf src/cache/llm_responses/*.json 2>/dev/null || true
	@rm -rf src/cache/ 2>/dev/null || true
	@echo "    ✓ LLM cache cleaned"
	@echo ""
	@echo "[4/7] Cleaning character images and portraits..."
	@rm -rf characters/*.png 2>/dev/null || true
	@rm -rf characters/ 2>/dev/null || true
	@echo "    ✓ Character images cleaned"
	@echo ""
	@echo "[5/7] Cleaning trajectory logs..."
	@rm -rf src/trajectory/*.log 2>/dev/null || true
	@echo "    ✓ Trajectory logs cleaned"
	@echo ""
	@echo "[6/7] Cleaning log files..."
	@rm -f backend.log 2>/dev/null || true
	@rm -f frontend.log 2>/dev/null || true
	@rm -f *.log 2>/dev/null || true
	@echo "    ✓ Log files cleaned"
	@echo ""
	@echo "[7/7] Cleaning frontend build artifacts..."
	@rm -rf src/ui/dist/ 2>/dev/null || true
	@rm -rf src/ui/node_modules/.vite/ 2>/dev/null || true
	@echo "    ✓ Frontend artifacts cleaned"
	@echo ""
	@echo "==================================="
	@echo "⚠️  NOTE: Pinecone vector storage is cloud-based and NOT cleaned by this command."
	@echo "   To clear Pinecone data, manually delete indexes via Pinecone dashboard:"
	@echo "   https://app.pinecone.io"
	@echo "==================================="
	@echo ""
	@echo "✅ Cleanup complete!"

# Clean Pinecone vector storage (cloud-based)
clean-pinecone:
	@bash scripts/clean_pinecone.sh

# Fix character stats (regenerate based on race and class)
fix-characters:
	@echo "====================================="
	@echo "Fixing Character Stats"
	@echo "====================================="
	@echo ""
	@echo "This will regenerate stats for all existing characters"
	@echo "based on their race and class using D&D 5e rules."
	@echo ""
	@python scripts/fix_character_stats.py
	@echo ""
	@echo "✅ Done! Refresh your browser to see updated stats."
	@echo ""

# Deep clean (includes removing venv if present)
clean-all: clean
	@echo "Performing deep clean..."
	@rm -rf venv 2>/dev/null || true
	@rm -rf .venv 2>/dev/null || true
	@rm -rf env 2>/dev/null || true
	@rm -rf node_modules 2>/dev/null || true
	@rm -rf src/ui/node_modules 2>/dev/null || true
	@echo "Deep clean complete!"

