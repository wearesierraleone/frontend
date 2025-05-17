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
  
  voteBtn.addEventListener('click', async () => {
    // Disable button immediately to prevent double clicks
    voteBtn.disabled = true;
    voteBtn.classList.add('opacity-50');
    
    const vote = { 
      postId,
      type: 'vote',
      timestamp: new Date().toISOString() 
    };

    postContentWithCallback(
      '/vote',  // Updated to match Flask API endpoint '/votes'
      vote,
      () => {
        voteBtn.innerText = 'Voted';
        voteBtn.classList.add('cursor-not-allowed');
        // No success modal
      },
      'Failed to submit vote. Please try again.'
    )
    .catch((error) => {
      console.error('Error submitting vote:', error);
      // Reset the button if there's an error
      voteBtn.disabled = false;
      voteBtn.classList.remove('opacity-50');
    });
  });
});