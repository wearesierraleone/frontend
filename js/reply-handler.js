/**
 * Reply Handler for We Are Sierra Leone
 * Handles showing, hiding, and submitting replies to comments
 */

/**
 * Show the reply form for a comment
 * @param {string} commentId - The ID of the comment to reply to
 */
function showReplyForm(commentId) {
  const replyForm = document.getElementById(`reply-form-${commentId}`);
  if (replyForm) {
    replyForm.classList.remove('hidden');
    const textarea = document.getElementById(`reply-text-${commentId}`) || replyForm.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  }
}

/**
 * Hide the reply form for a comment
 * @param {string} commentId - The ID of the comment
 */
function hideReplyForm(commentId) {
  const replyForm = document.getElementById(`reply-form-${commentId}`);
  if (replyForm) {
    replyForm.classList.add('hidden');
    const textarea = document.getElementById(`reply-text-${commentId}`) || replyForm.querySelector('textarea');
    if (textarea) {
      textarea.value = '';
    }
  }
}

/**
 * Submit a reply to a comment
 * @param {string} postId - The ID of the post
 * @param {string} parentCommentId - The ID of the parent comment
 */
async function submitReply(postId, parentCommentId) {
  try {
    const replyForm = document.getElementById(`reply-form-${parentCommentId}`);
    if (!replyForm) return;
    
    const textarea = document.getElementById(`reply-text-${parentCommentId}`) || replyForm.querySelector('textarea');
    if (!textarea || !textarea.value.trim()) {
      showSuccessModal('Please enter a reply', null, 0, 'warning');
      return;
    }
    
    const replyText = textarea.value.trim();
    
    // Get anonymous ID from localStorage or generate a new one
    const anonId = localStorage.getItem('anonId') || 'anon-' + Math.floor(Math.random() * 99999);
    localStorage.setItem('anonId', anonId);
    
    // Create the reply object
    const reply = {
      id: 'reply-' + Date.now(),
      parentId: parentCommentId,
      author: anonId,
      text: replyText,
      timestamp: new Date().toISOString(),
      status: 'approved'
    };
    
    // Get existing comments using data service
    const allComments = await loadComments(postId);
    let commentsList = allComments;
    
    // If the returned format is an array, convert it to the expected format
    if (Array.isArray(allComments)) {
      commentsList = allComments;
    } else if (allComments[postId]) {
      commentsList = allComments[postId];
    } else {
      commentsList = [];
    }
    
    // Find the parent comment to attach the reply
    let parentCommentFound = findAndAddReply(commentsList, parentCommentId, reply);
    
    if (parentCommentFound) {
      // Submit the comment using data service
      const success = await submitComment({
        postId: postId, 
        comments: commentsList,
        action: 'reply'
      });
      
      if (success) {
        // Refresh the comments section to show the updated comments
        if (typeof loadPostComments === 'function') {
          loadPostComments(postId);
        } else {
          // Fallback to reloading the entire post
          window.location.reload();
        }
        
        // Hide the reply form
        hideReplyForm(parentCommentId);
      } else {
        throw new Error('Failed to submit reply');
      }
    } else {
      throw new Error('Parent comment not found');
    }
  } catch (error) {
    console.error('Error submitting reply:', error);
    showSuccessModal('Error submitting reply', 'Please try again later.', 2000, 'error');
  }
}

/**
 * Helper function to find and add a reply to a comment
 * @param {Array} commentList - List of comments
 * @param {string} targetId - ID of the target comment
 * @param {Object} newReply - The new reply to add
 * @returns {boolean} True if the parent comment was found and updated
 */
function findAndAddReply(commentList, targetId, newReply) {
  for (let i = 0; i < commentList.length; i++) {
    const comment = commentList[i];
    
    // Check if this is the target comment
    if (comment.id === targetId) {
      if (!comment.replies) comment.replies = [];
      comment.replies.push(newReply);
      return true;
    }
    
    // Check replies recursively
    if (comment.replies && comment.replies.length > 0) {
      const found = findAndAddReplyInReplies(comment.replies, targetId, newReply);
      if (found) return true;
    }
  }
  return false;
}

/**
 * Helper function to search through nested replies
 * @param {Array} replies - List of replies
 * @param {string} targetId - ID of the target reply
 * @param {Object} newReply - The new reply to add
 * @returns {boolean} True if the parent reply was found and updated
 */
function findAndAddReplyInReplies(replies, targetId, newReply) {
  for (let i = 0; i < replies.length; i++) {
    const reply = replies[i];
    
    // Check if this is the target reply
    if (reply.id === targetId) {
      if (!reply.replies) reply.replies = [];
      reply.replies.push(newReply);
      return true;
    }
    
    // Check nested replies recursively
    if (reply.replies && reply.replies.length > 0) {
      const found = findAndAddReplyInReplies(reply.replies, targetId, newReply);
      if (found) return true;
    }
  }
  return false;
}

/**
 * Flag a comment or reply
 * @param {string} postId - The ID of the post
 * @param {string} commentId - The ID of the comment to flag
 */
