#!/bin/bash
# Setup script for GitHub repository secrets
# This script helps set up the GitHub repository secret for automated token injection

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== We Are Sierra Leone GitHub Secrets Setup ===${NC}"
echo "This script will help you set up the GitHub repository secret for automated token injection."
echo

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not installed.${NC}"
    echo "Please install the GitHub CLI first: https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to log in to GitHub CLI first.${NC}"
    gh auth login
fi

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
else
    echo -e "${RED}Error: This does not appear to be a GitHub repository.${NC}"
    exit 1
fi

echo -e "Repository: ${GREEN}$REPO_PATH${NC}"

# Prompt for the GitHub token
echo -e "${YELLOW}You need a GitHub Personal Access Token with 'repo' scope.${NC}"
echo "If you don't have one, create one at: https://github.com/settings/tokens"
echo
read -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: No token provided.${NC}"
    exit 1
fi

# Set the repository secret
echo -e "${YELLOW}Setting up the GITHUB_DATA_TOKEN secret...${NC}"
echo "$GITHUB_TOKEN" | gh secret set GITHUB_DATA_TOKEN --repo "$REPO_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Success! GITHUB_DATA_TOKEN has been set up for $REPO_PATH${NC}"
    echo
    echo -e "You can now deploy using GitHub Actions:"
    echo "1. Push to the main or gh-pages-clean branch"
    echo "2. Or manually trigger the workflow from the Actions tab"
else
    echo -e "${RED}Failed to set the repository secret.${NC}"
    echo "Please try again or set it manually through the GitHub web interface:"
    echo "1. Go to https://github.com/$REPO_PATH/settings/secrets/actions"
    echo "2. Click 'New repository secret'"
    echo "3. Name: GITHUB_DATA_TOKEN"
    echo "4. Value: [Your GitHub Personal Access Token]"
    exit 1
fi
