/**
 * Vote handling functionality
 */
document.addEventListener('DOMContentLoaded', () => {
  const voteBtn = document.getElementById('voteButton');
  if (!voteBtn) return;

  const postId = new URLSearchParams(window.location.search).get('id');
  if (!postId) {
    console.error('No post ID found in URL');
    return;
  }

  const votedKey = `voted-${postId}`;
  
  // Update button state based on local storage
  function updateVoteButtonState() {
    if (localStorage.getItem(votedKey)) {
      voteBtn.disabled = true;
      voteBtn.classList.add('opacity-50', 'cursor-not-allowed');
      voteBtn.innerText = 'Already Voted';
    }
  }
  
  // Initialize button state
  updateVoteButtonState();

  voteBtn.addEventListener('click', async () => {
    // Disable button immediately to prevent double clicks
    voteBtn.disabled = true;
    voteBtn.classList.add('opacity-50');
    
    const vote = { 
      postId,
      type: 'vote',
      timestamp: new Date().toISOString() 
    };
    
    // Always save locally first for immediate feedback
    if (typeof saveVoteLocally === 'function') {
      saveVoteLocally(vote);
    } else {
      localStorage.setItem(`vote-${postId}-${Date.now()}`, JSON.stringify(vote));
    }
    
    // Mark as voted in local storage
    localStorage.setItem(votedKey, 'true');

    // Queue for synchronization if we're offline
    if (typeof isOfflineMode === 'function' && isOfflineMode() && typeof queueForSync === 'function') {
      queueForSync('vote', vote);
      
      // Update UI to show vote received
      voteBtn.innerText = 'Voted';
      voteBtn.classList.add('cursor-not-allowed');
      showSuccessModal('Vote saved locally and will be submitted when connected', null, 2000, 'success');
      return;
    }

    postContentWithCallback(
      '/vote',
      vote,
      () => {
        voteBtn.innerText = 'Voted';
        voteBtn.classList.add('cursor-not-allowed');
        showSuccessModal('Vote submitted successfully', null, 0, 'success');
      },
      'Failed to submit vote. Please try again.'
    )
    .catch(() => {
      // If API error, vote is still saved locally
      showSuccessModal('Vote saved locally. Will be synchronized later.', null, 2000, 'info');
      
      // Queue for sync if we have that functionality
      if (typeof queueForSync === 'function') {
        queueForSync('vote', vote);
      }
      
      voteBtn.innerText = 'Voted (Offline)';
      voteBtn.classList.add('cursor-not-allowed');
    });
  });
});