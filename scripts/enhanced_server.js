/**
 * Enhanced Local Development Server with API Support
 * 
 * This server provides endpoints for:
 * - Saving posts
 * - Updating comments
 * - Managing comment status
 * - Adding new comments
 * - Creating petitions
 * 
 * Updated to support both old and new data structures:
 * - Old: Single aggregated files (approved.json, comments.json, etc.)
 * - New: Per-post file structure (posts/post-123.json, comments/post-123/, etc.)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const net = require('net');

// Will try these ports in order until we find an available one
const PORT_LIST = [5500, 5501, 5502, 5503, 8080, 8081, 3000];
let PORT = process.env.PORT || PORT_LIST[0];
const ROOT_DIR = process.cwd();

// Data directories for the new structure
const DATA_DIRS = {
  posts: path.join(ROOT_DIR, 'data', 'posts'),
  comments: path.join(ROOT_DIR, 'data', 'comments'),
  votes: path.join(ROOT_DIR, 'data', 'votes'),
  upvotes: path.join(ROOT_DIR, 'data', 'upvotes'),
  downvotes: path.join(ROOT_DIR, 'data', 'downvotes'),
  petitions: path.join(ROOT_DIR, 'data', 'petitions'),
  signatures: path.join(ROOT_DIR, 'data', 'signatures'),
  reports: path.join(ROOT_DIR, 'data', 'reports')
};

// Create directories if they don't exist
Object.values(DATA_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Function to check if a port is available
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Find an available port from our list
async function findAvailablePort() {
  // First try the default port
  if (await checkPortAvailable(PORT)) {
    return PORT;
  }
  
  // If default port is not available, try others in the list
  for (const port of PORT_LIST) {
    if (await checkPortAvailable(port)) {
      console.log(`Port ${PORT} is in use, using port ${port} instead`);
      return port;
    }
  }
  
  // If all preferred ports are in use, let the OS find a random available port
  console.log(`All preferred ports are in use, letting OS choose a port`);
  return 0;
}

// Define MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Get the request path
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  // Handle API endpoints
  if (req.method === 'POST') {
    if (pathname === '/save-post') {
      handleSavePost(req, res);
      return;
    } else if (pathname === '/update-comments') {
      handleUpdateComments(req, res);
      return;
    } else if (pathname === '/update-comment') {
      handleUpdateCommentStatus(req, res);
      return;
    } else if (pathname === '/comment') {
      handleAddComment(req, res);
      return;
    } else if (pathname === '/create-petition') {
      handleCreatePetition(req, res);
      return;
    }
  }
  
  // Handle static file requests
  serveStaticFile(pathname, res);
});

// Start the server with an available port
async function startServer() {
  // Find an available port
  const availablePort = await findAvailablePort();
  
  server.listen(availablePort, () => {
    console.log(`\n✅ Server running at http://localhost:${availablePort}/`);
    console.log(`✅ API endpoints available: POST /save-post, /update-comments, /update-comment, /comment, /create-petition\n`);
  });
}

// Function to handle POST /save-post endpoint
function handleSavePost(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const post = data.post;
      const allPosts = data.allPosts;
      
      // Check if post data is valid
      if (!post || !post.id || !post.title || !post.body) {
        sendJsonResponse(res, 400, { success: false, error: 'Invalid post data' });
        return;
      }
      
      // Write to the new structure - individual post file
      const postFilePath = path.join(DATA_DIRS.posts, `post-${post.id}.json`);
      
      fs.writeFile(postFilePath, JSON.stringify(post, null, 2), async err => {
        if (err) {
          console.error(`Error writing to ${postFilePath}:`, err);
          sendJsonResponse(res, 500, { success: false, error: 'Failed to save post in new structure' });
          return;
        }
        
        // Update the posts index if the post is approved
        if (post.status === 'approved') {
          const indexPath = path.join(DATA_DIRS.posts, 'index.json');
          let index = { files: [] };
          
          // Read existing index if it exists
          try {
            if (fs.existsSync(indexPath)) {
              const indexData = fs.readFileSync(indexPath, 'utf-8');
              index = JSON.parse(indexData);
            }
            
            // Check if this post is already in the index
            const postFileName = `post-${post.id}.json`;
            if (!index.files.includes(postFileName)) {
              index.files.push(postFileName);
            }
            
            // Write updated index
            fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
          } catch (indexErr) {
            console.error('Error updating posts index:', indexErr);
            // Continue anyway, as the post file was saved successfully
          }
        }
        
        // Also write to the legacy structure for backward compatibility
        fs.writeFile(
          path.join(ROOT_DIR, 'data', 'approved.json'),
          JSON.stringify(allPosts, null, 2),
          legacyErr => {
            if (legacyErr) {
              console.error('Error writing to approved.json:', legacyErr);
              // Continue anyway as we've already saved to the new structure
            }
            
            sendJsonResponse(res, 200, { 
              success: true, 
              message: 'Post saved successfully',
              postId: post.id
            });
            
            console.log(`✅ New post saved: ${post.title} (ID: ${post.id})`);
          }
        );
      });
    } catch (error) {
      console.error('Error processing post data:', error);
      sendJsonResponse(res, 400, { success: false, error: 'Invalid JSON' });
    }
  });
}

// Function to handle POST /update-comments endpoint
function handleUpdateComments(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { postId, comments } = data;
      
      // Check if necessary data is provided
      if (!postId || !comments) {
        sendJsonResponse(res, 400, { success: false, error: 'Missing postId or comments data' });
        return;
      }
      
      // Create the post's comment directory
      const postCommentsDir = path.join(DATA_DIRS.comments, postId);
      if (!fs.existsSync(postCommentsDir)) {
        fs.mkdirSync(postCommentsDir, { recursive: true });
      }
      
      // Create an index for these comments
      const commentIndex = { files: [] };
      
      // Save each comment to its own file
      if (Array.isArray(comments)) {
        comments.forEach(comment => {
          if (comment && comment.id) {
            const commentFileName = `comment-${comment.id}.json`;
            const commentPath = path.join(postCommentsDir, commentFileName);
            
            fs.writeFileSync(commentPath, JSON.stringify(comment, null, 2));
            commentIndex.files.push(commentFileName);
          }
        });
      }
      
      // Save the comment index
      fs.writeFile(
        path.join(postCommentsDir, 'index.json'),
        JSON.stringify(commentIndex, null, 2),
        indexErr => {
          if (indexErr) {
            console.error(`Error writing comment index for post ${postId}:`, indexErr);
            // Continue anyway as we'll save the complete comments file
          }
          
          // Also save all comments in a single file for that post
          fs.writeFile(
            path.join(DATA_DIRS.comments, `${postId}.json`),
            JSON.stringify(comments, null, 2),
            newErr => {
              if (newErr) {
                console.error(`Error writing to ${postId}.json:`, newErr);
                // Continue anyway as we'll try to update the legacy file
              }
              
              // Read the legacy comments file for backward compatibility
              fs.readFile(path.join(ROOT_DIR, 'data', 'comments.json'), 'utf-8', (readErr, commentsData) => {
                if (readErr && readErr.code !== 'ENOENT') {
                  console.error('Error reading comments.json:', readErr);
                  sendJsonResponse(res, 500, { success: false, error: 'Failed to update comments' });
                  return;
                }
                
                // Parse existing comments or create a new object
                let allComments = {};
                try {
                  allComments = commentsData ? JSON.parse(commentsData) : {};
                } catch (parseErr) {
                  console.error('Error parsing comments.json:', parseErr);
                  allComments = {};
                }
                
                // Update comments for the specific post
                allComments[postId] = comments;
                
                // Write the updated comments back to the legacy file
                fs.writeFile(
                  path.join(ROOT_DIR, 'data', 'comments.json'),
                  JSON.stringify(allComments, null, 2),
                  writeErr => {
                    if (writeErr) {
                      console.error('Error writing to comments.json:', writeErr);
                      // We've already saved to the new structure, so continue
                    }
                    
                    sendJsonResponse(res, 200, { success: true, message: 'Comments updated successfully' });
                    console.log(`✅ Comments updated for post: ${postId}`);
                  }
                );
              });
            }
          );
        }
      );
    } catch (error) {
      console.error('Error processing comments data:', error);
      sendJsonResponse(res, 400, { success: false, error: 'Invalid JSON' });
    }
  });
}

// Function to handle POST /update-comment endpoint - for updating a single comment status
function handleUpdateCommentStatus(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { postId, commentId, status } = data;
      
      // Check if necessary data is provided
      if (!postId || !commentId || !status) {
        sendJsonResponse(res, 400, { success: false, error: 'Missing required fields' });
        return;
      }
      
      // First try to update in the new structure
      const postCommentsDir = path.join(DATA_DIRS.comments, postId);
      
      // Check if the directory exists
      if (!fs.existsSync(postCommentsDir)) {
        console.log(`Comments directory for post ${postId} not found in new structure, falling back to legacy`);
      } else {
        // Try to find the comment file
        const files = fs.readdirSync(postCommentsDir);
        const commentFileName = files.find(file => file.includes(`-${commentId}.json`));
        
        if (commentFileName) {
          const commentPath = path.join(postCommentsDir, commentFileName);
          const commentData = JSON.parse(fs.readFileSync(commentPath, 'utf-8'));
          
          // Update the comment status
          commentData.status = status;
          
          // Write it back
          fs.writeFileSync(commentPath, JSON.stringify(commentData, null, 2));
          console.log(`✅ Updated comment ${commentId} status to ${status} in new structure`);
        }
      }
      
      // Also update in the combined file for this post
      const combinedCommentsPath = path.join(DATA_DIRS.comments, `${postId}.json`);
      
      // Check if the combined file exists
      if (fs.existsSync(combinedCommentsPath)) {
        try {
          const commentsData = JSON.parse(fs.readFileSync(combinedCommentsPath, 'utf-8'));
          
          // Function to recursively find and update a comment status
          function updateCommentStatus(comments, targetId) {
            for (const comment of comments) {
              if (comment.id === targetId) {
                comment.status = status;
                return true;
              }
              
              if (comment.replies && comment.replies.length > 0) {
                const found = updateCommentStatus(comment.replies, targetId);
                if (found) return true;
              }
            }
            return false;
          }
          
          // Try to update the comment status
          const updated = updateCommentStatus(commentsData, commentId);
          
          if (updated) {
            fs.writeFileSync(combinedCommentsPath, JSON.stringify(commentsData, null, 2));
            console.log(`✅ Updated comment ${commentId} status to ${status} in combined file`);
          }
        } catch (err) {
          console.error(`Error updating comment in combined file:`, err);
        }
      }
      
      // Update in the legacy structure as well
      fs.readFile(path.join(ROOT_DIR, 'data', 'comments.json'), 'utf-8', (readErr, commentsData) => {
        if (readErr) {
          console.error('Error reading comments.json:', readErr);
          if (fs.existsSync(path.join(DATA_DIRS.comments, `${postId}.json`))) {
            // We've already updated in the new structure, so return success
            sendJsonResponse(res, 200, { success: true, message: `Comment ${status} successfully` });
          } else {
            sendJsonResponse(res, 500, { success: false, error: 'Failed to read comments file' });
          }
          return;
        }
        
        // Parse existing comments
        let allComments;
        try {
          allComments = JSON.parse(commentsData);
        } catch (parseErr) {
          console.error('Error parsing comments.json:', parseErr);
          if (fs.existsSync(path.join(DATA_DIRS.comments, `${postId}.json`))) {
            // We've already updated in the new structure, so return success
            sendJsonResponse(res, 200, { success: true, message: `Comment ${status} successfully` });
          } else {
            sendJsonResponse(res, 500, { success: false, error: 'Failed to parse comments file' });
          }
          return;
        }
        
        // Check if the post exists
        if (!allComments[postId]) {
          if (fs.existsSync(path.join(DATA_DIRS.comments, `${postId}.json`))) {
            // We've already updated in the new structure, so return success
            sendJsonResponse(res, 200, { success: true, message: `Comment ${status} successfully` });
          } else {
            sendJsonResponse(res, 404, { success: false, error: 'Post not found' });
          }
          return;
        }
        
        // Function to recursively find and update a comment status
        function updateCommentStatus(comments, targetId) {
          for (const comment of comments) {
            if (comment.id === targetId) {
              comment.status = status;
              return true;
            }
            
            if (comment.replies && comment.replies.length > 0) {
              const found = updateCommentStatus(comment.replies, targetId);
              if (found) return true;
            }
          }
          return false;
        }
        
        // Try to update the comment status
        const updated = updateCommentStatus(allComments[postId], commentId);
        
        if (!updated) {
          if (fs.existsSync(path.join(DATA_DIRS.comments, `${postId}.json`))) {
            // We've already updated in the new structure, so return success
            sendJsonResponse(res, 200, { success: true, message: `Comment ${status} successfully` });
          } else {
            sendJsonResponse(res, 404, { success: false, error: 'Comment not found' });
          }
          return;
        }
        
        // Write the updated comments back to the file
        fs.writeFile(
          path.join(ROOT_DIR, 'data', 'comments.json'),
          JSON.stringify(allComments, null, 2),
          writeErr => {
            if (writeErr) {
              console.error('Error writing to comments.json:', writeErr);
              if (fs.existsSync(path.join(DATA_DIRS.comments, `${postId}.json`))) {
                // We've already updated in the new structure, so return success
                sendJsonResponse(res, 200, { success: true, message: `Comment ${status} successfully` });
              } else {
                sendJsonResponse(res, 500, { success: false, error: 'Failed to update comment status' });
              }
              return;
            }
            
            sendJsonResponse(res, 200, { success: true, message: `Comment ${status} successfully` });
            console.log(`✅ Comment ${commentId} marked as ${status} in legacy structure`);
          }
        );
      });
    } catch (error) {
      console.error('Error processing comment status update:', error);
      sendJsonResponse(res, 400, { success: false, error: 'Invalid JSON' });
    }
  });
}

// Function to handle POST /comment endpoint - for adding a new comment
function handleAddComment(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const comment = JSON.parse(body);
      
      // Check if necessary data is provided
      if (!comment.postId || !comment.text) {
        sendJsonResponse(res, 400, { success: false, error: 'Missing required fields' });
        return;
      }
      
      // Generate an ID for the new comment if not provided
      if (!comment.id) {
        comment.id = `comment${Date.now()}`;
      }
      
      // Ensure post comments directory exists
      const postCommentsDir = path.join(DATA_DIRS.comments, comment.postId);
      if (!fs.existsSync(postCommentsDir)) {
        fs.mkdirSync(postCommentsDir, { recursive: true });
      }
      
      // Save the comment to its own file in the new structure
      const commentFileName = `comment-${comment.id}.json`;
      fs.writeFile(
        path.join(postCommentsDir, commentFileName),
        JSON.stringify(comment, null, 2),
        newErr => {
          if (newErr) {
            console.error(`Error writing to ${commentFileName}:`, newErr);
            // Continue to try saving in other formats
          } else {
            console.log(`✅ New comment saved to ${commentFileName}`);
            
            // Update the comment index
            const indexPath = path.join(postCommentsDir, 'index.json');
            try {
              let index = { files: [] };
              if (fs.existsSync(indexPath)) {
                index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
              }
              
              if (!index.files.includes(commentFileName)) {
                index.files.push(commentFileName);
              }
              
              fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
            } catch (indexErr) {
              console.error('Error updating comment index:', indexErr);
            }
          }
          
          // Update the combined comments file for this post
          const combinedPath = path.join(DATA_DIRS.comments, `${comment.postId}.json`);
          try {
            let comments = [];
            if (fs.existsSync(combinedPath)) {
              comments = JSON.parse(fs.readFileSync(combinedPath, 'utf-8'));
            }
            
            comments.push(comment);
            fs.writeFileSync(combinedPath, JSON.stringify(comments, null, 2));
          } catch (combinedErr) {
            console.error('Error updating combined comments file:', combinedErr);
          }
          
          // Update the legacy comments.json file
          fs.readFile(path.join(ROOT_DIR, 'data', 'comments.json'), 'utf-8', (readErr, commentsData) => {
            if (readErr && readErr.code !== 'ENOENT') {
              console.error('Error reading comments.json:', readErr);
              // If we successfully saved in the new structure, return success
              if (!newErr) {
                sendJsonResponse(res, 200, { success: true, message: 'Comment added successfully', commentId: comment.id });
                return;
              }
              sendJsonResponse(res, 500, { success: false, error: 'Failed to read comments file' });
              return;
            }
            
            // Parse existing comments or create a new object
            let allComments = {};
            try {
              allComments = commentsData ? JSON.parse(commentsData) : {};
            } catch (parseErr) {
              console.error('Error parsing comments.json:', parseErr);
              // If we successfully saved in the new structure, return success
              if (!newErr) {
                sendJsonResponse(res, 200, { success: true, message: 'Comment added successfully', commentId: comment.id });
                return;
              }
              // If file exists but is corrupt, create a new file
              allComments = {};
            }
            
            // Initialize array for this post if it doesn't exist
            if (!allComments[comment.postId]) {
              allComments[comment.postId] = [];
            }
            
            // Add the new comment
            allComments[comment.postId].push(comment);
            
            // Write the updated comments back to the file
            fs.writeFile(
              path.join(ROOT_DIR, 'data', 'comments.json'),
              JSON.stringify(allComments, null, 2),
              writeErr => {
                if (writeErr) {
                  console.error('Error writing to comments.json:', writeErr);
                  // If we successfully saved in the new structure, return success
                  if (!newErr) {
                    sendJsonResponse(res, 200, { success: true, message: 'Comment added successfully', commentId: comment.id });
                    return;
                  }
                  sendJsonResponse(res, 500, { success: false, error: 'Failed to save comment' });
                  return;
                }
                
                sendJsonResponse(res, 200, { success: true, message: 'Comment added successfully', commentId: comment.id });
                console.log(`✅ New comment added to post ${comment.postId} in legacy structure`);
              }
            );
          });
        }
      );
    } catch (error) {
      console.error('Error processing comment data:', error);
      sendJsonResponse(res, 400, { success: false, error: 'Invalid JSON' });
    }
  });
}

// Function to handle POST /create-petition endpoint
function handleCreatePetition(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { postId, petition, timestamp } = data;
      
      // Validate petition data
      if (!postId || !petition || !petition.id || !petition.title || !petition.goal || !petition.deadline) {
        console.error('Invalid petition data received:', data);
        sendJsonResponse(res, 400, { success: false, error: 'Invalid petition data' });
        return;
      }
      
      // Save petition to new structure
      fs.writeFile(
        path.join(DATA_DIRS.petitions, `${postId}.json`),
        JSON.stringify(petition, null, 2),
        newErr => {
          if (newErr) {
            console.error(`Error writing petition to new structure:`, newErr);
            // Continue to try legacy structure
          } else {
            console.log(`✅ Petition saved to new structure for post ${postId}`);
            
            // Create empty signatures file
            fs.writeFile(
              path.join(DATA_DIRS.signatures, `${postId}.json`),
              JSON.stringify(petition.signatures || [], null, 2),
              sigErr => {
                if (sigErr) {
                  console.error(`Error creating signatures file:`, sigErr);
                }
              }
            );
          }
          
          // Read the existing petitions from legacy structure
          fs.readFile(path.join(ROOT_DIR, 'data', 'petitions.json'), (err, fileData) => {
            let petitions = {};
            
            if (!err) {
              try {
                petitions = JSON.parse(fileData);
              } catch (parseErr) {
                console.error('Error parsing petitions.json:', parseErr);
              }
            }
            
            // Add the new petition
            petitions[postId] = petition;
            
            // Write the updated petitions back to file
            fs.writeFile(
              path.join(ROOT_DIR, 'data', 'petitions.json'),
              JSON.stringify(petitions, null, 2),
              writeErr => {
                if (writeErr) {
                  console.error('Error writing to petitions.json:', writeErr);
                  // If we successfully saved in the new structure, return success
                  if (!newErr) {
                    sendJsonResponse(res, 200, { 
                      success: true, 
                      message: 'Petition created successfully', 
                      petitionId: petition.id,
                      postId: postId
                    });
                    return;
                  }
                  sendJsonResponse(res, 500, { success: false, error: 'Failed to save petition' });
                  return;
                }
                
                sendJsonResponse(res, 200, { 
                  success: true, 
                  message: 'Petition created successfully', 
                  petitionId: petition.id,
                  postId: postId
                });
                console.log(`✅ New petition created for post ${postId} with ID ${petition.id}`);
              }
            );
          });
        }
      );
    } catch (error) {
      console.error('Error processing petition data:', error);
      sendJsonResponse(res, 400, { success: false, error: 'Invalid JSON' });
    }
  });
}

// Function to serve a static file
function serveStaticFile(pathname, res) {
  // If pathname is '/', serve index.html
  const filePath = path.join(
    ROOT_DIR,
    pathname === '/' ? 'index.html' : pathname.substring(1)
  );
  
  // Read the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // Server error
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    // Get the file extension and MIME type
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Send the file
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// Helper function to send a JSON response
function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Start the server
startServer();
