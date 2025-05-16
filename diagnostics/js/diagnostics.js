/**
 * Helper file for diagnosing any issues with the We Are Sierra Leone platform
 */

// Add an event listener to log all form submissions
document.addEventListener('DOMContentLoaded', () => {
    console.log('Diagnostics loaded - monitoring form submissions');
    
    // Find all forms in the document
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Add a submit listener to each form
        form.addEventListener('submit', (event) => {
            console.log('Form submission detected:', {
                formId: form.id || 'unnamed form',
                formAction: form.action,
                formMethod: form.method,
                formElements: Array.from(form.elements).map(el => ({
                    name: el.name,
                    id: el.id,
                    type: el.type,
                    value: el.type === 'password' ? '[REDACTED]' : el.value
                }))
            });
            
            // Don't interfere with normal processing
        });
    });
    
    // Monitor localStorage usage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        console.log(`localStorage.setItem('${key}', ${value.length > 100 ? value.substring(0, 100) + '...' : value})`);
        originalSetItem.apply(this, arguments);
    };
    
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = function(key) {
        const value = originalGetItem.apply(this, arguments);
        console.log(`localStorage.getItem('${key}') => ${value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null'}`);
        return value;
    };
    
    // Display environment info
    console.log('Environment information:', {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        href: window.location.href,
        baseUrl: window.baseUrl ? baseUrl() : 'baseUrl function not loaded yet',
        isGitHubPages: window.location.hostname.includes('github.io'),
        browserInfo: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
});
