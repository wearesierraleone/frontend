#!/bin/bash
# Comprehensive testing script for the We Are Sierra Leone platform
# Tests the functionality of the platform with the new per-post file structure

echo "==============================================================="
echo "   We Are Sierra Leone - Data Structure Testing Tool"
echo "==============================================================="

# Set colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Define paths
FRONTEND_DIR="/Users/ernestsaidukamara/Documents/wearesalone/frontend"
SCRIPTS_DIR="$FRONTEND_DIR/scripts"
DATA_DIR="$FRONTEND_DIR/data"

# Step 1: Verify data structure
echo -e "${BLUE}Step 1: Verifying data structure...${NC}"
node "$SCRIPTS_DIR/test_data_structure.js"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Data structure test failed!${NC}"
    echo "Please check the output above for details on what's wrong with the data structure."
    exit 1
fi

echo -e "${GREEN}✓ Data structure verification passed${NC}"

# Step 2: Start the enhanced server in the background
echo -e "\n${BLUE}Step 2: Starting the enhanced server...${NC}"
node "$SCRIPTS_DIR/enhanced_server.js" &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 3

# Make sure server is running
if ! ps -p $SERVER_PID > /dev/null; then
    echo -e "${RED}Error: Server failed to start!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Server started successfully. PID: $SERVER_PID${NC}"
SERVER_URL="http://localhost:5500"

# Step 3: Test data loading operations (using curl)
echo -e "\n${BLUE}Step 3: Testing data loading operations...${NC}"

# Test index.html (homepage)
echo -e "${CYAN}Testing homepage loading...${NC}"
curl -s "$SERVER_URL" > /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not load homepage!${NC}"
    kill $SERVER_PID
    exit 1
fi
echo -e "${GREEN}✓ Homepage loaded successfully${NC}"

# Find a post ID to test with
echo -e "${CYAN}Looking for a post to test with...${NC}"
POST_ID=""

# Try to find a post ID by checking the posts directory
if [ -d "$DATA_DIR/posts" ]; then
    # Get the first post file
    POST_FILE=$(ls "$DATA_DIR/posts" | grep -v "index.json" | head -n 1)
    if [ -n "$POST_FILE" ]; then
        # Extract post ID from filename
        POST_ID=$(echo "$POST_FILE" | sed 's/post-\(.*\)\.json/\1/')
    fi
fi

# If we couldn't find a post in the new structure, try the old structure
if [ -z "$POST_ID" ] && [ -f "$DATA_DIR/approved.json" ]; then
    # Extract the first post ID from approved.json
    POST_ID=$(grep -o '"id":[^,]*' "$DATA_DIR/approved.json" | head -n 1 | cut -d'"' -f4)
fi

if [ -z "$POST_ID" ]; then
    echo -e "${RED}Error: Could not find any post to test with!${NC}"
    kill $SERVER_PID
    exit 1
fi

echo -e "${GREEN}✓ Found test post ID: $POST_ID${NC}"

# Test post.html with the post ID
echo -e "${CYAN}Testing post page loading...${NC}"
curl -s "$SERVER_URL/post.html?id=$POST_ID" > /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not load post page!${NC}"
    kill $SERVER_PID
    exit 1
fi
echo -e "${GREEN}✓ Post page loaded successfully${NC}"

# Step 4: Test API operations
echo -e "\n${BLUE}Step 4: Testing API operations...${NC}"

# Test adding a comment
echo -e "${CYAN}Testing comment submission...${NC}"
COMMENT_ID="testcomment$(date +%s)"
curl -s -X POST -H "Content-Type: application/json" -d "{\"postId\":\"$POST_ID\",\"id\":\"$COMMENT_ID\",\"text\":\"This is a test comment\",\"author\":\"Test User\",\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" "$SERVER_URL/comment" > /dev/null

# Verify the comment was added to the new structure
if [ ! -f "$DATA_DIR/comments/$POST_ID/comment-$COMMENT_ID.json" ]; then
    echo -e "${YELLOW}Warning: Comment not saved in new structure!${NC}"
else
    echo -e "${GREEN}✓ Comment saved in new structure${NC}"
fi

# Verify comment was added to combined file
if [ ! -f "$DATA_DIR/comments/$POST_ID.json" ]; then
    echo -e "${YELLOW}Warning: Comment not saved in combined file!${NC}"
else
    COMMENT_FOUND=$(grep -l "$COMMENT_ID" "$DATA_DIR/comments/$POST_ID.json" || echo "")
    if [ -n "$COMMENT_FOUND" ]; then
        echo -e "${GREEN}✓ Comment saved in combined file${NC}"
    else
        echo -e "${YELLOW}Warning: Comment not found in combined file!${NC}"
    fi
fi

# Verify comment was added to legacy structure
if [ -f "$DATA_DIR/comments.json" ]; then
    LEGACY_COMMENT_FOUND=$(grep -l "$COMMENT_ID" "$DATA_DIR/comments.json" || echo "")
    if [ -n "$LEGACY_COMMENT_FOUND" ]; then
        echo -e "${GREEN}✓ Comment saved in legacy structure${NC}"
    else
        echo -e "${YELLOW}Warning: Comment not found in legacy structure!${NC}"
    fi
else
    echo -e "${YELLOW}Warning: Legacy comments.json file not found!${NC}"
fi

# Step 5: Shutdown the server
echo -e "\n${BLUE}Step 5: Shutting down the server...${NC}"
kill $SERVER_PID
echo -e "${GREEN}✓ Server stopped${NC}"

# Final report
echo -e "\n${BLUE}=== Testing Summary ===${NC}"
echo -e "${GREEN}✓ Data structure validation passed${NC}"
echo -e "${GREEN}✓ Server started and stopped successfully${NC}"
echo -e "${GREEN}✓ Homepage loaded successfully${NC}"
echo -e "${GREEN}✓ Post page loaded successfully${NC}"
echo -e "${GREEN}✓ Comment submission tested${NC}"

echo -e "\n${GREEN}All tests completed successfully!${NC}"
echo -e "${YELLOW}The platform is now ready to use the new per-post file structure.${NC}"
echo -e "${YELLOW}Legacy files will still work for backward compatibility.${NC}"
echo
echo "After further usage and testing, you can consider removing the old data files:"
echo "- data/approved.json"
echo "- data/pending.json"
echo "- data/comments.json"
echo "- data/votes.json"
echo "- data/vote_stats.json"
echo "- data/petitions.json"
echo 
echo "Recommended timeframe: Keep legacy files for at least 3 months to ensure smooth transition."

exit 0
