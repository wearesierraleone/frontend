#!/bin/bash
# Master script to run both migration tools in sequence

echo "==============================================================="
echo "   We Are Sierra Leone - Data Structure Migration Utility"
echo "==============================================================="
echo "This script will migrate from the old single-file structure"
echo "to the new per-post file structure."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js before running this script."
    exit 1
fi

# Define paths
FRONTEND_DIR="/Users/ernestsaidukamara/Documents/wearesalone/frontend"
SCRIPTS_DIR="$FRONTEND_DIR/scripts"
DATA_DIR="$FRONTEND_DIR/data"

# Check if necessary files exist
if [ ! -f "$SCRIPTS_DIR/migrate_to_per_post_structure.js" ]; then
    echo "Error: migrate_to_per_post_structure.js not found!"
    exit 1
fi

if [ ! -f "$SCRIPTS_DIR/update_data_structure_references.sh" ]; then
    echo "Error: update_data_structure_references.sh not found!"
    exit 1
fi

# Warning and confirmation
echo "WARNING: This will migrate data from the old structure to the new structure."
echo "It is recommended to back up your data directory before proceeding."
echo
read -p "Have you backed up your data directory? (y/n): " confirm
if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "Migration aborted. Please back up your data directory first."
    exit 0
fi

echo
echo "Step 1: Migrating data to the new structure..."
echo "-----------------------------------------------"
node "$SCRIPTS_DIR/migrate_to_per_post_structure.js"

if [ $? -ne 0 ]; then
    echo "Error: Data migration failed!"
    exit 1
fi

echo
echo "Step 2: Updating code references..."
echo "-----------------------------------------------"
"$SCRIPTS_DIR/update_data_structure_references.sh"

if [ $? -ne 0 ]; then
    echo "Error: Code reference update failed!"
    exit 1
fi

echo
echo "==============================================================="
echo "   Migration Complete!"
echo "==============================================================="
echo
echo "Next steps:"
echo "1. Test the application thoroughly with the new structure"
echo "2. Review the newly created documentation: docs/DATA_MIGRATION.md"
echo "3. After a transition period, the old data files can be removed"
echo
echo "For more information, see docs/DATA_MIGRATION.md"

exit 0
