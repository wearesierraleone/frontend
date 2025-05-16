#!/bin/bash
# This script helps verify the GitHub Pages deployment is working correctly

echo "GitHub Pages Deployment Verification"
echo "===================================="

# Check if we are in the right directory (should contain frontend)
if [ ! -d "frontend" ]; then
    echo "Error: This script should be run from the root directory containing the frontend folder"
    exit 1
fi

# Verify data directories
echo -e "\n1. Checking data directories..."
if [ -d "data" ]; then
    echo "✓ Root data directory exists"
    DATA_FILES=$(find data -name "*.json" | wc -l)
    echo "  Found $DATA_FILES JSON files in root data directory"
else
    echo "✗ Root data directory is missing!"
fi

if [ -d "frontend/data" ]; then
    echo "✓ Frontend data directory exists"
    FRONTEND_DATA_FILES=$(find frontend/data -name "*.json" | wc -l)
    echo "  Found $FRONTEND_DATA_FILES JSON files in frontend data directory"
else
    echo "✗ Frontend data directory is missing!"
    echo "  Creating frontend/data directory..."
    mkdir -p frontend/data
fi

# Check if data files are in sync
echo -e "\n2. Checking if data files are in sync..."
if [ -d "data" ] && [ -d "frontend/data" ]; then
    ROOT_FILES=$(ls -1 data/*.json 2>/dev/null | sort)
    FRONTEND_FILES=$(ls -1 frontend/data/*.json 2>/dev/null | sort)
    
    if [ "$(echo "$ROOT_FILES" | md5sum)" = "$(echo "$FRONTEND_FILES" | sed 's|frontend/||g' | md5sum)" ]; then
        echo "✓ Data files are in sync"
    else
        echo "✗ Data files are not in sync!"
        echo "  Running sync script..."
        chmod +x frontend/scripts/sync_data_files.sh
        frontend/scripts/sync_data_files.sh
    fi
fi

# Verify baseUrl function in utils.js
echo -e "\n3. Checking baseUrl function in utils.js..."
if grep -q "return '/frontend'" frontend/js/utils.js; then
    echo "✓ baseUrl function returns '/frontend' for GitHub Pages"
else
    echo "✗ baseUrl function may not be correctly configured for GitHub Pages!"
    echo "  Please check frontend/js/utils.js"
fi

# Check if all pages use loadData
echo -e "\n4. Checking if all HTML pages use loadData instead of direct fetch calls..."
DIRECT_FETCHES=$(grep -r "fetch.*data/" --include="*.html" frontend | grep -v "loadData" | wc -l)
if [ $DIRECT_FETCHES -eq 0 ]; then
    echo "✓ All pages use loadData correctly"
else
    echo "✗ Found $DIRECT_FETCHES direct fetch calls that should use loadData!"
    grep -r "fetch.*data/" --include="*.html" frontend | grep -v "loadData"
fi

# Check GitHub workflow file
echo -e "\n5. Checking GitHub Actions workflow..."
if [ -f "frontend/.github/workflows/deploy-github-pages.yml" ]; then
    echo "✓ GitHub Actions workflow file exists"
    if grep -q "mkdir -p ./data" frontend/.github/workflows/deploy-github-pages.yml; then
        echo "✓ Workflow includes data directory verification"
    else
        echo "✗ Workflow should include data directory verification!"
    fi
else
    echo "✗ GitHub Actions workflow file is missing!"
fi

# Final deployment checklist
echo -e "\n6. Deployment Checklist:"
echo "  ☐ Push changes to the main branch"
echo "  ☐ Verify GitHub Actions workflow runs successfully"
echo "  ☐ Check GitHub Pages site at https://[username].github.io/frontend"
echo "  ☐ Verify data loads correctly on all pages"
echo "  ☐ Test form submissions and voting functionality"

echo -e "\nVerification complete! Address any issues marked with ✗"
