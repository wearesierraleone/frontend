document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('commentForm');
  const list = document.getElementById('commentList');
  const postId = new URLSearchParams(window.location.search).get('id');

  if (!form) return;
  
  // Load and display locally stored comments when the page loads
  displayLocalComments(postId);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = form.comment.value;
    
    if (!text.trim()) {
      showSuccessModal('Please enter a comment', null, 0, 'warning');
      return;
    }
    
    // Get submit button and disable it
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      if (submitBtn.classList.contains('bg-blue-600')) {
        submitBtn.classList.add('opacity-50');
      }
    }
    
    const anonId = localStorage.getItem('anonId') || 'anon-' + Math.floor(Math.random() * 99999);
    localStorage.setItem('anonId', anonId);

    const comment = { postId, text, anonId, timestamp: new Date().toISOString() };

    // Add the comment to local storage immediately
    saveCommentLocally(comment);
    
    // Display the new comment on the page immediately
    appendCommentToUI(comment);
    
    // Update comment count
    const commentCountElement = document.getElementById('commentCount');
    if (commentCountElement) {
      const currentCount = parseInt(commentCountElement.innerText, 10) || 0;
      commentCountElement.innerText = currentCount + 1;
    }

    // Check if we're offline
    const isOffline = typeof isOfflineMode === 'function' ? isOfflineMode() : false;
    
    if (isOffline) {
      // Queue for synchronization when we're back online
      if (typeof queueForSync === 'function') {
        queueForSync('comment', comment);
      }
      
      showSuccessModal('Comment saved locally', 'Will be submitted for approval when online', 2000, 'success');
      
      // Reset form
      form.reset();
      
      // Re-enable submit button
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
          if (submitBtn.classList.contains('bg-blue-600')) {
            submitBtn.classList.remove('opacity-50');
          }
        }
      }, 500);
      
      return;
    }

    // We're online, try to submit to the server
    postContent(
      '/comment',  // Updated to match Flask API endpoint '/comments'
      comment,
      'Comment submitted successfully.',
      null,
      'Failed to submit comment'
    )
    .catch(error => {
      console.error('Comment submission error:', error);
      
      // Queue for later sync if we have that functionality
      if (typeof queueForSync === 'function') {
        queueForSync('comment', comment);
      }
    })
    .finally(() => {
      // Reset form
      form.reset();
      
      // Re-enable submit button
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
          if (submitBtn.classList.contains('bg-blue-600')) {
            submitBtn.classList.remove('opacity-50');
          }
        }
      }, 500);
    });
  });
});

/**
 * Save a comment to localStorage for the current post
 * @param {object} comment - The comment object to save
 */
function saveCommentLocally(comment) {
  try {
    // Get existing local comments
    const localCommentsStr = localStorage.getItem('local_comments');
    let localComments = localCommentsStr ? JSON.parse(localCommentsStr) : {};
    
    // Initialize array for this post if it doesn't exist
    if (!localComments[comment.postId]) {
      localComments[comment.postId] = [];
    }
    
    // Add the new comment
    localComments[comment.postId].push(comment);
    
    // Save back to localStorage
    localStorage.setItem('local_comments', JSON.stringify(localComments));
    
    console.log('Comment saved locally:', comment);
  } catch (e) {
    console.error('Error saving comment locally:', e);
  }
}

/**
 * Display locally stored comments for a post
 * @param {string} postId - The ID of the post to display comments for
 */
function displayLocalComments(postId) {
  try {
    const commentList = document.getElementById('commentList');
    if (!commentList) return;
    
    const localCommentsStr = localStorage.getItem('local_comments');
    if (!localCommentsStr) return;
    
    const localComments = JSON.parse(localCommentsStr);
    if (!localComments[postId] || !localComments[postId].length) return;
    
    // Add a visual indicator for local comments
    const localHeader = document.createElement('div');
    localHeader.className = 'p-3 bg-yellow-50 border-l-4 border-yellow-400 mb-4 text-sm';
    localHeader.innerHTML = '<p class="font-medium">Locally saved comments</p><p>These comments are stored on your device and will be visible only to you until approved by moderators.</p>';
    commentList.prepend(localHeader);
    
    // Add each local comment
    localComments[postId].forEach(comment => {
      appendCommentToUI(comment, true);
    });
    
    // Update comment count if it exists
    const commentCountElement = document.getElementById('commentCount');
    if (commentCountElement) {
      const currentCount = parseInt(commentCountElement.innerText, 10) || 0;
      commentCountElement.innerText = currentCount + localComments[postId].length;
    }
  } catch (e) {
    console.error('Error displaying local comments:', e);
  }
}

/**
 * Append a comment to the UI
 * @param {object} comment - The comment to append
 * @param {boolean} isLocal - Whether this is a local comment (not yet approved)
 */
function appendCommentToUI(comment, isLocal = true) {
  const commentList = document.getElementById('commentList');
  if (!commentList) return;
  
  // Create comment element
  const commentElement = document.createElement('div');
  commentElement.className = 'p-4 border-b border-gray-200' + 
    (isLocal ? ' bg-yellow-50' : ''); // Highlight local comments
  
  // Format date
  let dateStr = 'Just now';
  try {
    const date = new Date(comment.timestamp);
    dateStr = date.toLocaleString();
  } catch (e) {
    console.error('Error formatting date:', e);
  }
  
  commentElement.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="font-medium text-gray-600">${comment.anonId || 'Anonymous'}</span>
      <span class="text-sm text-gray-500">${dateStr}</span>
    </div>
    <p>${escapeHtml(comment.text)}</p>
    ${isLocal ? '<div class="text-xs text-yellow-600 mt-2">Awaiting moderation</div>' : ''}
  `;
  
  // Check if there's a "no comments" message and remove it
  const noCommentsDiv = commentList.querySelector('.text-gray-500.italic');
  if (noCommentsDiv) {
    noCommentsDiv.remove();
  }
  
  // Insert at the top for newest first
  commentList.insertBefore(commentElement, commentList.firstChild);
}

/**
 * Helper function to escape HTML to prevent XSS
 * @param {string} unsafe - The unsafe string
 * @returns {string} - The escaped string
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

