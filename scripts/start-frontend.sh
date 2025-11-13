#!/bin/bash
# Start AgenticTableTop Frontend

echo "Starting AgenticTableTop Frontend..."
echo ""

cd src/ui

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Dependencies not installed. Installing..."
    npm install
    echo "[OK] Dependencies installed"
fi

echo ""
echo "Starting frontend on http://localhost:5173"
echo "Make sure the backend is running on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the frontend
npm run dev
