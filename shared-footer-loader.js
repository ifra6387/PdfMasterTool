// Shared Footer Loader - Load footer component dynamically
// This allows true DRY (Don't Repeat Yourself) principle across all pages

async function loadSharedFooter() {
    try {
        const response = await fetch('/shared-footer.html');
        const footerHTML = await response.text();
        
        // Find existing footer and replace it
        const existingFooter = document.querySelector('footer');
        if (existingFooter) {
            existingFooter.outerHTML = footerHTML;
        } else {
            // If no footer exists, append to body
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
        
        // Reinitialize Lucide icons after footer is loaded
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.log('Could not load shared footer:', error);
    }
}

// Auto-load footer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSharedFooter);
} else {
    loadSharedFooter();
}