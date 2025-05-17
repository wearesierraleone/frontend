/**
 * Local Storage and Synchronization Utilities
 * Handles storing and syncing user interactions (posts, votes, comments) in GitHub Pages
 */

/**
 * Saves data to a localStorage collection
 * @param {string} collectionName - The name of the collection (posts, votes, etc.)
 * @param {object} item - The item to save
 * @returns {string} The ID of the saved item
 */
function saveToCollection(collectionName, item) {
  try {
    // Ensure the item has an ID
    if (!item.id) {
      item.id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Ensure timestamp exists
    if (!item._timestamp) {
      item._timestamp = new Date().toISOString();
    }
    
    // Get the existing collection or create a new one
    const existingData = localStorage.getItem(`collection_${collectionName}`) || '[]';
    const collection = JSON.parse(existingData);
    
    // Add the new item
    collection.push(item);
    
    // Save back to localStorage
    localStorage.setItem(`collection_${collectionName}`, JSON.stringify(collection));
    
    console.log(`Item saved to ${collectionName} collection:`, item);
    return item.id;
  } catch (e) {
    console.error(`Error saving to ${collectionName} collection:`, e);
    return null;
  }
}

/**
 * Save a post to localStorage
 * @param {object} post - The post object to save
 * @returns {string|null} The ID of the saved post or null on error
 */
function savePostLocally(post) {
  // Add some additional metadata needed for posts
  post.status = post.status || 'pending';
  post.votes = post.votes || { up: 0, down: 0 };
  post.comments = post.comments || [];
  
  return saveToCollection('posts', post);
}

/**
 * Save a vote to localStorage for the current post
 * @param {object} vote - The vote object to save
 * @returns {string|null} The ID of the saved vote or null on error
 */
function saveVoteLocally(vote) {
  try {
    // Save to votes collection
    const voteId = saveToCollection('votes', vote);
    
    // Mark that the user has voted on this post
    localStorage.setItem(`voted-${vote.postId}`, 'true');
    
    // Update the post's vote count if possible
    try {
      updatePostVoteCount(vote.postId, vote.type);
    } catch (countError) {
      console.warn('Could not update post vote count:', countError);
    }
    
    return voteId;
  } catch (e) {
    console.error('Error saving vote locally:', e);
    return null;
  }
}

/**
 * Update the vote count for a post in the local collection
 * @param {string} postId - The ID of the post to update
 * @param {string} voteType - "up" for upvote, "down" for downvote
 */
function updatePostVoteCount(postId, voteType) {
  // Get posts collection
  const postsData = localStorage.getItem('collection_posts') || '[]';
  const posts = JSON.parse(postsData);
  
  // Find the post
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) return;
  
  // Update vote count
  if (!posts[postIndex].votes) {
    posts[postIndex].votes = { up: 0, down: 0 };
  }
  
  posts[postIndex].votes[voteType]++;
  
  // Save back to localStorage
  localStorage.setItem('collection_posts', JSON.stringify(posts));
}

/**
 * Save a comment to localStorage for a post
 * @param {object} comment - The comment object
 * @returns {string|null} The ID of the saved comment or null on error
 */
function saveCommentLocally(comment) {
  try {
    // Save to comments collection
    const commentId = saveToCollection('comments', comment);
    
    // Update the post's comments if possible
    try {
      const postsData = localStorage.getItem('collection_posts') || '[]';
      const posts = JSON.parse(postsData);
      
      // Find the post
      const postIndex = posts.findIndex(p => p.id === comment.postId);
      if (postIndex !== -1) {
        // Add comment reference to the post
        if (!posts[postIndex].comments) {
          posts[postIndex].comments = [];
        }
        posts[postIndex].comments.push(commentId);
        
        // Save back to localStorage
        localStorage.setItem('collection_posts', JSON.stringify(posts));
      }
    } catch (postError) {
      console.warn('Could not update post with comment:', postError);
    }
    
    return commentId;
  } catch (e) {
    console.error('Error saving comment locally:', e);
    return null;
  }
}

/**
 * Get all posts from local storage
 * @returns {Array} Array of posts
 */
