/**
 * 🎨 Enhanced CSS - JavaScript Helpers
 * Add interactivity to your components with these simple functions
 */

// ==================== TOAST NOTIFICATIONS ====================
const Toast = {
    show(type, title, message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${this.getIcon(type)}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        document.body.appendChild(toast);
        
        // Close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }
        
        return toast;
    },
    
    hide(toast) {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    },
    
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || 'ℹ';
    },
    
    success(title, message, duration) {
        return this.show('success', title, message, duration);
    },
    
    error(title, message, duration) {
        return this.show('error', title, message, duration);
    },
    
    warning(title, message, duration) {
        return this.show('warning', title, message, duration);
    },
    
    info(title, message, duration) {
        return this.show('info', title, message, duration);
    }
};

// ==================== MODAL ====================
const Modal = {
    create(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const buttonsHTML = buttons.map(btn => `
            <button class="btn-modern ${btn.class || 'btn-gradient-primary'}" data-action="${btn.action}">
                ${btn.text}
            </button>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">${title}</div>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">${content}</div>
                ${buttons.length > 0 ? `<div class="modal-footer">${buttonsHTML}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close functionality
        const close = () => this.hide(modal);
        modal.querySelector('.modal-close').addEventListener('click', close);
        modal.querySelector('.modal-backdrop').addEventListener('click', close);
        
        // Button actions
        buttons.forEach(btn => {
            const buttonEl = modal.querySelector(`[data-action="${btn.action}"]`);
            if (buttonEl && btn.onClick) {
                buttonEl.addEventListener('click', () => {
                    btn.onClick(modal);
                });
            }
        });
        
        // Show modal
        setTimeout(() => modal.classList.add('active'), 10);
        
        return modal;
    },
    
    hide(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    },
    
    confirm(title, message, onConfirm, onCancel) {
        return this.create(title, message, [
            {
                text: 'Cancel',
                class: 'btn-ghost',
                action: 'cancel',
                onClick: (modal) => {
                    this.hide(modal);
                    if (onCancel) onCancel();
                }
            },
            {
                text: 'Confirm',
                class: 'btn-gradient-primary',
                action: 'confirm',
                onClick: (modal) => {
                    this.hide(modal);
                    if (onConfirm) onConfirm();
                }
            }
        ]);
    },
    
    alert(title, message, onClose) {
        return this.create(title, message, [
            {
                text: 'OK',
                class: 'btn-gradient-primary',
                action: 'ok',
                onClick: (modal) => {
                    this.hide(modal);
                    if (onClose) onClose();
                }
            }
        ]);
    }
};

// ==================== LOADING OVERLAY ====================
const Loading = {
    show(message = 'Loading...', type = 'spinner') {
        const loader = document.createElement('div');
        loader.className = 'loading-screen';
        loader.id = 'app-loading';
        
        const loaderHTML = {
            spinner: '<div class="loader-spinner"></div>',
            dots: '<div class="loader-dots"><span></span><span></span><span></span></div>',
            pulse: '<div class="loader-pulse"></div>',
            bars: '<div class="loader-bars"><span></span><span></span><span></span><span></span><span></span></div>'
        };
        
        loader.innerHTML = `
            <div>
                ${loaderHTML[type] || loaderHTML.spinner}
                <p style="color: white; margin-top: 1.5rem; font-size: 1.125rem;">${message}</p>
            </div>
        `;
        
        document.body.appendChild(loader);
        return loader;
    },
    
    hide() {
        const loader = document.getElementById('app-loading');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 600);
        }
    }
};

