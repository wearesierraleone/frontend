#!/bin/bash
# This script detects the correct base URL for GitHub Pages deployment

echo "Detecting GitHub Pages Base URL"
echo "=============================="

# Get the GitHub username and repository name
cd "$(dirname "$0")"

# First check if we're using GitHub CLI
if command -v gh &> /dev/null; then
    echo "Using GitHub CLI to detect repository info..."
    REPO_URL=$(gh repo view --json url -q .url 2>/dev/null)
    
    if [ ! -z "$REPO_URL" ]; then
        echo "Repository URL: $REPO_URL"
        USERNAME=$(echo $REPO_URL | awk -F'/' '{print $(NF-1)}')
        REPO=$(echo $REPO_URL | awk -F'/' '{print $NF}')
    fi
fi

# Fall back to git remote if GitHub CLI didn't work
if [ -z "$REPO_URL" ]; then
    echo "Using git remote to detect repository info..."
    REMOTE_URL=$(git remote get-url origin 2>/dev/null)
    
    if [ ! -z "$REMOTE_URL" ]; then
        echo "Remote URL: $REMOTE_URL"
        
        # Extract username and repo from different URL formats
        if [[ $REMOTE_URL == *"github.com"* ]]; then
            # Handle HTTPS URLs like https://github.com/username/repo.git
            if [[ $REMOTE_URL == https://* ]]; then
                USERNAME=$(echo $REMOTE_URL | awk -F'/' '{print $(NF-1)}')
                REPO=$(echo $REMOTE_URL | awk -F'/' '{print $NF}' | sed 's/\.git//')
            # Handle SSH URLs like git@github.com:username/repo.git
            elif [[ $REMOTE_URL == git@* ]]; then
                USERNAME=$(echo $REMOTE_URL | awk -F':' '{print $2}' | awk -F'/' '{print $1}')
                REPO=$(echo $REMOTE_URL | awk -F'/' '{print $NF}' | sed 's/\.git//')
            fi
        fi
    fi
fi

# Manual fallback if automatic detection fails
if [ -z "$USERNAME" ] || [ -z "$REPO" ]; then
    echo "Could not automatically detect GitHub username and repository."
    echo "Please enter them manually:"
    read -p "GitHub Username: " USERNAME
    read -p "Repository Name: " REPO
fi

# Generate the GitHub Pages URL
GITHUB_PAGES_URL="https://${USERNAME}.github.io/${REPO}"
BASE_PATH="/${REPO}"

echo 
echo "Results:"
echo "--------"
echo "GitHub Pages URL: $GITHUB_PAGES_URL"
echo "Base Path for URLs: $BASE_PATH"
echo
echo "To update your baseUrl function in utils.js, use: \"return '$BASE_PATH';\""

# Detect if we're in the frontend repo with a utils.js file
if [ -f "js/utils.js" ]; then
    echo
    echo "utils.js file detected. Would you like to update it with the correct base URL? (y/n)"
    read -p "> " UPDATE_UTILS
    
    if [[ $UPDATE_UTILS == "y" || $UPDATE_UTILS == "Y" ]]; then
        # Create a backup
        cp js/utils.js js/utils.js.bak
        
        # Update the baseUrl function using sed
        sed -i '' "s|return '';  // For GitHub Pages, data files|return '$BASE_PATH';  // For GitHub Pages, data files|g" js/utils.js
        
        echo "Updated js/utils.js with the correct base URL."
        echo "A backup was created at js/utils.js.bak"
    fi
fi
