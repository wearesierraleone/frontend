#!/bin/zsh
# This script demonstrates how to update the approved.json file to change post status
# In a real application, this would be done through an admin interface
# 
# Usage: ./scripts/approve_demo.sh <post_id> <new_status>
# Example: ./scripts/approve_demo.sh post1234 approved

# Check if we have the required parameters
if [ $# -ne 2 ]; then
  echo "Usage: $0 <post_id> <new_status>"
  echo "Example: $0 post1234 approved"
  exit 1
fi

POST_ID="$1"
NEW_STATUS="$2"

# Validate new status
if [[ "$NEW_STATUS" != "approved" && "$NEW_STATUS" != "pending" && "$NEW_STATUS" != "rejected" ]]; then
  echo "Error: status must be 'approved', 'pending', or 'rejected'"
  exit 1
fi

# Path to the approved.json file
APPROVED_JSON="$(dirname "$0")/../data/approved.json"

# Check if file exists
if [ ! -f "$APPROVED_JSON" ]; then
  echo "Error: approved.json file not found at $APPROVED_JSON"
  exit 1
fi

# Create a temporary file
TMP_FILE=$(mktemp)

# Use jq to update the status if the post ID is found
if command -v jq &> /dev/null; then
  # Use jq for proper JSON manipulation
  jq --arg id "$POST_ID" --arg status "$NEW_STATUS" '
    map(if .id == $id then .status = $status else . end)
  ' "$APPROVED_JSON" > "$TMP_FILE"
  
  # Check if any post was updated
  UPDATED=$(jq --arg id "$POST_ID" 'map(select(.id == $id)) | length' "$TMP_FILE")
  
  if [ "$UPDATED" -eq 0 ]; then
    echo "Error: No post found with ID $POST_ID"
    rm "$TMP_FILE"
    exit 1
  fi
  
  # Replace the original file
  mv "$TMP_FILE" "$APPROVED_JSON"
  
  echo "✅ Successfully updated post $POST_ID status to $NEW_STATUS"
else
  echo "Error: jq is not installed. Please install jq with 'brew install jq'"
  rm "$TMP_FILE"
  exit 1
fi
