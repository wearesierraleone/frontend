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
    
    // Submit post
    postContent(
      '/submit', 
      post, 
      'Post submitted successfully.', 
      'index.html',
      'Failed to submit post, please try again.'
    )
    .catch(error => {
      console.error('Post submission error:', error);
      // Error is already handled in postContent, just logging here
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
