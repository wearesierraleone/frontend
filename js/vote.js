/**
 * Vote handling functionality
 */
document.addEventListener('DOMContentLoaded', async () => {
  const voteBtn = document.getElementById('voteButton');
  if (!voteBtn) return;

  const postId = new URLSearchParams(window.location.search).get('id');
  if (!postId) {
    console.error('No post ID found in URL');
    return;
  }
  
  // Load initial vote count
  try {
    const voteData = await loadVotes(postId);
    
    // Update the UI with vote counts
    const voteCountElement = document.getElementById('voteCount');
    if (voteCountElement && voteData) {
      voteCountElement.textContent = voteData.up.toString();
    }
  } catch (error) {
    console.error('Error loading votes:', error);
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
    
    try {
      // Use the data service to submit the vote
      const success = await submitVote(postId, 'up');
      
      if (success) {
        // Mark as voted in localStorage to prevent double voting
        localStorage.setItem(`voted-${postId}`, 'true');
        
        voteBtn.innerText = 'Voted';
        voteBtn.classList.add('cursor-not-allowed');
        
        // Update vote count in the UI if possible
        const voteCountElement = document.getElementById('voteCount');
        if (voteCountElement) {
          const currentCount = parseInt(voteCountElement.textContent || '0', 10);
          voteCountElement.textContent = (currentCount + 1).toString();
        }
      } else {
        throw new Error('Vote submission failed');
      }
    } catch (error) {
      console.error('Vote error:', error);
      voteBtn.disabled = false;
      voteBtn.classList.remove('opacity-50');
      alert('Failed to save your vote. Please try again later.');
    }
  });
});