function getLocalPosts() {
  try {
    const postsData = localStorage.getItem('collection_posts') || '[]';
    return JSON.parse(postsData).sort((a, b) => {
      return new Date(b._timestamp) - new Date(a._timestamp);
    });
  } catch (e) {
    console.error('Error retrieving local posts:', e);
    return [];
  }
}

/**
 * Get a single post by ID
 * @param {string} postId - The ID of the post to get
 * @returns {object|null} The post object or null if not found
 */
function getLocalPost(postId) {
  try {
    const posts = getLocalPosts();
    return posts.find(post => post.id === postId) || null;
  } catch (e) {
    console.error('Error retrieving local post:', e);
    return null;
  }
}

/**
 * Get comments for a post from local storage
 * @param {string} postId - The ID of the post
 * @returns {Array} Array of comments
 */
function getLocalComments(postId) {
  try {
    const commentsData = localStorage.getItem('collection_comments') || '[]';
    return JSON.parse(commentsData)
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(b._timestamp) - new Date(a._timestamp));
  } catch (e) {
    console.error('Error retrieving local comments:', e);
    return [];
  }
}

/**
 * Get vote statistics for a post
 * @param {string} postId - The ID of the post
 * @returns {object} Vote statistics with up and down counts
 */
function getLocalVoteStats(postId) {
  try {
    const votesData = localStorage.getItem('collection_votes') || '[]';
    const votes = JSON.parse(votesData).filter(vote => vote.postId === postId);
    
    // Count votes
    const stats = { up: 0, down: 0 };
    votes.forEach(vote => {
      if (vote.type === 'up' || vote.type === 'upvote') stats.up++;
      if (vote.type === 'down' || vote.type === 'downvote') stats.down++;
    });
    
    return stats;
  } catch (e) {
    console.error('Error calculating local vote stats:', e);
    return { up: 0, down: 0 };
  }
}

/**
 * Check if the current user has voted on a post
 * @param {string} postId - The ID of the post
 * @returns {boolean} True if the user has voted, false otherwise
 */
function hasUserVotedLocally(postId) {
  return localStorage.getItem(`voted-${postId}`) === 'true';
}

/**
 * Combines local posts with fetched posts
 * @param {Array} fetchedPosts - Posts fetched from the API
 * @returns {Array} Combined list of posts with duplicates removed
 */
function combineWithLocalPosts(fetchedPosts) {
  try {
    const localPosts = getLocalPosts();
    
    // Skip if we have no local posts
    if (localPosts.length === 0) return fetchedPosts;
    
    // Create a merged array with no duplicates
    const mergedPosts = [...fetchedPosts];
    
    // Add local posts that aren't in the fetched posts
    localPosts.forEach(localPost => {
      const isDuplicate = fetchedPosts.some(post => 
        post.id === localPost.id || 
        (post.title === localPost.title && post.body === localPost.body)
      );
      
      if (!isDuplicate) {
        mergedPosts.push(localPost);
      }
    });
    
    // Sort by timestamp, newest first
    return mergedPosts.sort((a, b) => 
      new Date(b._timestamp || b.timestamp) - new Date(a._timestamp || a.timestamp)
    );
  } catch (e) {
    console.error('Error combining posts:', e);
    return fetchedPosts;
  }
}

/**
 * Get local votes for a specific post
 * @param {string} postId - The ID of the post
 * @returns {object} - Object containing upvotes and downvotes counts
 */
function getLocalVotes(postId) {
  try {
    let upvotes = 0;
    let downvotes = 0;
    
    // Go through localStorage and count votes for this post
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith(`upvote-${postId}`)) {
        upvotes++;
      } else if (key.startsWith(`downvote-${postId}`)) {
        downvotes++;
      }
    }
    
    return { upvotes, downvotes };
  } catch (e) {
    console.error('Error retrieving local votes:', e);
    return { upvotes: 0, downvotes: 0 };
  }
}

/**
 * Queue an item for later synchronization with the server
 * @param {string} type - Type of item ('vote', 'comment', etc.)
 * @param {object} data - Data to be synchronized
 */