// ==================== PROGRESS BAR ====================
const Progress = {
    create(container, initialValue = 0) {
        const progressEl = document.createElement('div');
        progressEl.className = 'progress-modern';
        progressEl.innerHTML = `
            <div class="progress-bar-modern" style="width: ${initialValue}%;"></div>
        `;
        
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        container.appendChild(progressEl);
        
        return {
            element: progressEl,
            bar: progressEl.querySelector('.progress-bar-modern'),
            
            setValue(value) {
                this.bar.style.width = `${Math.min(100, Math.max(0, value))}%`;
            },
            
            increment(amount = 1) {
                const current = parseFloat(this.bar.style.width) || 0;
                this.setValue(current + amount);
            },
            
            setStriped(striped = true) {
                if (striped) {
                    this.bar.classList.add('progress-striped');
                } else {
                    this.bar.classList.remove('progress-striped');
                }
            },
            
            setGlow(glow = true) {
                if (glow) {
                    this.bar.classList.add('progress-glow');
                } else {
                    this.bar.classList.remove('progress-glow');
                }
            },
            
            destroy() {
                this.element.remove();
            }
        };
    }
};

// ==================== ANIMATION HELPERS ====================
const Animate = {
    fadeIn(element, duration = 500) {
        element.style.animation = `fadeIn ${duration}ms ease-out`;
    },
    
    slideUp(element, duration = 500) {
        element.style.animation = `slideUp ${duration}ms ease-out`;
    },
    
    scaleIn(element, duration = 500) {
        element.style.animation = `scaleIn ${duration}ms ease-out`;
    },
    
    wiggle(element) {
        element.classList.add('animate-wiggle');
        setTimeout(() => element.classList.remove('animate-wiggle'), 500);
    },
    
    shake(element) {
        element.classList.add('animate-shake');
        setTimeout(() => element.classList.remove('animate-shake'), 500);
    }
};

// ==================== UTILITY FUNCTIONS ====================
const Utils = {
    // Copy text to clipboard
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.success('Copied!', 'Text copied to clipboard');
        }).catch(() => {
            Toast.error('Error', 'Failed to copy text');
        });
    },
    
    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Random ID generator
    generateId(prefix = 'id') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple effect to all buttons
    document.querySelectorAll('.btn-modern').forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                width: 100px;
                height: 100px;
                left: ${x - 50}px;
                top: ${y - 50}px;
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Close toast on click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('toast-close')) {
            const toast = e.target.closest('.toast');
            if (toast) Toast.hide(toast);
        }
    });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        from {
            opacity: 1;
            transform: scale(0);
        }
        to {
            opacity: 0;
            transform: scale(4);
        }
    }
`;
document.head.appendChild(style);

// ==================== EXPORT ====================
// Make available globally
window.Toast = Toast;
window.Modal = Modal;
window.Loading = Loading;
window.Progress = Progress;
window.Animate = Animate;
window.Utils = Utils;

// ==================== USAGE EXAMPLES ====================
/*

// Toast Notifications
Toast.success('Success!', 'Your changes have been saved');
Toast.error('Error', 'Something went wrong');
Toast.warning('Warning', 'Please check your input');
Toast.info('Info', 'New update available');

// Modal Dialogs
Modal.alert('Alert', 'This is an alert message');
Modal.confirm('Confirm', 'Are you sure?', 
    () => console.log('Confirmed'),
    () => console.log('Cancelled')
);

// Custom Modal
Modal.create('Custom Modal', '<p>Custom content here</p>', [
    {
        text: 'Action',
        class: 'btn-gradient-primary',
        action: 'custom',
        onClick: (modal) => {
            console.log('Action clicked');
            Modal.hide(modal);
        }
    }
]);

// Loading Overlay
Loading.show('Processing...', 'spinner');
setTimeout(() => Loading.hide(), 2000);

// Progress Bar
const progress = Progress.create('#container', 0);
progress.setValue(50);
progress.increment(10);
progress.setGlow(true);
progress.setStriped(true);

// Animations
Animate.fadeIn(document.querySelector('.element'));
Animate.slideUp(document.querySelector('.element'));
Animate.wiggle(document.querySelector('.button'));
Animate.shake(document.querySelector('.button'));

// Utilities
Utils.copyToClipboard('Hello World');
console.log(Utils.formatNumber(1234567)); // "1,234,567"
const debouncedFunc = Utils.debounce(() => console.log('Debounced'), 300);
const id = Utils.generateId('btn'); // "btn-xj4k2l9s"

*/
