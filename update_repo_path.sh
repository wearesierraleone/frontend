#!/bin/bash
# Script to update the repository path in utils.js

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== We Are Sierra Leone Repository Path Update ===${NC}"
echo "This script will update the repository path in utils.js to match your GitHub repository."
echo

# Get repository information
echo -e "${YELLOW}Getting repository information...${NC}"
REPO_URL=$(git config --get remote.origin.url)

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}Error: Could not determine repository URL.${NC}"
    echo "Please run this script from within a git repository."
    exit 1
fi

# Extract owner and repo name
if [[ $REPO_URL == *"github.com"* ]]; then
    # HTTPS URL format
    if [[ $REPO_URL == https://* ]]; then
        REPO_PATH=$(echo $REPO_URL | sed 's/https:\/\/github.com\///' | sed 's/\.git$//')
    # SSH URL format
    elif [[ $REPO_URL == git@* ]]; then
        REPO_PATH=$(echo $REPO_URL | sed 's/git@github.com://' | sed 's/\.git$//')
    else
        echo -e "${RED}Error: Unrecognized GitHub URL format.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Repository path: ${REPO_PATH}${NC}"
    
    # Check if utils.js exists
    if [ ! -f "js/utils.js" ]; then
        echo -e "${RED}Error: js/utils.js not found.${NC}"
        exit 1
    fi
    
    # Check current repository path in utils.js
    CURRENT_PATH=$(grep -o "raw.githubusercontent.com/[^/]*/[^/]*/" js/utils.js | head -1 | cut -d'/' -f3-4)
    
    if [ -z "$CURRENT_PATH" ]; then
        echo -e "${RED}Could not detect current repository path in utils.js${NC}"
    else
        echo -e "${YELLOW}Current repository path in utils.js: ${CURRENT_PATH}${NC}"
        
        if [ "$CURRENT_PATH" == "$REPO_PATH" ]; then
            echo -e "${GREEN}Repository path is already correct in utils.js${NC}"
        else
            echo -e "${YELLOW}Updating repository path in utils.js...${NC}"
            
            # Make a backup of utils.js
            cp js/utils.js js/utils.js.bak
            
            # Update the repository path
            sed -i '' "s|githubusercontent.com/[^/]*/[^/]*/|githubusercontent.com/${REPO_PATH}/|g" js/utils.js
            
            echo -e "${GREEN}Repository path updated successfully${NC}"
            echo "A backup of the original file was created at js/utils.js.bak"
        fi
    fi
else
    echo -e "${RED}Error: This does not appear to be a GitHub repository.${NC}"
    exit 1
fi

echo
echo -e "${GREEN}Done!${NC}"
