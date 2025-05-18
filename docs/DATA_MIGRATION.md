# Data Structure Migration

This document outlines the migration from the old aggregated file structure to the new per-post file structure implemented in May 2025.

## Old Structure

The previous data structure used single aggregated JSON files:

- `/data/approved.json` - List of all approved posts
- `/data/pending.json` - List of all pending posts
- `/data/comments.json` - Comments organized by post ID
- `/data/votes.json` - Vote counts organized by post ID
- `/data/vote_stats.json` - Upvote and downvote counts by post ID
- `/data/petitions.json` - Petition data organized by post ID

## New Structure

The new structure uses individual JSON files for each post and its associated data:

- `/data/posts/post-{id}.json` - Individual post data
- `/data/posts/index.json` - Index of approved posts
- `/data/comments/{postId}/comment-{id}.json` - Individual comment data
- `/data/comments/{postId}/index.json` - Index of comments for a post
- `/data/comments/{postId}.json` - All comments for a post (compatibility)
- `/data/votes/{postId}.json` - Combined vote data for a post
- `/data/upvotes/{postId}.json` - Upvote data for a post
- `/data/downvotes/{postId}.json` - Downvote data for a post
- `/data/petitions/{postId}.json` - Petition data for a post
- `/data/signatures/{postId}.json` - Signature data for a petition
- `/data/reports/report-{id}.json` - Individual report data

## Migration Process

The migration process consists of two main steps:

1. **Data Migration**: Moving data from the old structure to the new structure
2. **Code Updates**: Updating code references to use the new structure

### Step 1: Data Migration

Run the migration script to convert data from the old structure to the new structure:

```bash
node scripts/migrate_to_per_post_structure.js
```

This script:
- Creates the necessary directories
- Migrates posts from approved.json and pending.json
- Migrates comments for each post
- Migrates votes and vote statistics
- Migrates petitions and signatures
- Creates index files for easy access

### Step 2: Code Updates

Run the update script to modify code references:

```bash
./scripts/update_data_structure_references.sh
```

This script:
- Updates file references in JavaScript, HTML, and shell scripts
- Adds migration comments for clarity
- Creates documentation about the migration

### Step 3: Testing

After migration, run the test script to verify that everything is working properly:

```bash
./scripts/test_data_structure.sh
```

This comprehensive testing script:
- Verifies the data structure directories and files exist
- Starts the enhanced server and tests data loading
- Tests API operations with both new and legacy structures
- Checks that data is properly saved in the new structure
- Provides a detailed report of the test results

For a complete analysis of the testing and results, see [DATA_MIGRATION_TESTING_RESULTS.md](DATA_MIGRATION_TESTING_RESULTS.md).

## Backward Compatibility

The data service (`data_service.js`) has been updated to support both structures:

1. First try loading data from the new per-post structure
2. Fall back to the old structure if necessary
3. Log appropriate warnings when using deprecated data paths

This ensures a smooth transition and prevents breaking changes.

## Benefits of the New Structure

- **Scalability**: Better performance with large numbers of posts
- **Granularity**: Easier to update individual posts or comments
- **Simplicity**: Clearer organization of data
- **Efficiency**: Only load the data needed for a specific post
- **Versioning**: Easier to track changes to individual posts

## Best Practices Going Forward

When developing new features:

1. Always use the new per-post structure
2. Don't rely on fallback mechanisms to the old structure
3. Update any third-party integrations to use the new paths
4. Test thoroughly with the new structure

## Removal of Old Structure

After a sufficient transition period (recommended: 3 months), the old structure files can be safely removed:

```bash
# Only run this after confirming all systems work with the new structure
rm /Users/ernestsaidukamara/Documents/wearesalone/frontend/data/approved.json
rm /Users/ernestsaidukamara/Documents/wearesalone/frontend/data/pending.json
rm /Users/ernestsaidukamara/Documents/wearesalone/frontend/data/comments.json
rm /Users/ernestsaidukamara/Documents/wearesalone/frontend/data/votes.json
rm /Users/ernestsaidukamara/Documents/wearesalone/frontend/data/vote_stats.json
rm /Users/ernestsaidukamara/Documents/wearesalone/frontend/data/petitions.json
```
