/**
 * Data Service for We Are Sierra Leone
 * Handles data loading and submission using the new per-post file structure
 * 
 * New file structure:
 * - Posts: /data/posts/post-123.json
 * - Comments: /data/comments/post-123/comment-456.json
 * - Votes: /data/votes/post-123.json
 * - Upvotes: /data/upvotes/post-123.json
 * - Downvotes: /data/downvotes/post-123.json
 * - Petitions: /data/petitions/post-123.json
 * - Reports: /data/reports/report-xxx.json
 * - Signatures: /data/signatures/post-123.json
 */

/**
 * Base URL for the Flask submission API
 */
const FLASK_API_URL = 'https://flask-submission-bot.onrender.com';

/**
 * Check if we are on GitHub Pages
 * @returns {boolean} True if on GitHub Pages
 */
function isGitHubPages() {
  return window.location.hostname.includes('github.io');
}

/**
 * Get base URL for data files
 * @returns {string} Base URL for data files
 */
function getDataBaseUrl() {
  if (isGitHubPages()) {
    // On GitHub Pages, use raw.githubusercontent.com
    return 'https://raw.githubusercontent.com/wearesierraleone/frontend/main';
  }
  // For local development
  return '';
}

/**
 * Constructs a URL for a data file
 * @param {string} path - Path to the data file
 * @returns {string} Full URL for the data file
 */
function getDataUrl(path) {
  const base = getDataBaseUrl();
  if (path.startsWith('/')) {
    return `${base}${path}`;
  }
  return `${base}/${path}`;
}

/**
 * Load a post by ID
 * @param {string} postId - The ID of the post to load
 * @returns {Promise<object>} The post data or null if not found
 */
async function loadPost(postId) {
  try {
    // Try to load from the new structure
    const response = await fetchWithTimeout(getDataUrl(`/data/posts/${postId}.json`));
    if (response.ok) {
      const postData = await response.json();
      return postData;
    } else if (response.status === 404) {
      console.log(`Post ${postId} not found in new structure, trying fallback locations`);
      
      // Fallback to older approved.json structure
      const approvedPosts = await loadLegacyPosts();
      const post = approvedPosts.find(post => post.id === postId);
      if (post) {
        return post;
      }
    }
    throw new Error(`Failed to load post: ${response.status}`);
  } catch (error) {
    console.error('Error loading post:', error);
    return null;
  }
}

/**
 * Load all comments for a post
 * @param {string} postId - The ID of the post
 * @returns {Promise<Array>} Array of comments
 */
async function loadComments(postId) {
  try {
    // Try to list files in the comments directory using directory listing technique
    // Note: GitHub doesn't support directory listing directly for raw content
    // For GitHub Pages deployment, we need to rely on our submission bot to handle this
    // This is a workaround to fetch a cached list of comments
    const commentsIndexPath = `/data/comments/${postId}/index.json`;
    
    try {
      const indexResponse = await fetchWithTimeout(getDataUrl(commentsIndexPath));
      
      // If index exists, use it to get list of comment files
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        const commentPromises = indexData.files.map(fileName => 
          fetchWithTimeout(getDataUrl(`/data/comments/${postId}/${fileName}`))
            .then(r => r.ok ? r.json() : null)
        );
        
        const comments = await Promise.all(commentPromises);
        return comments.filter(comment => comment !== null);
      }
    } catch (indexError) {
      console.log('No comments index found, trying direct load:', indexError);
    }
    
    // If index approach fails, try to load all comments at once from a comments.json file
    const commentsFilePath = `/data/comments/${postId}.json`;
    const commentsResponse = await fetchWithTimeout(getDataUrl(commentsFilePath));
    
    if (commentsResponse.ok) {
      return await commentsResponse.json();
    }
    
    // Fall back to legacy structure if needed
    const legacyCommentsResponse = await fetchWithTimeout(getDataUrl('/data/comments.json'));
    if (legacyCommentsResponse.ok) {
      const allLegacyComments = await legacyCommentsResponse.json();
      return allLegacyComments[postId] || [];
    }
    
    return [];
  } catch (error) {
    console.error(`Error loading comments for post ${postId}:`, error);
    return [];
  }
}