function queueForSync(type, data) {
  try {
    const syncQueueKey = 'sync_queue';
    const queueStr = localStorage.getItem(syncQueueKey);
    const queue = queueStr ? JSON.parse(queueStr) : [];
    
    queue.push({
      type,
      data,
      timestamp: new Date().toISOString(),
      syncAttempts: 0
    });
    
    localStorage.setItem(syncQueueKey, JSON.stringify(queue));
  } catch (e) {
    console.error('Error queueing item for sync:', e);
  }
}

/**
 * Try to synchronize all queued items with the server
 * @param {function} onComplete - Callback to run when sync is complete
 */
function syncWithServer(onComplete = () => {}) {
  const syncQueueKey = 'sync_queue';
  const queueStr = localStorage.getItem(syncQueueKey);
  
  if (!queueStr) {
    onComplete(true);
    return;
  }
  
  const queue = JSON.parse(queueStr);
  if (queue.length === 0) {
    onComplete(true);
    return;
  }
  
  console.log(`Attempting to sync ${queue.length} items with server...`);
  
  // Check if we're online before attempting to sync
  if (isOfflineMode()) {
    console.log('Device is offline, cannot sync now');
    onComplete(false);
    return;
  }
  
  // Get API URL from utils.js baseUrl() function or fall back to default
  const apiUrl = typeof baseUrl === 'function' ? baseUrl() : '';
  if (apiUrl === '/api') {
    console.log('In static mode, cannot sync with server');
    onComplete(false);
    return;
  }
  
  // Track how many items we've processed
  let processedCount = 0;
  let successCount = 0;
  
  // Create a new queue for items that failed to sync
  const newQueue = [];
  
  // Process each item in the queue
  queue.forEach(item => {
    let endpoint;
    
    // Determine the endpoint based on item type
    switch (item.type) {
      case 'vote':
        endpoint = item.data.type === 'upvote' ? '/upvote' : '/downvote';
        break;
      case 'comment':
        endpoint = '/comment';
        break;
      default:
        console.warn(`Unknown item type: ${item.type}`);
        processedCount++;
        newQueue.push(item); // Keep unknown items in the queue
        if (processedCount === queue.length) {
          finishSync();
        }
        return;
    }
    
    // Send the item to the server
    fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data)
    })
    .then(response => {
      processedCount++;
      
      if (response.ok) {
        successCount++;
        console.log(`Successfully synced ${item.type} item`);
      } else {
        console.warn(`Failed to sync ${item.type} item:`, response.status);
        
        // Add back to queue with increased attempt count if we haven't tried too many times
        if (item.syncAttempts < 3) {
          newQueue.push({
            ...item,
            syncAttempts: (item.syncAttempts || 0) + 1
          });
        } else {
          console.warn(`Dropping ${item.type} item after 3 failed attempts`);
        }
      }
      
      // Check if we're done processing all items
      if (processedCount === queue.length) {
        finishSync();
      }
    })
    .catch(error => {
      processedCount++;
      console.error(`Error syncing ${item.type} item:`, error);
      
      // Add back to queue with increased attempt count if we haven't tried too many times
      if (item.syncAttempts < 3) {
        newQueue.push({
          ...item,
          syncAttempts: (item.syncAttempts || 0) + 1
        });
      } else {
        console.warn(`Dropping ${item.type} item after 3 failed attempts`);
      }
      
      // Check if we're done processing all items
      if (processedCount === queue.length) {
        finishSync();
      }
    });
  });
  
  // Helper function to finish the sync process
  function finishSync() {
    // Update the queue with items that failed
    localStorage.setItem(syncQueueKey, JSON.stringify(newQueue));
    
    // Show a notification if any items were synced
    if (successCount > 0) {
      if (typeof showSuccessModal === 'function') {
        showSuccessModal(`Synced ${successCount} items with server`, null, 2000, 'success');
      }
    }
    
    onComplete(newQueue.length === 0);
    
    // If there are still items to sync, schedule another attempt
    if (newQueue.length > 0) {
      console.log(`${newQueue.length} items left to sync. Will retry later.`);
      setTimeout(() => syncWithServer(), 60000); // Try again in 1 minute
    }
  }
}

/**
 * Check if we're in offline mode
 * @returns {boolean} - True if offline mode is detected
 */
