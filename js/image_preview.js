/**
 * Image preview functionality for post submission
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get required DOM elements
  const imageUrlInput = document.getElementById('imageUrl');
  const previewBtn = document.getElementById('previewBtn');
  const previewContainer = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');
  const removePreviewBtn = document.getElementById('removePreview');
  
  // Exit if required elements are not found
  if (!imageUrlInput || !previewBtn || !previewContainer || !previewImage || !removePreviewBtn) {
    console.error('Image preview elements not found in the DOM');
    return;
  }

  // Valid image URL regex pattern
  const validImageUrlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i;
  
  /**
   * Preview the image from URL
   * @param {string} url - The image URL to preview
   */
  function previewImageFromUrl(url) {
    // Show loading state
    previewContainer.classList.add('opacity-50');
    
    // Set image source
    previewImage.src = url;
    
    // Handle successful load
    previewImage.onload = function() {
      previewContainer.classList.remove('hidden', 'opacity-50');
      
      // Clear any previous error message
      const errorMsg = document.getElementById('imageUrlError');
      if (errorMsg) {
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
      }
    };
    
    // Handle load error
    previewImage.onerror = function() {
      previewContainer.classList.add('hidden');
      
      // Display inline error message instead of modal
      let errorMsg = document.getElementById('imageUrlError');
      
      // Create error message element if it doesn't exist
      if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'imageUrlError';
        errorMsg.className = 'text-red-600 text-sm mt-1';
        imageUrlInput.parentNode.insertBefore(errorMsg, imageUrlInput.nextSibling);
      }
      
      // Show the error message
      errorMsg.textContent = 'Unable to load image. Please check the URL.';
      errorMsg.classList.remove('hidden');
    };
  }
  
  /**
   * Clear the image preview
   */
  function clearPreview() {
    previewContainer.classList.add('hidden');
    previewImage.src = '';
    clearInlineError();
  }

  // Helper function to show an inline error message
  function showInlineError(message) {
    let errorMsg = document.getElementById('imageUrlError');
    
    // Create error message element if it doesn't exist
    if (!errorMsg) {
      errorMsg = document.createElement('div');
      errorMsg.id = 'imageUrlError';
      errorMsg.className = 'text-red-600 text-sm mt-1';
      imageUrlInput.parentNode.insertBefore(errorMsg, imageUrlInput.nextSibling);
    }
    
    // Show the error message
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
  }
  
  // Helper function to clear inline error message
  function clearInlineError() {
    const errorMsg = document.getElementById('imageUrlError');
    if (errorMsg) {
      errorMsg.textContent = '';
      errorMsg.classList.add('hidden');
    }
  }

  // Preview image when button is clicked
  previewBtn.addEventListener('click', function() {
    const imageUrl = imageUrlInput.value.trim();
    
    if (!imageUrl) {
      showInlineError('Please enter an image URL first');
      return;
    }

    if (!validImageUrlRegex.test(imageUrl)) {
      showInlineError('Please enter a valid image URL ending in .jpg, .png, .gif, etc.');
      return;
    }

    clearInlineError();
    previewImageFromUrl(imageUrl);
  });

  // Remove preview when button is clicked
  removePreviewBtn.addEventListener('click', function() {
    clearPreview();
    imageUrlInput.value = '';
  });

  // Auto-preview with debounce when input changes
  let debounceTimer;
  
  function debouncePreview() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      const imageUrl = imageUrlInput.value.trim();
      if (imageUrl && validImageUrlRegex.test(imageUrl)) {
        clearInlineError();
        previewImageFromUrl(imageUrl);
      } else if (!imageUrl) {
        clearPreview();
      } else if (imageUrl) {
        // If URL doesn't pass validation but exists, clear preview but don't show error
        // (Only show validation errors when the preview button is clicked)
        previewContainer.classList.add('hidden');
      }
    }, 500);
  }
  
  // Handle paste event for immediate preview
  imageUrlInput.addEventListener('paste', function() {
    // Short timeout to let the paste event complete
    setTimeout(debouncePreview, 100);
  });
  
  // Handle input event for typing with debounce
  imageUrlInput.addEventListener('input', debouncePreview);
});
