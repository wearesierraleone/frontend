#!/bin/zsh
# Test Vote Initialization Feature
# This script tests the vote initialization feature to ensure it works correctly

# Navigate to the project root
cd "$(dirname "$0")/.."
FRONTEND_DIR="$(pwd)"

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}======================================${NC}"
echo "${BLUE}| Test Vote Initialization Feature   |${NC}"
echo "${BLUE}======================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "${RED}❌ Error: Node.js is required for this test. Please install Node.js.${NC}"
  exit 1
fi

# Check if enhanced server is running
echo "${YELLOW}🔍 Checking if enhanced server is running...${NC}"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5500/ &> /dev/null
SERVER_STATUS=$?

if [ $SERVER_STATUS -ne 0 ]; then
  echo "${YELLOW}ℹ️ Enhanced server is not running. Starting server...${NC}"
  # Start the enhanced server in the background
  $FRONTEND_DIR/scripts/start_enhanced_server.sh &
  SERVER_PID=$!
  
  # Wait for server to start
  echo "${YELLOW}⏳ Waiting for server to start...${NC}"
  sleep 3
else
  echo "${GREEN}✅ Enhanced server is already running${NC}"
  SERVER_PID=""
fi

# Run the test using Node.js
echo "${YELLOW}🧪 Running vote initialization tests...${NC}"
node "$FRONTEND_DIR/scripts/test_vote_initialization.js"

# Check test result
TEST_STATUS=$?

# Clean up - kill the server if we started it
if [ ! -z "$SERVER_PID" ]; then
  echo "${YELLOW}⏳ Stopping server...${NC}"
  kill $SERVER_PID
fi

echo "${BLUE}======================================${NC}"
if [ $TEST_STATUS -eq 0 ]; then
  echo "${GREEN}✅ Vote initialization tests passed!${NC}"
else
  echo "${RED}❌ Vote initialization tests failed!${NC}"
fi
echo "${BLUE}======================================${NC}"

exit $TEST_STATUS
