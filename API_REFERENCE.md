# Flask Submission Bot API Reference

This document outlines the API endpoints available in the Flask Submission Bot running at https://flask-submission-bot.onrender.com and explains how data is fetched from the GitHub repository.

## Architecture Overview

The We Are Sierra Leone platform uses a dual-API approach:

1. **Flask Submission Bot API** (https://flask-submission-bot.onrender.com)
   - Handles form submissions (posts, comments, votes)
   - Moderates user-generated content
   - Provides a secure backend for data processing

2. **GitHub Repository API** (https://raw.githubusercontent.com/wearesierraleone/wearesalone)
   - Stores approved data as JSON files
   - Serves as the primary data source
   - Requires token authentication if the repository is private

## Authentication

### GitHub Token Authentication

To access data from a private GitHub repository, a Personal Access Token is required:

1. The frontend will attempt to fetch data from GitHub raw URLs
2. If a 401/403 error is received, it will prompt for a GitHub token
3. The token is stored in session storage (cleared when the browser tab is closed)
4. All subsequent requests to GitHub append the token as a URL parameter

```javascript
// Example URL with token
https://raw.githubusercontent.com/wearesierraleone/wearesalone/main/data/approved.json?token=YOUR_TOKEN_HERE
```

### Flask API Authentication

The Flask API uses IP-based rate limiting and does not require authentication for basic submissions.

## Endpoints

### POST /submit

Submit a new post for approval.

**Request body:**
```json
{
  "title": "Post title",
  "body": "Post content",
  "category": "Category name",
  "imageUrl": "https://example.com/image.jpg" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post submitted successfully",
  "id": "generated_post_id"
}
```

### POST /comments

Submit a new comment on a post.

**Request body:**
```json
{
  "postId": "post_id",
  "text": "Comment text",
  "anonId": "anonymous_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment submitted successfully",
  "id": "generated_comment_id"
}
```

### POST /votes

Submit a vote on a post.

**Request body:**
```json
{
  "postId": "post_id",
  "type": "vote"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded successfully"
}
```

## Data URLs

The following data files are available at the backend repository:

- Approved posts: https://raw.githubusercontent.com/wearesierraleone/wearesalone/main/data/approved.json
- Comments: https://raw.githubusercontent.com/wearesierraleone/wearesalone/main/data/comments.json
- Votes: https://raw.githubusercontent.com/wearesierraleone/wearesalone/main/data/votes.json
- Petitions: https://raw.githubusercontent.com/wearesierraleone/wearesalone/main/data/petitions.json
- Vote statistics: https://raw.githubusercontent.com/wearesierraleone/wearesalone/main/data/vote_stats.json

## Local Development Testing

For local testing, the API defaults to using localStorage when the server is not available. This allows offline development and testing without needing to connect to the API.
