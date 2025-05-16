#!/bin/bash
# This script syncs data files from the root directory to the frontend/data directory

echo "Syncing data files to frontend/data..."

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_SOURCE_DIR="$ROOT_DIR/data"
DATA_DEST_DIR="$SCRIPT_DIR/data"

# Check if the source directory exists
if [ ! -d "$DATA_SOURCE_DIR" ]; then
    echo "Error: Source data directory not found at $DATA_SOURCE_DIR"
    echo "Please make sure you have a data directory in the root of the project"
    exit 1
fi

# Ensure the destination directory exists
mkdir -p "$DATA_DEST_DIR"

# Copy all JSON files from the root data directory to frontend/data
echo "Copying files from $DATA_SOURCE_DIR to $DATA_DEST_DIR..."
cp -v "$DATA_SOURCE_DIR/"*.json "$DATA_DEST_DIR/"

# Verify the files were copied
echo "Verifying files..."
for file in "$DATA_SOURCE_DIR/"*.json; do
    basename=$(basename "$file")
    if [ -f "$DATA_DEST_DIR/$basename" ]; then
        echo "✓ $basename successfully synced"
    else
        echo "✗ Failed to sync $basename"
    fi
done

echo "Done! Data files are now in sync."
