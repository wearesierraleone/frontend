#!/bin/bash
# GitHub Pages Deployment Script
# This script automates the deployment of the We Are Sierra Leone frontend to GitHub Pages

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== We Are Sierra Leone GitHub Pages Deployment ===${NC}"
echo "This script will deploy the frontend to GitHub Pages."
echo

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed.${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "js" ] || [ ! -f "index.html" ]; then
    echo -e "${RED}Error: This script must be run from the frontend directory.${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Check if the repository exists
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: This is not a git repository.${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

# Confirm deployment
read -p "Do you want to deploy the frontend to GitHub Pages? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Verify the state of the repo
if [[ $(git status --porcelain) ]]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
    echo "These changes will be committed as part of the deployment."
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi
fi

# Verify the GitHub Pages branch exists or create it
echo -e "${YELLOW}Checking for gh-pages branch...${NC}"
if ! git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "Creating gh-pages branch..."
    git checkout -b gh-pages
    NEW_BRANCH=true
else
    echo "gh-pages branch exists."
    read -p "Switch to gh-pages branch? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi
    git checkout gh-pages
    git pull origin gh-pages || true
fi

# Ensure .nojekyll file exists to prevent Jekyll processing
if [ ! -f ".nojekyll" ]; then
    echo "Creating .nojekyll file..."
    touch .nojekyll
    git add .nojekyll
fi

# Stage all files
echo -e "${YELLOW}Staging files for commit...${NC}"
git add .

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "GitHub Pages deployment - ${TIMESTAMP}"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push -u origin gh-pages

# Go back to the original branch if we created a new branch
if [ "$CURRENT_BRANCH" != "gh-pages" ] && [ "$NEW_BRANCH" != "true" ]; then
    git checkout "$CURRENT_BRANCH"
fi

# Display success message
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "Your site should be available at: ${YELLOW}https://$(git remote -v | grep fetch | awk '{print $2}' | cut -d':' -f2 | cut -d'.' -f1).github.io/$(basename $(git rev-parse --show-toplevel))/${NC}"
echo
echo -e "${YELLOW}Important:${NC}"
echo "1. Make sure GitHub Pages is enabled in your repository settings"
echo "2. Set the branch to 'gh-pages' in your repository settings"
echo "3. Check your deployment status in your repository's 'Actions' tab"
echo
echo -e "${YELLOW}Support:${NC}"
echo "If you need help with your deployment, check the docs/GITHUB_PAGES_DEPLOYMENT.md file."
