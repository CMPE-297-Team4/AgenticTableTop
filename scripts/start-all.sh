#!/bin/bash
# Start both Backend and Frontend in separate terminals/processes

echo "Starting AgenticTableTop - Full Stack"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    # Kill processes by port (more reliable)
    lsof -ti:8000 | xargs kill 2>/dev/null || true
    lsof -ti:5173 | xargs kill 2>/dev/null || true
    lsof -ti:8080 | xargs kill 2>/dev/null || true
    # Also kill the script PIDs
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Check for API keys before starting
if [ -z "$OPENAI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo "[ERROR] No API keys found!"
    echo ""
    echo "Please set at least one of the following environment variables:"
    echo "  - OPENAI_API_KEY"
    echo "  - GEMINI_API_KEY"
    echo ""
    echo "Quick setup:"
    echo "  1. Copy env.example to .env: cp env.example .env"
    echo "  2. Edit .env and add your API key"
    echo "  3. Run: source .env  (or restart terminal)"
    echo "  4. Try again: make start-all"
    echo ""
    exit 1
fi

# Start backend in background
echo "Starting backend..."
bash "$SCRIPT_DIR/start-backend.sh" > "$PROJECT_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 8

# Check if backend is running by checking the port
if lsof -ti:8000 > /dev/null 2>&1; then
    ACTUAL_PID=$(lsof -ti:8000)
    echo "[OK] Backend started (PID: $ACTUAL_PID)"
    echo "     Logs: tail -f $PROJECT_ROOT/backend.log"
else
    echo "[ERROR] Backend failed to start. Check $PROJECT_ROOT/backend.log"
    echo "     Last 20 lines of log:"
    tail -20 "$PROJECT_ROOT/backend.log" | sed 's/^/     /'
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend in background
echo ""
echo "Starting frontend..."
bash "$SCRIPT_DIR/start-frontend.sh" > "$PROJECT_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "Waiting for frontend to initialize..."
sleep 10

# Check if frontend is running (Vite uses 5173 by default, but may use 8080 if 5173 is busy)
if lsof -ti:5173 > /dev/null 2>&1; then
    ACTUAL_FRONTEND_PID=$(lsof -ti:5173)
    FRONTEND_PORT=5173
    echo "[OK] Frontend started (PID: $ACTUAL_FRONTEND_PID)"
    echo "     Logs: tail -f $PROJECT_ROOT/frontend.log"
elif lsof -ti:8080 > /dev/null 2>&1; then
    ACTUAL_FRONTEND_PID=$(lsof -ti:8080)
    FRONTEND_PORT=8080
    echo "[OK] Frontend started (PID: $ACTUAL_FRONTEND_PID)"
    echo "     Note: Running on port $FRONTEND_PORT (5173 was busy)"
    echo "     Logs: tail -f $PROJECT_ROOT/frontend.log"
else
    echo "[ERROR] Frontend failed to start. Check $PROJECT_ROOT/frontend.log"
    echo "     Last 20 lines of log:"
    tail -20 "$PROJECT_ROOT/frontend.log" | sed 's/^/     /'
    # Kill backend since we're exiting
    lsof -ti:8000 | xargs kill 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "========================================"
echo "AgenticTableTop is running!"
echo "========================================"
echo ""
echo "Frontend:  http://localhost:${FRONTEND_PORT:-5173}"
echo "Backend:   http://localhost:8000"
echo "API Docs:  http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  Backend:  tail -f $PROJECT_ROOT/backend.log"
echo "  Frontend: tail -f $PROJECT_ROOT/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait
