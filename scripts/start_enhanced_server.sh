#!/bin/zsh
# Enhanced local server script with API endpoints for development

# Change to the directory of the script
cd "$(dirname "$0")/.."
FRONTEND_DIR="$(pwd)"

echo "🚀 Starting enhanced local server in $FRONTEND_DIR"
echo "📂 Files will be served from this directory"
echo "🔌 API endpoints will be available for development"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is required for the enhanced server. Please install Node.js."
  exit 1
fi

# Start the Node.js server
echo "📡 Starting API-enabled server with comment updates support..."
node "$FRONTEND_DIR/scripts/enhanced_server.js"
