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
    };
    
    // Handle load error
    previewImage.onerror = function() {
      previewContainer.classList.add('hidden');
      showSuccessModal('Unable to load image. Please check the URL.', null, 3000);
    };
  }
  
  /**
   * Clear the image preview
   */
  function clearPreview() {
    previewContainer.classList.add('hidden');
    previewImage.src = '';
  }

  // Preview image when button is clicked
  previewBtn.addEventListener('click', function() {
    const imageUrl = imageUrlInput.value.trim();
    
    if (!imageUrl) {
      showSuccessModal('Please enter an image URL first', null, 2000);
      return;
    }

    if (!validImageUrlRegex.test(imageUrl)) {
      showSuccessModal('Please enter a valid image URL ending in .jpg, .png, .gif, etc.', null, 3000);
      return;
    }

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
        previewImageFromUrl(imageUrl);
      } else if (!imageUrl) {
        clearPreview();
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
