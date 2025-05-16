# GitHub Pages Local Storage Mode Guide

This document explains how the We Are Sierra Leone civic platform works when deployed on GitHub Pages.

## Overview

When deployed on GitHub Pages, the website operates in "Local Storage Mode" which means:

1. All form submissions (posts, comments, votes) are saved to your browser's localStorage
2. Data is fetched from the main backend repository's JSON files
3. Locally created content is combined with remote content for a seamless experience

## How It Works

### Data Loading

When you visit the site, it:
1. Attempts to load data from the backend repository via `raw.githubusercontent.com`
2. Combines this with any locally created content from your browser's localStorage
3. Falls back to cached data if the remote data can't be loaded
4. Uses default empty values as a last resort

### Form Submissions

When you submit a form (post, comment, vote):
1. The data is saved to localStorage in your browser
2. It's organized in collections (posts, comments, votes)
3. Your submissions will appear alongside the remote content
4. Other users won't see your submissions unless they're approved and added to the backend repository

## Technical Details

### Storage Collections

The site uses these localStorage collections:
- `collection_posts` - Submitted posts
- `collection_comments` - Submitted comments
- `collection_votes` - Votes on posts
- Various cache entries with prefix `cache_`

### Persistence

- Your local submissions will persist across visits as long as you:
  - Use the same browser
  - Don't clear your browser data/localStorage
- If you want to share content with others, it must be submitted to the backend repository maintainers

## GitHub Token Authentication

If the backend repository is private, authentication is needed to access data files.

### Authentication Methods

There are two ways the platform handles GitHub authentication for private repositories:

#### 1. Automated (GitHub Actions)

For official deployments using GitHub Actions:

1. A GitHub token is stored as a repository secret called `DATA_TOKEN`
2. The GitHub Actions workflow automatically injects this token during deployment
3. Users can access the site without needing to provide their own token
4. This is the recommended approach for production deployments

To set up automated authentication:

1. Go to your repository's Settings > Secrets and variables > Actions
2. Add a new repository secret named `DATA_TOKEN`
3. Set its value to a GitHub Personal Access Token with `repo` scope
4. Deploy using the GitHub Actions workflow in `.github/workflows/deploy-github-pages.yml`

#### 2. Manual (Session Storage)

For development or situations where GitHub Actions can't be used:

1. When you first visit the site, it attempts to load data from the GitHub repository
2. If authentication fails, a dialog will appear prompting for a GitHub Personal Access Token
3. After entering a valid token, data will load normally
4. The token is stored in session storage and cleared when the browser tab is closed

### Setting Up a Manual GitHub Token

1. **Create a Token**:
   - Go to [GitHub Settings > Developer Settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token"
   - Give it a descriptive name (e.g., "We Are Sierra Leone Data Access")
   - Select the "repo" scope (needed to access private repository content)
   - Click "Generate token"
   - **IMPORTANT**: Copy the token immediately - GitHub only shows it once!

2. **Security Considerations**:
   - Your token is stored only in your browser's **session storage** (not localStorage)
   - It will be cleared when you close your browser tab
   - Don't share your token with others
   - Create tokens with expiration dates for better security

3. **Managing Your Token**:
   - Visit the `diagnostics.html` page to manage your token and test connections
   - You can set or clear your token manually
   - The token is only needed for data access, not for submitting content

### Troubleshooting Token Issues

If you encounter data loading issues:

1. Check if you're accessing a private repository (ask the administrator)
2. Visit `diagnostics.html` to run API connection tests
3. Verify your token has the correct permissions (needs "repo" scope)
4. Try generating a new token if the current one has expired

## Troubleshooting

If you encounter issues:

1. Check the browser console (F12 or right-click > Inspect > Console)
2. Look for any error messages related to data loading or saving
3. Try clearing browser cache (but not localStorage) if remote data won't load
4. If all else fails, you can clear localStorage and reload for a fresh start
