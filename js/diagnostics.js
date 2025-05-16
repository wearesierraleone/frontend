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
    
    // Check post status system on admin and index pages
    runPostStatusDiagnostics();
    
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

/**
 * Run diagnostics specific to the post status system
 */
function runPostStatusDiagnostics() {
    // Only run on relevant pages
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const isAdminPage = window.location.pathname.endsWith('admin.html');
    
    if (!isIndexPage && !isAdminPage) {
        return;
    }
    
    console.log('Running post status diagnostics...');
    
    // Check for approved.json data
    fetch('data/approved.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(posts => {
            // Count posts by status
            const approved = posts.filter(post => post.status === 'approved').length;
            const pending = posts.filter(post => post.status === 'pending').length;
            const rejected = posts.filter(post => post.status === 'rejected').length;
            const unknown = posts.filter(post => 
                post.status !== 'approved' && 
                post.status !== 'pending' && 
                post.status !== 'rejected'
            ).length;
            
            console.log('Post status diagnostics:', {
                total: posts.length,
                approved,
                pending,
                rejected,
                unknown,
                page: isIndexPage ? 'index.html' : 'admin.html'
            });
            
            // Check for posts without required fields
            const missingFields = posts.filter(post => 
                !post.id || !post.title || !post.body || post.status === undefined
            );
            
            if (missingFields.length > 0) {
                console.warn(`Found ${missingFields.length} posts with missing required fields`);
            }
            
            // Page-specific checks
            if (isIndexPage) {
                // On index page, verify filtering is working
                const visiblePostIds = Array.from(document.querySelectorAll('#postList a[href^="post.html?id="]'))
                    .map(a => {
                        const match = a.href.match(/id=([^&]+)/);
                        return match ? match[1] : null;
                    })
                    .filter(Boolean);
                
                // Check if any non-approved posts are visible
                const nonApprovedVisiblePosts = posts
                    .filter(post => post.status !== 'approved' && visiblePostIds.includes(post.id));
                
                if (nonApprovedVisiblePosts.length > 0) {
                    console.error('ERROR: Found non-approved posts visible on index page:', nonApprovedVisiblePosts);
                } else {
                    console.log('✓ Index page correctly shows only approved posts');
                }
            }
        })
        .catch(error => {
            console.error('Error in post status diagnostics:', error);
        });
}
