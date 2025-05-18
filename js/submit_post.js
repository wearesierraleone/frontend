/**
 * Post submission handling
 * Updated May 2025 to use direct saving instead of modal confirmation
 */
document.addEventListener('DOMContentLoaded', function() {
  const postForm = document.getElementById('postForm');
  if (!postForm) return;
  
  // Image URL validation regex
  const validImageUrlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i;
  
  /**
   * Helper function to create an error message element if it doesn't exist
   */
  function createErrorElement() {
    const errorElement = document.createElement('div');
    errorElement.id = 'form-error';
    errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorElement.style.display = 'none';
    
    // Insert at the top of the form
    postForm.insertBefore(errorElement, postForm.firstChild);
    return errorElement;
  }
  
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
      // Show inline error instead of modal
      const errorElement = document.getElementById('form-error') || createErrorElement();
      errorElement.textContent = validation.message;
      errorElement.style.display = 'block';
      return;
    }
    
    // Clear any previous error
    const errorElement = document.getElementById('form-error');
    if (errorElement) {
      errorElement.style.display = 'none';
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
      id: `post-${Date.now()}`, // Generate a unique ID
      timestamp: new Date().toISOString(),
      status: 'approved'
    };
    
    console.log('Submitting post:', post);
    
    // Use data service to submit the post
    submitPost(post)
      .then(success => {
        if (success) {
          console.log('Post submitted successfully');
          // Redirect to index page
          window.location.href = 'index.html';
        } else {
          throw new Error('Failed to submit post');
        }
      })
      .catch(error => {
        console.error('Error submitting post:', error);
        // Use alert instead of modal
        alert('Failed to submit post, please try again.');
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