async function flagComment(postId, commentId) {
  try {
    // Get existing comments using data service
    const allComments = await loadComments(postId);
    let commentsList = allComments;
    
    // If the returned format is an array, convert it to the expected format
    if (Array.isArray(allComments)) {
      commentsList = allComments;
    } else if (allComments[postId]) {
      commentsList = allComments[postId];
    } else {
      commentsList = [];
    }
    
    // Try to find and flag the comment
    let flagged = findAndFlagComment(commentsList, commentId);
    
    if (flagged) {
      // Try to save via data service
      const success = await submitComment({
        postId: postId,
        comments: commentsList,
        action: 'flag'
      });
      
      if (success) {
        showSuccessModal('Comment flagged for review', 'Moderators will be notified.', 2000, 'info');
        
        // Refresh the comments section to show the updated status
        if (typeof loadPostComments === 'function') {
          loadPostComments(postId);
        } else {
          // Fallback to reloading the entire post
          window.location.reload();
        }
      } else {
        // Add flagged indicator to the UI even if API failed
        showSuccessModal('Comment flagged locally', 'Moderators will be notified of this comment.', 2000, 'info');
        
        // Add flagged indicator to the UI
        const commentElement = document.getElementById(`comment-${commentId}`);
        if (commentElement) {
          const flagIndicator = document.createElement('div');
          flagIndicator.className = 'text-orange-600 text-sm mt-2 pl-10';
          flagIndicator.innerText = 'This comment has been flagged for review';
          commentElement.appendChild(flagIndicator);
        }
      }
    } else {
      throw new Error('Comment not found');
    }
  } catch (error) {
    console.error('Error flagging comment:', error);
    showSuccessModal('Error flagging comment', 'Please try again later.', 2000, 'error');
  }
}

/**
 * Helper function to find and flag a comment or reply
 * @param {Array} commentsList - List of comments
 * @param {string} targetId - ID of the target comment
 * @returns {boolean} True if the comment was found and flagged
 */
function findAndFlagComment(commentsList, targetId) {
  for (let i = 0; i < commentsList.length; i++) {
    const comment = commentsList[i];
    
    // Check if this is the target comment
    if (comment.id === targetId) {
      comment.status = 'flagged';
      return true;
    }
    
    // Check replies recursively
    if (comment.replies && comment.replies.length > 0) {
      const found = findAndFlagInReplies(comment.replies, targetId);
      if (found) return true;
    }
  }
  return false;
}

/**
 * Helper function to search through nested replies for flagging
 * @param {Array} replies - List of replies
 * @param {string} targetId - ID of the target reply
 * @returns {boolean} True if the reply was found and flagged
 */
function findAndFlagInReplies(replies, targetId) {
  for (let i = 0; i < replies.length; i++) {
    const reply = replies[i];
    
    // Check if this is the target reply
    if (reply.id === targetId) {
      reply.status = 'flagged';
      return true;
    }
    
    // Check nested replies recursively
    if (reply.replies && reply.replies.length > 0) {
      const found = findAndFlagInReplies(reply.replies, targetId);
      if (found) return true;
    }
  }
  return false;
}

/**
 * Helper function to render nested replies
 * @param {Object} comment - The comment with replies
 * @param {string} postId - The ID of the post
 * @returns {string} HTML string for the replies
 */
function renderReplies(comment, postId) {
  if (!comment.replies || comment.replies.length === 0) {
    return '';
  }
  
  let repliesHtml = '';
  
  // Filter out rejected replies
  const visibleReplies = comment.replies.filter(reply => reply.status !== 'rejected') || [];
  
  visibleReplies.forEach(reply => {
    const replyDate = new Date(reply.timestamp);
    const replyDateStr = replyDate.toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(',', '');
    
    repliesHtml += `
    <div class="border-l-2 border-gray-200 pl-4 py-2 mt-2 ml-2 bg-gray-50 rounded-r-md">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center">
          <div class="bg-blue-50 text-blue-600 rounded-full p-1 mr-2">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <strong class="font-medium text-sm text-gray-800">${reply.author || 'Anonymous'}</strong>
        </div>
        <span class="text-gray-500 text-xs">${replyDateStr}</span>
      </div>
      <div class="text-gray-700 text-sm ml-6">${escapeHtml(reply.text)}</div>
      <div class="flex justify-between items-center mt-1 ml-6">
        <div>
          <button class="text-gray-500 hover:text-blue-600 flex items-center text-xs" onclick="showReplyForm('${reply.id}')">
            <svg class="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
        </div>
        <button class="text-gray-500 hover:text-orange-600 flex items-center text-xs" onclick="flagComment('${postId}', '${reply.id}')">
          <svg class="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
          </svg>
          Flag
        </button>
      </div>
      <div id="reply-form-${reply.id}" class="mt-2 hidden ml-6">
        <div class="bg-white p-2 rounded border border-gray-200">
          <textarea id="reply-text-${reply.id}" class="w-full border border-gray-300 p-2 rounded text-sm" rows="2" placeholder="Write your reply..."></textarea>
          <div class="flex justify-end mt-2 space-x-2">
            <button class="text-gray-500 text-xs px-2 py-1 rounded hover:bg-gray-200" onclick="hideReplyForm('${reply.id}')">Cancel</button>
            <button class="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700" onclick="submitReply('${postId}', '${reply.id}')">Reply</button>
          </div>
        </div>
      </div>
      ${reply.replies && reply.replies.length > 0 ? 
        `<div id="replies-${reply.id}" class="ml-4 mt-2">
          ${renderReplies(reply, postId)}
         </div>` 
        : ''}
    </div>
  `;
  });
  
  return repliesHtml;
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

// Expose functions to global scope for use in HTML
window.showReplyForm = showReplyForm;
window.hideReplyForm = hideReplyForm;
window.submitReply = submitReply;
window.flagComment = flagComment;
