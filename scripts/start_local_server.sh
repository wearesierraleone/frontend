#!/bin/zsh
# Simple script to start a local server for development
# This helps with testing the website locally and avoiding CORS issues

# Change to the frontend directory
cd "$(dirname "$0")/.."
FRONTEND_DIR="$(pwd)"

echo "🚀 Starting local server in $FRONTEND_DIR"
echo "📂 Files will be served from this directory"
echo "🌐 This helps avoid CORS issues with file:// protocol"

# Check for data directory with required JSON files
if [ -d "$FRONTEND_DIR/data" ]; then
    if [ -f "$FRONTEND_DIR/data/approved.json" ]; then
        echo "✅ Found approved.json data file"
    else
        echo "⚠️  Warning: approved.json not found in data directory"
    fi
else
    echo "⚠️  Warning: data directory not found. Create it with required JSON files."
    mkdir -p "$FRONTEND_DIR/data"
fi

# Check if Python 3 is installed
if command -v python3 &> /dev/null; then
    echo "🐍 Using Python 3 HTTP server"
    echo "🔗 Access the site at: http://localhost:8080"
    # Start Python HTTP server on port 8080
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    # Check if this is Python 3
    PYTHON_VERSION=$(python --version 2>&1)
    if [[ $PYTHON_VERSION == *"Python 3"* ]]; then
        echo "🐍 Using Python 3 HTTP server"
        echo "🔗 Access the site at: http://localhost:8080"
        python -m http.server 8080
    else 
        echo "🐍 Using Python SimpleHTTPServer"
        python -m SimpleHTTPServer 8080
    fi
elif command -v npx &> /dev/null; then
    echo "📦 Using npx serve"
    npx serve -l 8080
else
    echo "❌ Error: Could not find Python or npx. Please install one of them to run a local server."
    echo "   Install Python: https://www.python.org/downloads/"
    echo "   OR"
    echo "   Install Node.js (for npx): https://nodejs.org/"
    exit 1
fi
