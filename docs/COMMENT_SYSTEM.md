# Comment and Reply System Architecture

The We Are Sierra Leone platform implements a modular, maintainable comment and reply system that supports multi-level nested discussions. This document outlines the architecture and implementation details.

## System Components

The comment and reply system consists of three main components:

### 1. Post Loader (`post-loader.js`)

This component is responsible for:
- Loading and displaying post content
- Loading comment data for a post via `loadPostComments()`
- Rendering the initial comment list
- Handling the main comment form submission
- Setting up event handlers for comment-related UI elements

### 2. Reply Handler (`reply-handler.js`)

This dedicated module handles all reply functionality:
- Showing/hiding reply forms via `showReplyForm()` and `hideReplyForm()`
- Submitting replies through `submitReply()`
- Rendering nested replies with `renderReplies()`
- Flagging comments or replies with `flagComment()`
- Helper functions for finding and modifying nested comments

### 3. Data Service Integration

Both components integrate with `data_service.js` for data operations:
- Loading comments with `loadComments()`
- Submitting comments and replies with `submitComment()`
- Error handling and fallbacks

## Data Structure

Comments are stored with this structure:
```json
{
  "id": "comment-1234567890",
  "postId": "post123",
  "anonId": "anon-12345",
  "text": "This is a comment",
  "timestamp": "2025-05-18T10:30:00.000Z",
  "status": "approved",
  "replies": [
    {
      "id": "reply-9876543210",
      "parentId": "comment-1234567890",
      "author": "anon-67890",
      "text": "This is a reply",
      "timestamp": "2025-05-18T10:35:00.000Z",
      "status": "approved",
      "replies": []
    }
  ]
}
```

## Comment Status System

Comments and replies follow a post-moderation approach:
- All new comments and replies are created with status="approved" by default
- Comments can be flagged by users via the `flagComment()` function, changing status to "flagged"
- Moderators can manually change the status to "rejected" via the admin interface
- Only comments with status other than "rejected" are displayed to users

## Implementation Details

### Comment Loading and Rendering

1. `loadPostComments()` in `post-loader.js` fetches all comments for a post
2. Comments are filtered (removing rejected ones) and sorted by timestamp
3. Each comment is rendered with its HTML structure including reply button
4. For each comment with replies, the `renderReplies()` function is called

### Reply Functionality

1. When a user clicks the "Reply" button, `showReplyForm()` displays the reply form
2. When submitted, `submitReply()` creates a new reply object and finds the parent comment
3. The reply is added to the parent's replies array and saved via the data service
4. After successful saving, the comment list is refreshed to show the new reply

### Key Functions

- `showReplyForm(commentId)`: Shows the reply form for the specified comment
- `hideReplyForm(commentId)`: Hides the reply form
- `submitReply(postId, parentCommentId)`: Creates and saves a new reply
- `findAndAddReply(commentList, targetId, newReply)`: Recursively finds the target comment and adds the reply
- `flagComment(postId, commentId)`: Flags a comment or reply for moderation
- `renderReplies(comment, postId)`: Renders the HTML for a comment's nested replies

## Usage Examples

### Adding Reply Functionality to a New Element

```javascript
// 1. Add the reply button to your HTML
<button onclick="showReplyForm('${comment.id}')">Reply</button>

// 2. Add the reply form container
<div id="reply-form-${comment.id}" class="hidden">
  <textarea id="reply-text-${comment.id}"></textarea>
  <button onclick="submitReply('${postId}', '${comment.id}')">Submit</button>
  <button onclick="hideReplyForm('${comment.id}')">Cancel</button>
</div>

// 3. If the comment has replies, render them
${comment.replies && comment.replies.length > 0 ? 
  renderReplies(comment, postId) : ''}
```

## Extending the System

To add new functionality to the comment system:

1. For reply-specific features, modify `reply-handler.js`
2. For comment loading or initial rendering, modify `post-loader.js`
3. Ensure any new comment or reply objects include all required fields, especially `status: "approved"`
4. Update the appropriate documentation when making significant changes
