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
 * Handle conflicts between local and server data
 * @param {string} type - Type of data ('votes', 'comments')
 * @param {string} postId - The ID of the post
 * @param {object} localData - The local data
 * @param {object} serverData - The server data
 * @returns {object} - The resolved data
 */
function resolveConflicts(type, postId, localData, serverData) {
  console.log(`Resolving conflicts for ${type} on post ${postId}`);
  
  switch (type) {
    case 'votes':
      // For votes, we take the higher count for each type (upvote/downvote)
      // This assumes we don't track individual votes but just count them
      return {
        upvotes: Math.max(localData.upvotes || 0, serverData.upvotes || 0),
        downvotes: Math.max(localData.downvotes || 0, serverData.downvotes || 0)
      };
      
    case 'comments':
      // For comments, we need to merge by timestamp
      // This is a simple approach that ignores possible duplicates
      
      // Create a map of timestamps to comments from both sources
      const commentMap = new Map();
      
      // Add server comments first
      (serverData || []).forEach(comment => {
        commentMap.set(comment.timestamp, { ...comment, source: 'server' });
      });
      
      // Then add local comments, potentially overwriting server comments
      // with the same timestamp (rare but possible)
      (localData || []).forEach(comment => {
        if (!commentMap.has(comment.timestamp)) {
          commentMap.set(comment.timestamp, { ...comment, source: 'local' });
        }
      });
      
      // Convert back to array and sort by timestamp
      return Array.from(commentMap.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
    default:
      console.warn(`Unknown conflict type: ${type}`);
      return serverData || localData;
  }
}

/**
 * Merge server data with local data, resolving conflicts
 * @param {object} options - Options for merging
 * @param {string} options.type - Type of data ('votes', 'comments')
 * @param {string} options.postId - The ID of the post
 * @param {object} options.serverData - The server data
 * @returns {object} - The merged data
 */
function mergeWithLocalData({ type, postId, serverData }) {
  let localData;
  
  switch (type) {
    case 'votes':
      localData = getLocalVotes(postId);
      break;
      
    case 'comments':
      // Get local comments for the post
      try {
        const localCommentsStr = localStorage.getItem('local_comments');
        if (localCommentsStr) {
          const localComments = JSON.parse(localCommentsStr);
          localData = localComments[postId] || [];
        } else {
          localData = [];
        }
      } catch (e) {
        console.error('Error getting local comments:', e);
        localData = [];
      }
      break;
      
    default:
      console.warn(`Unknown data type for merging: ${type}`);
      return serverData;
  }
  
  // Resolve any conflicts between local and server data
  return resolveConflicts(type, postId, localData, serverData);
}
