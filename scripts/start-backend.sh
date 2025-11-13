#!/bin/bash
# Start AgenticTableTop Backend API

echo "Starting AgenticTableTop Backend API..."
echo ""

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "[OK] Found virtual environment"
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "[OK] Found virtual environment"
    source .venv/bin/activate
else
    echo "[INFO] No virtual environment found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    echo "[OK] Virtual environment created"
fi

# Check if FastAPI is installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "[INFO] FastAPI not found. Installing dependencies..."
    pip install -r requirements.txt
    echo "[OK] Dependencies installed"
fi

# Check for API keys
if [ -z "$OPENAI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo ""
    echo "[WARNING] No API keys found!"
    echo "Please set at least one of the following environment variables:"
    echo "  - OPENAI_API_KEY"
    echo "  - GEMINI_API_KEY"
    echo ""
    echo "You can:"
    echo "  1. Create a .env file (copy from env.example)"
    echo "  2. Export them in your shell:"
    echo "     export OPENAI_API_KEY='your-key-here'"
    echo ""
    
    # Only prompt if running interactively (not in background)
    if [ -t 0 ]; then
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        # Running in background, don't prompt - just exit
        echo "[ERROR] Cannot start without API keys when running in background."
        exit 1
    fi
fi

echo ""
echo "Starting API server on http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo "Interactive API: http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Add src/ to PYTHONPATH so modules can be imported
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Start the API using uvicorn directly (more stable for background execution)
# Using module format allows for better process management
uvicorn api:app --host 0.0.0.0 --port 8000 --log-level info
