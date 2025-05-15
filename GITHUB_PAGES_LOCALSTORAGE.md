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

## Troubleshooting

If you encounter issues:

1. Check the browser console (F12 or right-click > Inspect > Console)
2. Look for any error messages related to data loading or saving
3. Try clearing browser cache (but not localStorage) if remote data won't load
4. If all else fails, you can clear localStorage and reload for a fresh start
