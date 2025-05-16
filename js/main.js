/**
 * Main JavaScript file for the Sierra Leone civic platform
 * Handles global functionality and initialization
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize footer on all pages
  initFooter();
  
  // Initialize theme preferences
  initThemePreference();
  
  // Add global error handler
  setupGlobalErrorHandling();
});

/**
 * Initializes the footer on all pages
 */
function initFooter() {
  // Check if we need to inject a footer
  if (!document.querySelector('footer') && typeof createFooter === 'function') {
    const footer = createFooter();
    document.body.appendChild(footer);
  }
}

/**
 * Initializes theme preference (if implemented)
 */
function initThemePreference() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  
  // Apply theme if it exists
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  // Add theme toggle button (if present)
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      // Toggle dark mode
      document.documentElement.classList.toggle('dark');
      
      // Save preference
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
}

/**
 * Sets up global error handling
 */
function setupGlobalErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Don't show errors to users in production
    if (location.hostname !== 'localhost') {
      return;
    }
    
    // For development only - show errors in a nicer way
    if (typeof showSuccessModal === 'function') {
      showSuccessModal(
        `An error occurred: ${event.error?.message || 'Unknown error'}`, 
        null, 
        0, 
        'error'
      );
    }
  });
  
  // Also handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}
