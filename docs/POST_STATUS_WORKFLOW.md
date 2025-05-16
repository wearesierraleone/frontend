# Post Status Workflow

This document explains how post submissions work in the We Are Sierra Leone platform.

## Status Types

Posts can have one of three statuses:

- **pending**: New submissions that haven't been reviewed yet
- **approved**: Submissions that have been reviewed and approved for public display
- **rejected**: Submissions that have been reviewed and rejected

## Submission Flow

1. **User submits a post** from the submit.html page
   - Post is created with status="pending"
   - Post is added directly to approved.json with the pending status

2. **Admin reviews posts** using the admin.html page
   - Admin can see all posts with filtering by status
   - Admin can approve, reject, or unpublish (move back to pending) any post

3. **Public display** on the index.html page
   - Only posts with status="approved" are shown to the public
   - Pending and rejected posts are hidden from the main site

## Technical Implementation

### Post Creation

When a user submits a post:

```javascript
// Submit_post.js
const post = {
  ...formData,
  timestamp: new Date().toISOString(),
  status: 'pending',  // Always set to pending
  id: `post${Date.now()}`  // Generate unique ID
};

// Update the local approved.json file (in development)
// In production, this would be an API call to a backend server
```

### Local Development Post Saving

For local development, we use a Node.js server with an API endpoint to save posts:

1. The submit form sends the post data to the `/save-post` endpoint
2. The server appends the new post to the approved.json file
3. The post is saved with status="pending" and isn't visible on the homepage until approved

### Post Display Filtering

On the index.html page:

```javascript
// Filter posts by status - only show approved posts
let filteredPosts = posts.filter(post => post.status === 'approved');
```

### Admin Page

Admins can:
- Filter by status (pending, approved, rejected)
- Change post status with a single click
- See all posts regardless of status

## Troubleshooting

### Post Not Saving

If posts are not being saved to approved.json, check the following:

1. **Development Environment**: 
   - Make sure you're running the enhanced local server with API support:
   ```
   ./scripts/start_local_server_with_api.sh
   ```
   - The basic server doesn't support saving posts

2. **File Permissions**:
   - Ensure the data directory and approved.json file are writable
   - Check permissions with: `ls -la data/approved.json`

3. **Valid JSON**:
   - Verify approved.json contains valid JSON
   - Run `./scripts/validate_json.sh` to check

### Missing Posts on Homepage

If submitted posts aren't appearing on the homepage:

1. **Post Status**: 
   - Remember that posts with status="pending" won't appear on the homepage
   - Check the admin.html page to see pending posts
   - Use the admin interface to approve posts

2. **Check Browser Console**:
   - Look for any JavaScript errors that might be preventing post loading
   - The diagnostics.js file provides helpful information in the console

3. **Data Loading**:
   - Verify that approved.json is being loaded correctly
   - Try clearing browser cache or using a private/incognito window

## Benefits of This Approach

1. **Simplicity**: One data source, different views based on status
2. **Security**: No public visibility of pending or rejected posts
3. **Moderation**: Clear workflow for content moderation
4. **Performance**: No reliance on complex bot systems or external databases