/**
 * Load vote data for a post
 * @param {string} postId - The ID of the post
 * @returns {Promise<object>} Object containing upvotes and downvotes counts
 */
async function loadVotes(postId) {
  try {
    // Try loading from the new structure - first check upvotes
    const upvotesResponse = await fetchWithTimeout(getDataUrl(`/data/upvotes/${postId}.json`));
    const downvotesResponse = await fetchWithTimeout(getDataUrl(`/data/downvotes/${postId}.json`));
    
    let upvotes = 0;
    let downvotes = 0;
    
    if (upvotesResponse.ok) {
      const upvotesData = await upvotesResponse.json();
      upvotes = upvotesData.count || upvotesData.length || 0;
    }
    
    if (downvotesResponse.ok) {
      const downvotesData = await downvotesResponse.json();
      downvotes = downvotesData.count || downvotesData.length || 0;
    }
    
    // If we found vote data in the new structure
    if (upvotesResponse.ok || downvotesResponse.ok) {
      return { up: upvotes, down: downvotes };
    }
    
    // Try combined votes file
    const votesResponse = await fetchWithTimeout(getDataUrl(`/data/votes/${postId}.json`));
    if (votesResponse.ok) {
      const votesData = await votesResponse.json();
      return { 
        up: votesData.up || votesData.upvotes || 0, 
        down: votesData.down || votesData.downvotes || 0 
      };
    }
    
    // Fall back to legacy structure
    const legacyVotesResponse = await fetchWithTimeout(getDataUrl('/data/votes.json'));
    if (legacyVotesResponse.ok) {
      const allVotes = await legacyVotesResponse.json();
      if (allVotes[postId]) {
        if (typeof allVotes[postId] === 'object') {
          return { up: allVotes[postId].up || 0, down: allVotes[postId].down || 0 };
        } else {
          return { up: allVotes[postId] || 0, down: 0 };
        }
      }
    }
    
    return { up: 0, down: 0 };
  } catch (error) {
    console.error(`Error loading votes for post ${postId}:`, error);
    return { up: 0, down: 0 };
  }
}

/**
 * Check if a post has a petition
 * @param {string} postId - The ID of the post
 * @returns {Promise<boolean>} True if the post has a petition
 */
async function checkPetition(postId) {
  try {
    const response = await fetchWithTimeout(getDataUrl(`/data/petitions/${postId}.json`));
    return response.ok;
  } catch (error) {
    console.error(`Error checking petition for post ${postId}:`, error);
    return false;
  }
}

/**
 * Load petition signatures
 * @param {string} postId - The ID of the post
 * @returns {Promise<Array>} Array of signatures
 */
async function loadSignatures(postId) {
  try {
    const response = await fetchWithTimeout(getDataUrl(`/data/signatures/${postId}.json`));
    if (response.ok) {
      const signaturesData = await response.json();
      return Array.isArray(signaturesData) ? signaturesData : signaturesData.signatures || [];
    }
    return [];
  } catch (error) {
    console.error(`Error loading signatures for post ${postId}:`, error);
    return [];
  }
}

/**
 * Submit a vote for a post
 * @param {string} postId - The ID of the post
 * @param {string} voteType - 'up' or 'down'
 * @returns {Promise<boolean>} True if the vote was submitted successfully
 */
