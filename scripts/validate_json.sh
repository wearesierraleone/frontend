#!/bin/zsh
# This script validates the approved.json file to ensure it is valid JSON
# and has the expected structure

# Change to the script's directory's parent (project root)
cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

echo "🔍 Validating approved.json in $PROJECT_ROOT/data"

# Path to the approved.json file
APPROVED_JSON="$PROJECT_ROOT/data/approved.json"

# Check if file exists
if [ ! -f "$APPROVED_JSON" ]; then
  echo "❌ Error: approved.json file not found at $APPROVED_JSON"
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "❌ Error: jq is not installed. Please install jq with 'brew install jq'"
  exit 1
fi

# Validate JSON syntax
if ! jq '.' "$APPROVED_JSON" > /dev/null 2>&1; then
  echo "❌ Error: approved.json is not valid JSON"
  exit 1
fi

echo "✅ JSON syntax is valid"

# Check if it's an array
if ! jq 'if type == "array" then true else false end' "$APPROVED_JSON" | grep -q "true"; then
  echo "❌ Error: approved.json must contain a JSON array"
  exit 1
fi

echo "✅ Structure is valid (array)"

# Count posts by status
TOTAL=$(jq '. | length' "$APPROVED_JSON")
APPROVED=$(jq '[.[] | select(.status == "approved")] | length' "$APPROVED_JSON")
PENDING=$(jq '[.[] | select(.status == "pending")] | length' "$APPROVED_JSON")
REJECTED=$(jq '[.[] | select(.status == "rejected")] | length' "$APPROVED_JSON")
UNKNOWN=$(jq '[.[] | select(.status != "approved" and .status != "pending" and .status != "rejected")] | length' "$APPROVED_JSON")

echo "📊 Statistics:"
echo "   Total posts: $TOTAL"
echo "   Approved posts: $APPROVED"
echo "   Pending posts: $PENDING"
echo "   Rejected posts: $REJECTED"

# Check if there are posts with unknown status
if [ "$UNKNOWN" -gt 0 ]; then
  echo "⚠️  Warning: Found $UNKNOWN posts with unknown status"
fi

# Check if all posts have required fields
MISSING_FIELDS=$(jq '[.[] | select(.id == null or .title == null or .body == null or .status == null)] | length' "$APPROVED_JSON")

if [ "$MISSING_FIELDS" -gt 0 ]; then
  echo "⚠️  Warning: Found $MISSING_FIELDS posts missing required fields (id, title, body, or status)"
  
  # Show posts with missing fields
  echo "📝 Posts with missing fields:"
  jq '.[] | select(.id == null or .title == null or .body == null or .status == null) | {id: .id, title: .title, missing: (["id","title","body","status"] | map(. as $field | if getpath([$field]) == null then $field else empty end) | join(", "))}' "$APPROVED_JSON"
fi

echo "✅ Validation complete"
