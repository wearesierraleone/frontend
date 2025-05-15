# Flask Submission Bot API Reference

This document outlines the API endpoints available in the Flask Submission Bot running at https://flask-submission-bot.onrender.com.

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
