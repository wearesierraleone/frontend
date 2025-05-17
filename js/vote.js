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
  
  // Check if user already voted on this post
  const alreadyVoted = localStorage.getItem(`voted-${postId}`) === 'true';
  if (alreadyVoted) {
    voteBtn.innerText = 'Voted';
    voteBtn.disabled = true;
    voteBtn.classList.add('cursor-not-allowed', 'opacity-50');
    return;
  }
  
  voteBtn.addEventListener('click', async () => {
    // Disable button immediately to prevent double clicks
    voteBtn.disabled = true;
    voteBtn.classList.add('opacity-50');
    
    const vote = { 
      postId,
      type: 'upvote', // Changed from 'vote' to be more specific
      timestamp: new Date().toISOString() 
    };

    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
      try {
        // Use local storage for GitHub Pages
        if (typeof saveVoteLocally === 'function') {
          saveVoteLocally(vote);
          voteBtn.innerText = 'Voted';
          voteBtn.classList.add('cursor-not-allowed');
          
          // Update vote count in the UI if possible
          const voteCountElement = document.getElementById('voteCount');
          if (voteCountElement) {
            const currentCount = parseInt(voteCountElement.textContent || '0', 10);
            voteCountElement.textContent = (currentCount + 1).toString();
          }
        } else {
          throw new Error('localStorage sync functionality not available');
        }
      } catch (error) {
        console.error('Vote error:', error);
        voteBtn.disabled = false;
        voteBtn.classList.remove('opacity-50');
        alert('Failed to save your vote. Please try again later.');
      }
    } else {
      // For non-GitHub Pages, use API
      postContentWithCallback(
        '/vote',
        vote,
        () => {
          voteBtn.innerText = 'Voted';
          voteBtn.classList.add('cursor-not-allowed');
          // No success modal
        },
        'Failed to submit vote. Please try again.'
      )
      .catch((error) => {
        console.error('Vote error:', error);
        // Reset the button if there's an error
        voteBtn.disabled = false;
        voteBtn.classList.remove('opacity-50');
      });
    }
  });
});