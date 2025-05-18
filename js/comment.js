// Define handleCommentSubmission globally for any code that might reference it
function handleCommentSubmission(event) {
  if (event) event.preventDefault();
  const form = document.getElementById('commentForm');
  if (!form) return;
  
  const text = form.comment.value;
  
  if (!text.trim()) {
    console.log('Comment text is empty');
    return;
  }
  
  const postId = new URLSearchParams(window.location.search).get('id');
  // Store anonymous ID in localStorage for user convenience
  const anonId = localStorage.getItem('anonId') || 'anon-' + Math.floor(Math.random() * 99999);
  localStorage.setItem('anonId', anonId);

  const comment = { 
    id: 'comment-' + Date.now(), // Generate a unique ID
    postId, 
    text, 
    anonId, 
    timestamp: new Date().toISOString(),
    status: 'approved' // All comments are approved by default, moderation can mark as rejected if needed
  };
  
  // Get submit button and disable it
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    if (submitBtn.classList.contains('bg-blue-600')) {
      submitBtn.classList.add('opacity-50');
    }
  }
  
  // Use the data service to submit the comment
  submitComment(comment)
    .then(success => {
      if (success) {
        // In static mode or for immediate feedback, manually add the comment to UI
        appendCommentToUI(comment);
      } else {
        console.log('Comment submitted but may require refresh to see');
      }
    })
    .catch(error => {
      console.error('Failed to submit comment:', error);
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
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('commentForm');
  const list = document.getElementById('commentList');
  const postId = new URLSearchParams(window.location.search).get('id');

  if (!form) return;

  // Use the global handleCommentSubmission function
  form.addEventListener('submit', handleCommentSubmission);
  
  // Load comments for this post if we have a list and postId
  if (list && postId) {
    // Show loading state
    list.innerHTML = '<div class="text-center py-4"><span class="inline-block animate-spin mr-2">⏳</span> Loading comments...</div>';
    
    try {
      // Use the data service to load comments
      const comments = await loadComments(postId);
      
      // Clear the list
      list.innerHTML = '';
      
      // If no comments, show a message
      if (!comments || comments.length === 0) {
        list.innerHTML = '<div class="text-gray-500 italic p-4">No comments yet. Be the first to comment!</div>';
        return;
      }
      
      // Sort comments by timestamp (newest first)
      const sortedComments = [...comments].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Add each comment to the UI
      sortedComments.forEach(comment => appendCommentToUI(comment));
    } catch (error) {
      console.error('Error loading comments:', error);
      list.innerHTML = '<div class="text-red-500 p-4">Failed to load comments. Please try refreshing the page.</div>';
    }
  }
});

/**
 * Append a comment to the UI
 * @param {object} comment - The comment to append
 */
function appendCommentToUI(comment) {
  const commentList = document.getElementById('commentList');
  if (!commentList) return;
  
  // Create comment element
  const commentElement = document.createElement('div');
  
  // Highlight flagged comments
  const isFlagged = comment.status === 'flagged';
  commentElement.className = 'p-4 border-b border-gray-200' +
    (isFlagged ? ' bg-orange-50 border-l-4 border-orange-300' : '');
  
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
    ${comment.status === 'flagged' ? '<div class="text-xs text-orange-600 mt-2">This comment has been flagged for review</div>' : ''}
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

