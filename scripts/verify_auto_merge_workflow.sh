#!/bin/bash
# Verify auto-merge workflow configuration for index updates

echo "====================================================="
echo "   Verify Auto-Merge Workflow Index Update Feature"
echo "====================================================="

WORKFLOW_FILE=".github/workflows/auto-merge-content-prs.yml"
FRONTEND_DIR="/Users/ernestsaidukamara/Documents/wearesalone/frontend"
FULL_PATH="$FRONTEND_DIR/$WORKFLOW_FILE"

# Check if workflow file exists
if [ ! -f "$FULL_PATH" ]; then
    echo "❌ Error: Workflow file not found at $FULL_PATH"
    exit 1
fi

echo "✓ Found workflow file at $FULL_PATH"

# Check key components of the workflow
echo -e "\nChecking for index update job..."
if grep -q "update-indexes:" "$FULL_PATH"; then
    echo "✓ Found update-indexes job"
else
    echo "❌ Error: update-indexes job not found"
    exit 1
fi

echo -e "\nChecking for index file update logic..."
if grep -q "indexUpdates.posts.add" "$FULL_PATH" && grep -q "indexUpdates.comments" "$FULL_PATH"; then
    echo "✓ Found index updating logic for posts and comments"
else
    echo "❌ Error: Missing index update logic for posts and/or comments"
    exit 1
fi

echo -e "\nChecking for github.rest.repos.createOrUpdateFileContents..."
if grep -q "github.rest.repos.createOrUpdateFileContents" "$FULL_PATH"; then
    echo "✓ Found file update API calls"
else
    echo "❌ Error: Missing file update API calls"
    exit 1
fi

echo -e "\nChecking for PR notification comment..."
if grep -q "Index files have been updated" "$FULL_PATH"; then
    echo "✓ Found PR notification comment for index updates"
else
    echo "❌ Warning: Missing PR notification comment for index updates"
fi

# Check dependency ordering
echo -e "\nVerifying job dependencies..."
if grep -q "needs: \[validate-json, add-auto-merge-label, update-indexes\]" "$FULL_PATH"; then
    echo "✓ auto-merge job correctly depends on update-indexes"
else
    echo "❌ Error: auto-merge job doesn't properly depend on update-indexes"
    exit 1
fi

echo -e "\n✅ Workflow configuration verification completed successfully!"
echo "The auto-merge workflow is correctly configured to update index files."
echo "====================================================="

# Test simulated file additions
echo -e "\nRunning simulation of PR with new content files..."
node "$FRONTEND_DIR/scripts/test_index_updates.js"

exit 0