function isOfflineMode() {
  // First check if we have actual online/offline status
  if (typeof navigator.onLine === 'boolean') {
    return !navigator.onLine;
  }
  
  // Then check if we're in static mode by checking the API URL
  const apiUrl = typeof baseUrl === 'function' ? baseUrl() : '/api';
  return apiUrl === '/api';
}

/**
 * Register online/offline event listeners to trigger sync
 * and set up periodic sync attempts
 */
function setupSyncListeners() {
  // Listen for online event
  window.addEventListener('online', () => {
    console.log('Connection restored. Attempting to sync...');
    // Add a small delay to ensure connection is stable
    setTimeout(() => syncWithServer(), 1000);
  });
  
  // Listen for offline event
  window.addEventListener('offline', () => {
    console.log('Connection lost. Will sync when connection is restored.');
  });
  
  // Also attempt to sync on page load if we're online
  if (!isOfflineMode()) {
    console.log('Online on page load, checking for items to sync...');
    setTimeout(() => syncWithServer(), 2000);
  }
  
  // Setup a periodic sync attempt
  setInterval(() => {
    if (!isOfflineMode()) {
      console.log('Periodic sync check');
      syncWithServer();
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

// Initialize sync listeners when the script loads
setupSyncListeners();

/**
 * Sync localStorage data to GitHub repository using GitHub Actions
 * This function triggers a GitHub repository_dispatch event to start the workflow
 * @param {string} githubToken - GitHub personal access token with repo scope
 * @returns {Promise<boolean>} - Whether the sync was successful
 */
async function triggerGitHubSync(githubToken) {
  try {
    // Get data counts for summary
    const posts = JSON.parse(localStorage.getItem('collection_posts') || '[]');
    const comments = JSON.parse(localStorage.getItem('collection_comments') || '[]');
    const votes = JSON.parse(localStorage.getItem('collection_votes') || '[]');
    
    // Log counts for debugging
    console.log(`Data to sync: ${posts.length} posts, ${comments.length} comments, ${votes.length} votes`);
    
    // Check if there's any data to sync
    const hasData = posts.length > 0 || comments.length > 0 || votes.length > 0;
    
    if (!hasData) {
      console.log('No localStorage data to sync');
      if (typeof showSuccessModal === 'function') {
        showSuccessModal('No local data to sync', null, 3000, 'info');
      }
      return false;
    }
    
    // Collect data for sync
    const localData = { posts, comments, votes };
    
    // If we have data and a token, trigger the GitHub Action
    if (githubToken) {
      const owner = 'wearesierraleone'; // Repository owner
      const repo = 'frontend'; // Repository name
      
      console.log('Sending sync request to GitHub API...');
      
      // Create a summary of data being synced
      const summary = {
        posts: posts.length,
        comments: comments.length,
        votes: votes.length,
        total: posts.length + comments.length + votes.length
      };
      
      // Trigger repository_dispatch event
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'localstorage-sync',
          client_payload: {
            localData: JSON.stringify(localData),
            summary: JSON.stringify(summary),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        })
      });
      
      if (response.ok) {
        console.log('GitHub Actions sync workflow triggered successfully');
        
        // Record successful sync timestamp
        localStorage.setItem('last_sync_timestamp', new Date().toISOString());
        localStorage.setItem('last_sync_summary', JSON.stringify(summary));
        
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to trigger GitHub Actions workflow:', response.status, errorText);
        return false;
      }
    } else {
      console.warn('GitHub token not provided, cannot sync data');
      return false;
    }
  } catch (error) {
    console.error('Error triggering GitHub sync:', error);
    return false;
  }
}

/**
 * Helper function to resolve conflicts between local and server data
 * @param {string} type - The type of data (posts, comments, votes)
 * @param {string} postId - The ID of the post
 * @param {any} localData - The local data
 * @param {any} serverData - The server data
 * @returns {any} The resolved data
 */
function resolveConflicts(type, postId, localData, serverData) {
  // Default conflict resolution simply prioritizes local data
  // In a more sophisticated approach, you might want to merge data more intelligently
  
  switch (type) {
    default:
      console.warn(`Unknown data type for merging: ${type}`);
      return serverData;
  }
  
  // Resolve any conflicts between local and server data
  return resolveConflicts(type, postId, localData, serverData);
}
