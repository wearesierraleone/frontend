# Auto-Merge Content PRs Workflow

This document describes the automated workflow for handling pull requests (PRs) that contain content changes in the We Are Sierra Leone platform.

## Overview

The `auto-merge-content-prs.yml` GitHub Actions workflow automatically validates, approves, and merges PRs that only modify content files in the new per-post file structure (comments, votes, posts, petitions, etc.). The workflow also cleans up by deleting branches after successful merges.

## How It Works

### Triggering Conditions

The workflow is triggered when:
- A PR is opened, synchronized, reopened, or labeled
- The PR modifies any content files in these directories:
  - `data/comments/` - Comment files for posts
  - `data/posts/` - Post content files
  - `data/votes/` - Vote collection files
  - `data/upvotes/` - Upvote data files
  - `data/downvotes/` - Downvote data files
  - `data/petitions/` - Petition files
  - `data/signatures/` - Petition signature files
  - `data/reports/` - Report files

### Workflow Steps

1. **JSON Validation**
   - Checks all modified JSON files in the PR to ensure they are valid
   - Fails the workflow and adds a comment if any JSON file is invalid

2. **Auto-Label Application**
   - Automatically adds the `auto-merge` label to PRs that only contain content changes
   - Adds a comment explaining that the PR will be auto-merged
   - Skips this step if the PR already has the `auto-merge` label

3. **Eligibility Check**
   - Determines if a PR is eligible for auto-merging based on:
     - Having the `auto-merge` label, OR
     - Only containing changes to content data files AND NOT having the `dev` label
   - PRs with the `dev` label are always excluded from auto-merge, regardless of content changes

4. **Auto-Merge Process**
   - Adds a comment to the PR explaining the auto-merge
   - Squash merges the PR with an appropriate commit message
   - Deletes the branch if it belongs to the same repository (not a fork)

## Usage for Contributors

### For Regular Content Contributors

If you're submitting content changes (comments, votes, posts):
1. Create a PR that only modifies content files
2. The workflow will automatically validate your JSON files
3. The `auto-merge` label will be automatically added to eligible PRs
4. If valid, the PR will be auto-merged and the branch deleted

### For Repository Maintainers

To force auto-merge for any PR:
1. Add the `auto-merge` label to the PR manually
2. The workflow will process the PR as a content-only PR

### Label Management

- The `auto-merge` label is automatically added to PRs that only modify content files
- You don't need to add the label manually for content-only PRs
- The workflow will inform you with a comment when it adds the label
- Add the `dev` label to PRs that should NOT be auto-merged, even if they only contain content changes
- The `dev` label takes precedence over content-only criteria and prevents auto-merging

## Customization

The workflow can be customized by modifying `.github/workflows/auto-merge-content-prs.yml`:
- Add more file paths to the trigger conditions
- Adjust the auto-merge criteria
- Change the merge method (currently set to `squash`)

## Troubleshooting

If the auto-merge fails:
1. Check the workflow logs for error messages
2. Ensure your JSON files are formatted correctly
3. Make sure your PR only contains content changes
4. For urgent merges, add the `auto-merge` label
