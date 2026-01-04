/**
 * Cache Buster Script
 * Automatically adds version timestamps to prevent browser caching
 */

(function() {
    'use strict';
    
    const version = Date.now();
    console.log('🔄 Cache Buster Active - Version:', version);
    
    // Store version and check for updates
    const storedVersion = localStorage.getItem('app-version');
    if (storedVersion && storedVersion !== version.toString()) {
        console.log('🔄 New version detected, clearing cache...');
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
    }
    localStorage.setItem('app-version', version.toString());
    
    // Force refresh function
    window.forceRefresh = function() {
        console.log('🔄 Force refreshing...');
        localStorage.removeItem('app-version');
        location.reload(true);
    };
})();