async function submitVote(postId, voteType) {
  try {
    if (isGitHubPages()) {
      // On GitHub Pages, use our Flask API
      const response = await fetch(`${FLASK_API_URL}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          type: voteType,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } else {
      // For local development, use localStorage
      if (typeof saveVoteLocally === 'function') {
        saveVoteLocally({
          postId,
          type: voteType,
          timestamp: new Date().toISOString()
        });
        return true;
      } else {
        throw new Error('localStorage functionality not available');
      }
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    return false;
  }
}

/**
 * Submit a comment on a post
 * @param {object} comment - The comment data
 * @returns {Promise<boolean>} True if the comment was submitted successfully
 */
async function submitComment(comment) {
  try {
    if (isGitHubPages()) {
      const response = await fetch(`${FLASK_API_URL}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comment)
      });
      
      return response.ok;
    } else {
      // For local development, use localStorage
      if (typeof saveCommentLocally === 'function') {
        saveCommentLocally(comment);
        return true;
      } else {
        throw new Error('localStorage functionality not available');
      }
    }
  } catch (error) {
    console.error('Error submitting comment:', error);
    return false;
  }
}

/**
 * Submit a new post
 * @param {object} post - The post data
 * @returns {Promise<boolean>} True if the post was submitted successfully
 */
async function submitPost(post) {
  try {
    if (isGitHubPages()) {
      const response = await fetch(`${FLASK_API_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post)
      });
      
      return response.ok;
    } else {
      // For local development, use localStorage
      if (typeof savePostLocally === 'function') {
        savePostLocally(post);
        return true;
      } else {
        throw new Error('localStorage functionality not available');
      }
    }
  } catch (error) {
    console.error('Error submitting post:', error);
    return false;
  }
}

/**
 * Report a post
 * @param {object} report - The report data
 * @returns {Promise<boolean>} True if the report was submitted successfully
 */
async function submitReport(report) {
  try {
    if (isGitHubPages()) {
      const response = await fetch(`${FLASK_API_URL}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });
      
      return response.ok;
    } else {
      // For local development, just log the report
      console.log('Report submitted (development mode):', report);
      return true;
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    return false;
  }
}

/**
 * Sign a petition
 * @param {object} signature - The signature data
 * @returns {Promise<boolean>} True if the signature was submitted successfully
 */
async function signPetition(signature) {
  try {
    if (isGitHubPages()) {
      const response = await fetch(`${FLASK_API_URL}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signature)
      });
      
      return response.ok;
    } else {
      // For local development, just log the signature
      console.log('Petition signed (development mode):', signature);
      return true;
    }
  } catch (error) {
    console.error('Error signing petition:', error);
    return false;
  }
}

/**
 * Load all approved posts
 * @returns {Promise<Array>} Array of approved posts
 */
async function loadAllPosts() {
  try {
    // Try to load from the new structure - index file
    const postsIndexResponse = await fetchWithTimeout(getDataUrl('/data/posts/index.json'));
    
    if (postsIndexResponse.ok) {
      const postsIndex = await postsIndexResponse.json();
      
      // If we have an array of post IDs, load each post
      if (Array.isArray(postsIndex.files) && postsIndex.files.length > 0) {
        const postPromises = postsIndex.files.map(fileName => 
          fetchWithTimeout(getDataUrl(`/data/posts/${fileName}`))
            .then(r => r.ok ? r.json() : null)
        );
        
        const posts = await Promise.all(postPromises);
        return posts.filter(post => post !== null && post.status === 'approved');
      }
    }
    
    // Fall back to legacy structure
    return await loadLegacyPosts();
  } catch (error) {
    console.error('Error loading all posts:', error);
    // Try legacy as fallback
    return await loadLegacyPosts();
  }
}

/**
 * Load posts from the legacy approved.json file
 * @returns {Promise<Array>} Array of approved posts
 */
async function loadLegacyPosts() {
  try {
    const response = await fetchWithTimeout(getDataUrl('/data/approved.json'));
    if (response.ok) {
      return await response.json();
    }
    
    // If all else fails, return an empty array
    return [];
  } catch (error) {
    console.error('Error loading legacy posts:', error);
    return [];
  }
}

/**
 * Fetch with a timeout to prevent hanging requests
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
