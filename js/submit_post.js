/**
 * Post submission handling
 */
document.addEventListener('DOMContentLoaded', function() {
  const postForm = document.getElementById('postForm');
  if (!postForm) return;
  
  // Image URL validation regex
  const validImageUrlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i;
  
  /**
   * Validates the post form data
   * @param {object} formData - The form data object
   * @returns {object} - Validation result with isValid flag and error message
   */
  function validateForm(formData) {
    if (!formData.title.trim()) {
      return { isValid: false, message: 'Title is required' };
    }
    
    if (!formData.body.trim()) {
      return { isValid: false, message: 'Post content is required' };
    }
    
    if (!formData.category) {
      return { isValid: false, message: 'Please select a category' };
    }
    
    if (formData.imageUrl && !validImageUrlRegex.test(formData.imageUrl)) {
      return { isValid: false, message: 'Please enter a valid image URL ending in .jpg, .png, .gif, etc.' };
    }
    
    return { isValid: true };
  }
  
  postForm.addEventListener('submit', function (e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
      title: this.title.value,
      body: this.body.value,
      category: this.category.value,
      imageUrl: this.imageUrl.value.trim()
    };
    
    // Validate form
    const validation = validateForm(formData);
    if (!validation.isValid) {
      showSuccessModal(validation.message);
      return;
    }
    
    // Submit button - disable to prevent double submission
    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    // Prepare post data
    const post = {
      ...formData,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    console.log('Submitting post:', post, 'Is GitHub Pages:', isGitHubPages);
    
    // Simple direct post approach
    // First load existing posts
    fetch('data/approved.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load posts: ${response.status}`);
        }
        return response.json();
      })
      .then(existingPosts => {
        // Add a unique ID to the post
        post.id = `post${Date.now()}`;
        
        // Add the post to the existing posts array
        const updatedPosts = [...existingPosts, post];
        
        // In a real application, this would make an API call to save the post
        // For local development, we need to save through another mechanism
        console.log('New post created:', post);
        
        // Check if we're in development and using our enhanced server
        // This ensures we only try to use the API when the correct server is running
        // We now check for multiple possible ports that our dynamic port selection might use
        const commonDevPorts = ['5500', '5501', '5502', '5503', '8080', '8081', '3000', '3001'];
        const currentPort = window.location.port;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isEnhancedServer = isLocalhost && commonDevPorts.includes(currentPort);
        
        if (isEnhancedServer) {
          // We're running on our enhanced API server
          console.log('Using enhanced server with API support');
          // Send the updated posts array to our local server endpoint
          fetch('/save-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              post: post,
              allPosts: updatedPosts
            })
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            console.log('Success:', data);
            showSuccessModal('Post submitted successfully and is pending approval.', 'index.html', 2000, 'success');
          })
          .catch(saveError => {
            console.error('Error saving post:', saveError);
            showSuccessModal(
              `Unable to save the post. Server connection error.\nMake sure you started the enhanced server with:\n./scripts/start_local_server_with_api.sh\n\nCurrent port: ${window.location.port}`, 
              null, 
              0, 
              'error'
            );
          });
        } else if (isGitHubPages) {
          // We're on GitHub Pages
          console.log('Running on GitHub Pages - demo mode');
          showSuccessModal(
            'Demo mode: Post would be saved with pending status. In this environment, posts cannot be saved to the server.', 
            'index.html', 
            3000, 
            'info'
          );
        } else {
          // We're on another development server without API support
          console.log('Not using enhanced server. Port: ' + window.location.port);
          showSuccessModal(
            `Demo mode: Post would be saved with pending status. To actually save posts, run one of the API servers:\n\n./scripts/start_local_server_with_api.sh\n\nCurrent port: ${window.location.port}`, 
            'index.html', 
            4000, 
            'info'
          );
        }
      })
      .catch(error => {
        console.error('Error processing post:', error);
        showSuccessModal('Failed to submit post, please try again.', null, 0, 'error');
      })
    .finally(() => {
      // Re-enable submit button regardless of outcome after a short delay
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Post';
        }
      }, 500);
    });
  });
});
