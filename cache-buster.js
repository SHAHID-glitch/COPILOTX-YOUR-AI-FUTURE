/**
 * Cache Buster Script
 * Automatically adds version timestamps to prevent browser caching
 * Add this script to your HTML to bust cache on page load
 */

(function() {
    'use strict';
    
    // Generate a unique version based on current timestamp
    const version = Date.now();
    
    console.log('🔄 Cache Buster Active - Version:', version);
    
    /**
     * Add version parameter to all local stylesheets and scripts
     */
    function bustCache() {
        // Get all link tags (CSS)
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            // Only add version to local files (not external CDN)
            if (href && !href.startsWith('http') && !href.includes('?v=')) {
                link.href = href + '?v=' + version;
            }
        });
        
        // Get all script tags (JS)
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            // Only add version to local files (not external CDN)
            if (src && !src.startsWith('http') && !src.includes('?v=')) {
                const newScript = document.createElement('script');
                newScript.src = src + '?v=' + version;
                if (script.defer) newScript.defer = true;
                if (script.async) newScript.async = true;
                script.parentNode.replaceChild(newScript, script);
            }
        });
    }
    
    // Run cache buster immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bustCache);
    } else {
        bustCache();
    }
    
    /**
     * Store version in localStorage and check for updates
     */
    function checkVersion() {
        const storedVersion = localStorage.getItem('app-version');
        const currentVersion = version.toString();
        
        if (storedVersion && storedVersion !== currentVersion) {
            console.log('🔄 New version detected, clearing cache...');
            // Clear browser cache
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
        }
        
        localStorage.setItem('app-version', currentVersion);
    }
    
    checkVersion();
    
    /**
     * Add force refresh function to window
     * Usage: window.forceRefresh()
     */
    window.forceRefresh = function() {
        console.log('🔄 Force refreshing...');
        localStorage.removeItem('app-version');
        location.reload(true);
    };
    
    /**
     * Detect if user is doing hard refresh and update accordingly
     */
    window.addEventListener('keydown', function(e) {
        // Ctrl+Shift+R or Cmd+Shift+R
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
            console.log('🔄 Hard refresh detected');
            localStorage.removeItem('app-version');
        }
    });
    
})();
