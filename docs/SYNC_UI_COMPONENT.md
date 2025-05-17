# Sync UI Component for GitHub Pages

This document outlines the implementation of a user interface component that enables users to synchronize their local data with the main GitHub repository when the website is deployed on GitHub Pages.

## Problem Statement

When deployed on GitHub Pages, our civic platform relies on localStorage to store user interactions like posts, comments, and votes. However, these interactions remain local to the user's browser and aren't shared with other users or persisted to the main repository. We needed a way to allow users to contribute their local data to the main repository.

## Solution

We've implemented a sync UI component that:

1. Provides a button in the bottom right corner of the screen when on GitHub Pages
2. Allows users to trigger a GitHub Actions workflow to sync their localStorage data
3. Creates Pull Requests with user contributions for review by repository maintainers

## Technical Implementation

### Components

1. **sync-ui.js**
   - Injects a "Sync Data" button into the page
   - Collects GitHub token from users
   - Shows sync status notifications
   - Only appears on GitHub Pages deployments

2. **local_storage_sync.js (enhanced)**
   - Added improved triggerGitHubSync function
   - Enhanced data collection and organization
   - Added validation and error handling

3. **GitHub Action Workflow**
   - Process incoming localStorage data
   - Updates data files in the repository
   - Creates Pull Requests for review

### User Flow

1. User interacts with the site (creates posts, comments, votes)
2. User clicks "Sync Data" button
3. User provides GitHub token with repo scope
4. System triggers GitHub workflow with localStorage data
5. GitHub Action processes data and creates PR
6. Repository maintainers review and merge changes
7. User gets success notification

## Testing

A testing page is available at `/diagnostics/sync_ui_test.html` that allows you to:

1. Generate sample data in localStorage
2. Test the sync button functionality
3. Monitor the status of sync operations

## Future Enhancements

- Add user attribution options for contributions
- Implement conflict resolution for simultaneous edits
- Add progress indicators for the PR review process
- Create a dashboard for users to track their contributions
