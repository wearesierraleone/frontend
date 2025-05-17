#!/bin/zsh
# Repository Path Update Script
# This script updates all occurrences of the old repository path with the new one
# May 2025 Update - Data files are now in the frontend repository

# Color codes for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "${CYAN}=================================${NC}"
echo "${CYAN} Repository Path Update Script ${NC}"
echo "${CYAN}=================================${NC}"
echo ""

# Define repository paths
OLD_REPO="wearesierraleone/wearesalone"
NEW_REPO="wearesierraleone/frontend"

# Check if we're in the right directory
if [[ ! -d "js" || ! -d "data" ]]; then
  echo "${RED}Error: This script must be run from the project root directory.${NC}"
  echo "Current directory: $(pwd)"
  echo "${YELLOW}Please navigate to the project root and try again.${NC}"
  exit 1
fi

echo "Checking for repository path references..."

# Function to update repository URLs in a file
update_file() {
  local file=$1
  local old_string=$2
  local new_string=$3
  
  if grep -q "$old_string" "$file"; then
    sed -i '' "s|$old_string|$new_string|g" "$file"
    echo "  ${GREEN}Updated:${NC} $file"
    return 0
  else
    return 1
  fi
}

# Update utils.js
updated=false
if update_file "js/utils.js" "https://raw.githubusercontent.com/$OLD_REPO/" "https://raw.githubusercontent.com/$NEW_REPO/"; then
  updated=true
fi

# Update any other JavaScript files
find ./js -name "*.js" -type f -exec grep -l "github.com/$OLD_REPO" {} \; | while read file; do
  if update_file "$file" "github.com/$OLD_REPO" "github.com/$NEW_REPO"; then
    updated=true
  fi
done

# Update HTML files
find . -name "*.html" -type f -exec grep -l "github.com/$OLD_REPO" {} \; | while read file; do
  if update_file "$file" "github.com/$OLD_REPO" "github.com/$NEW_REPO"; then
    updated=true
  fi
done

# Update README and documentation files
find . -name "*.md" -type f -exec grep -l "github.com/$OLD_REPO" {} \; | while read file; do
  if update_file "$file" "github.com/$OLD_REPO" "github.com/$NEW_REPO"; then
    updated=true
  fi
done

if [ "$updated" = true ]; then
  echo ""
  echo "${GREEN}Repository path references updated successfully!${NC}"
  echo "${YELLOW}Note: You should test the application to ensure all data loads correctly.${NC}"
  echo "You can use the diagnostics/repository_path_checker.html tool to verify."
else
  echo "${GREEN}No repository path references found that need updating.${NC}"
fi

echo ""
echo "${CYAN}=================================${NC}"
echo "Checking for GitHub Pages URL references..."

# Check if any files reference the old GitHub Pages URL format
OLD_GITHUB_PAGES="refs/heads/main"
NEW_GITHUB_PAGES="main"

github_pages_updated=false

# Check JS files
find ./js -name "*.js" -type f -exec grep -l "$OLD_GITHUB_PAGES" {} \; | while read file; do
  if update_file "$file" "$OLD_GITHUB_PAGES" "$NEW_GITHUB_PAGES"; then
    github_pages_updated=true
  fi
done

if [ "$github_pages_updated" = true ]; then
  echo ""
  echo "${GREEN}GitHub Pages URL references updated successfully!${NC}"
else
  echo "${GREEN}No GitHub Pages URL references found that need updating.${NC}"
fi

echo ""
echo "${GREEN}Repository path update process complete.${NC}"
echo "${CYAN}=================================${NC}"
