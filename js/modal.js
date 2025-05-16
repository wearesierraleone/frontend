/**
 * Display a modal with a message and optional redirect
 * 
 * @param {string} message - The message to display in the modal
 * @param {string|null} redirectTo - URL to redirect to after confirmation/delay (optional)
 * @param {number} delay - Delay in ms before auto-redirect (if redirectTo is provided)
 * @param {string} type - Type of modal: 'info', 'success', 'error', 'warning'
 */
function showSuccessModal(message = 'Your action was successful.', redirectTo = null, delay = 2000, type = 'info') {
  // Remove any existing modals
  const existingModals = document.querySelectorAll('.js-modal');
  existingModals.forEach(modal => document.body.removeChild(modal));
  
  // Determine icon and colors based on type
  let icon = '️ℹ️';
  let titleColor = 'text-blue-600';
  let buttonColor = 'bg-blue-600 hover:bg-blue-700';
  
  switch(type) {
    case 'success':
      icon = '✅';
      titleColor = 'text-green-600';
      buttonColor = 'bg-green-600 hover:bg-green-700';
      break;
    case 'error':
      icon = '❌';
      titleColor = 'text-red-600';
      buttonColor = 'bg-red-600 hover:bg-red-700';
      break;
    case 'warning':
      icon = '⚠️';
      titleColor = 'text-amber-600';
      buttonColor = 'bg-amber-600 hover:bg-amber-700';
      break;
    default: // info
      break;
  }
  
  // Create modal element
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 js-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');

  // Create modal content
  modal.innerHTML = `
    <div class="bg-white rounded p-6 shadow-lg text-center max-w-sm w-full" role="document">
      <h2 id="modal-title" class="text-xl font-bold ${titleColor} mb-2">${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
      <p class="text-gray-700 mb-4">${message}</p>
      <button id="confirmRedirect" class="${buttonColor} text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">OK</button>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(modal);
  
  // Focus the button for accessibility
  const confirmButton = document.getElementById('confirmRedirect');
  confirmButton.focus();
  
  // Set up event listeners
  confirmButton.addEventListener('click', () => {
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      document.body.removeChild(modal);
    }
  });
  
  // Close on ESC key
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
    }
  });
  
  // Handle auto-redirect if specified
  let redirectTimeout;
  if (redirectTo && delay > 0) {
    redirectTimeout = setTimeout(() => {
      window.location.href = redirectTo;
    }, delay);
  }
  
  // Return a function to manually close the modal
  return {
    close: () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }
  };
}

/**
 * Display a general purpose modal with custom content
 * 
 * @param {string} content - The HTML content to display in the modal
 * @param {Function} callback - Optional function to call after the modal is displayed
 */
function showModal(content, callback = null) {
  // Remove any existing modals
  const existingModals = document.querySelectorAll('.js-modal');
  existingModals.forEach(modal => document.body.removeChild(modal));
  
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.id = 'modal';
  modalContainer.className = 'js-modal fixed inset-0 flex items-center justify-center z-50';
  
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 bg-black bg-opacity-50';
  backdrop.onclick = () => document.body.removeChild(modalContainer);
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10 overflow-hidden';
  modalContent.innerHTML = content;
  
  // Add close button if not present in content
  if (!content.includes('close-modal-btn')) {
    const closeButton = document.createElement('button');
    closeButton.id = 'close-modal-btn';
    closeButton.className = 'absolute top-2 right-2 text-gray-500 hover:text-gray-800';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => document.body.removeChild(modalContainer);
    modalContent.appendChild(closeButton);
  }
  
  // Assemble modal
  modalContainer.appendChild(backdrop);
  modalContainer.appendChild(modalContent);
  
  // Add to document
  document.body.appendChild(modalContainer);
  
  // Execute callback if provided
  if (callback && typeof callback === 'function') {
    callback();
  }
  
  // Return the modal container
  return modalContainer;
}
