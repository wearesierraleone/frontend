/**
 * Creates and returns a footer element with navigation and site information
 * @returns {HTMLElement} The footer element
 */
function createFooter() {
    // Get current year for copyright
    const currentYear = new Date().getFullYear();
    
    // Create footer element
    const footerElement = document.createElement('footer');
    footerElement.className = "bg-gray-800 text-white mt-16 px-6 py-12";
    footerElement.setAttribute('role', 'contentinfo');
    
    // Footer content
    footerElement.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0 mr-2" aria-hidden="true">
              <svg class="h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold">We Are Sierra Leone</h2>
          </div>
          <p class="text-gray-400 mb-4">A civic platform empowering citizens of Sierra Leone to voice their concerns anonymously, create petitions, and engage in meaningful dialogue.</p>
        </div>
        
        <nav aria-labelledby="footer-navigation">
          <h3 id="footer-navigation" class="text-lg font-medium mb-4">Quick Links</h3>
          <ul class="space-y-2">
            <li><a href="index.html" class="text-blue-300 hover:text-white transition-colors focus:outline-none focus:underline">Home</a></li>
            <li><a href="submit.html" class="text-blue-300 hover:text-white transition-colors focus:outline-none focus:underline">Submit a Post</a></li>
            <li><a href="petitions.html" class="text-blue-300 hover:text-white transition-colors focus:outline-none focus:underline">Petitions</a></li>
            <li><a href="faq.html" class="text-blue-300 hover:text-white transition-colors focus:outline-none focus:underline">FAQ</a></li>
          </ul>
        </nav>
        
        <div>
          <h3 class="text-lg font-medium mb-4">About This Platform</h3>
          <p class="text-gray-400">This platform is designed to provide a safe space for citizens to voice their concerns about civic issues. All posts are anonymous by default.</p>
        </div>
      </div>
      
      <div class="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-center items-center">
        <p class="text-gray-400">&copy; ${currentYear} We Are Sierra Leone. All rights reserved.</p>
          <a href="terms.html" class="text-blue-300 hover:text-white transition-colors focus:outline-none focus:underline ml-2 mt-2 md:mt-0">Terms of Service</a>
          <a href="privacy.html" class="text-blue-300 hover:text-white transition-colors focus:outline-none focus:underline ml-2 mt-2 md:mt-0">Privacy Policy</a>
          <a href="admin.html" class="text-xs text-gray-500 hover:text-gray-400 ml-2 mt-2 md:mt-0">Moderator Access</a>
      </div>
    </div>
    `;
    
    return footerElement;
}