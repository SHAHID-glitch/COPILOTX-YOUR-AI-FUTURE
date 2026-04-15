/*
 * CSS Helpers
 * Small utilities used by the standalone UI.
 */

(function () {
    'use strict';

    window.setCssVar = function setCssVar(name, value, target) {
        const element = target || document.documentElement;
        if (!element || !name) return;
        element.style.setProperty(name, value);
    };

    window.getCssVar = function getCssVar(name, target) {
        const element = target || document.documentElement;
        if (!element || !name) return '';
        return getComputedStyle(element).getPropertyValue(name).trim();
    };
})();
