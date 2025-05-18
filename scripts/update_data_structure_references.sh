#!/bin/bash
# Script to update server and API references to use the new per-post data structure
# This script should be run after migrate_to_per_post_structure.js

echo "Updating server scripts to use the new per-post data structure..."

# Find all JavaScript and shell scripts that reference the old data structure
echo "Searching for files that need updating..."

FILES_TO_CHECK=$(find /Users/ernestsaidukamara/Documents/wearesalone/frontend -type f \( -name "*.js" -o -name "*.sh" -o -name "*.html" \) -not -path "*/node_modules/*" -not -path "*/\.*")

# Function to process each file
process_file() {
    local file="$1"
    local changes=0
    
    # Check if file contains references to old structure
    if grep -q "data/comments.json\|data/approved.json\|data/pending.json\|data/votes.json\|data/vote_stats.json\|data/petitions.json" "$file"; then
        echo "Processing $file..."
        
        # Get file type
        ext="${file##*.}"
        
        if [ "$ext" == "js" ] || [ "$ext" == "html" ]; then
            # Add a comment at the top of the file noting the update
            if ! grep -q "Updated to use new per-post file structure" "$file"; then
                if [ "$ext" == "js" ]; then
                    sed -i '' '1s/^/\/\/ Updated to use new per-post file structure - May 2025\n/' "$file"
                elif [ "$ext" == "html" ]; then
                    sed -i '' '1s/^/<!-- Updated to use new per-post file structure - May 2025 -->\n/' "$file"
                fi
                changes=$((changes + 1))
            fi
            
            # Update references to old file structure in comments
            if grep -q "\/\/ Old structure:" "$file" || grep -q "\/\* Old structure:" "$file" || grep -q "<!-- Old structure:" "$file"; then
                echo "  - File already contains migration comments, skipping comment updates"
            else
                # Add migration comments where appropriate
                sed -i '' 's|/data/comments.json|/data/comments/{postId}.json \/* Old structure: /data/comments.json *\/|g' "$file"
                sed -i '' 's|/data/approved.json|/data/posts/index.json \/* Old structure: /data/approved.json *\/|g' "$file"
                sed -i '' 's|/data/pending.json|/data/posts/pending.json \/* Old structure: /data/pending.json *\/|g' "$file"
                sed -i '' 's|/data/votes.json|/data/votes/{postId}.json \/* Old structure: /data/votes.json *\/|g' "$file"
                sed -i '' 's|/data/vote_stats.json|/data/upvotes/{postId}.json \/* Old structure: /data/vote_stats.json *\/|g' "$file"
                sed -i '' 's|/data/petitions.json|/data/petitions/{postId}.json \/* Old structure: /data/petitions.json *\/|g' "$file"
                changes=$((changes + 1))
            fi
        elif [ "$ext" == "sh" ]; then
            # Add a comment at the top of the file noting the update
            if ! grep -q "Updated to use new per-post file structure" "$file"; then
                sed -i '' '1s/^/# Updated to use new per-post file structure - May 2025\n/' "$file"
                changes=$((changes + 1))
            fi
            
            # Update references to old file structure in comments
            if grep -q "# Old structure:" "$file"; then
                echo "  - File already contains migration comments, skipping comment updates"
            else
                # Add migration comments where appropriate
                sed -i '' 's|data/comments.json|data/comments/{postId}.json # Old structure: data/comments.json|g' "$file"
                sed -i '' 's|data/approved.json|data/posts/index.json # Old structure: data/approved.json|g' "$file"
                sed -i '' 's|data/pending.json|data/posts/pending.json # Old structure: data/pending.json|g' "$file"
                sed -i '' 's|data/votes.json|data/votes/{postId}.json # Old structure: data/votes.json|g' "$file"
                sed -i '' 's|data/vote_stats.json|data/upvotes/{postId}.json # Old structure: data/vote_stats.json|g' "$file"
                sed -i '' 's|data/petitions.json|data/petitions/{postId}.json # Old structure: data/petitions.json|g' "$file"
                changes=$((changes + 1))
            fi
        fi
        
        if [ $changes -gt 0 ]; then
            echo "  - Updated $changes references in $file"
        else
            echo "  - No changes needed in $file"
        fi
    fi
}

# Process each file
for file in $FILES_TO_CHECK; do
    process_file "$file"
done

echo "Creating documentation file about the data structure migration..."

# Create a documentation file about the migration
cat > "/Users/ernestsaidukamara/Documents/wearesalone/frontend/docs/DATA_MIGRATION.md" << EOL
# Data Structure Migration

This document outlines the migration from the old aggregated file structure to the new per-post file structure implemented in May 2025.

## Old Structure

The previous data structure used single aggregated JSON files:

- \`/data/approved.json\` - List of all approved posts
- \`/data/pending.json\` - List of all pending posts
- \`/data/comments.json\` - Comments organized by post ID
- \`/data/votes.json\` - Vote counts organized by post ID
- \`/data/vote_stats.json\` - Upvote and downvote counts by post ID
- \`/data/petitions.json\` - Petition data organized by post ID

## New Structure

The new structure uses individual JSON files for each post and its associated data:

- \`/data/posts/post-{id}.json\` - Individual post data
- \`/data/posts/index.json\` - Index of approved posts
- \`/data/comments/{postId}/comment-{id}.json\` - Individual comment data
- \`/data/comments/{postId}/index.json\` - Index of comments for a post
- \`/data/comments/{postId}.json\` - All comments for a post (compatibility)
- \`/data/votes/{postId}.json\` - Combined vote data for a post
- \`/data/upvotes/{postId}.json\` - Upvote data for a post
- \`/data/downvotes/{postId}.json\` - Downvote data for a post
- \`/data/petitions/{postId}.json\` - Petition data for a post
- \`/data/signatures/{postId}.json\` - Signature data for a petition
- \`/data/reports/report-{id}.json\` - Individual report data

## Backward Compatibility

The data service has been updated to:

1. First try loading data from the new per-post structure
2. Fall back to the old structure if necessary
3. Log appropriate warnings when using deprecated data paths

## Migration Process

The migration was performed using two scripts:

1. \`scripts/migrate_to_per_post_structure.js\` - Migrates data to the new structure
2. \`scripts/update_data_structure_references.sh\` - Updates codebase references

## Benefits of the New Structure

- **Scalability**: Better performance with large numbers of posts
- **Granularity**: Easier to update individual posts or comments
- **Simplicity**: Clearer organization of data
- **Efficiency**: Only load the data needed for a specific post
- **Versioning**: Easier to track changes to individual posts
EOL

echo "Update complete!"
echo "Next steps:"
echo "1. Run the migration script: node scripts/migrate_to_per_post_structure.js"
echo "2. Test the application thoroughly"
echo "3. Once confirmed working, you can remove the old data files (optional)"

exit 0
