(function setupReact3DUI() {
    function init() {
        if (!window.React || !window.ReactDOM) {
            console.warn('React 3D UI skipped: React libraries not found.');
            return;
        }

        const rootElement = document.getElementById('react3d-ui-root');
        const layoutWrapper = document.querySelector('.layout-wrapper');

        if (!rootElement || !layoutWrapper) {
            return;
        }

        const React = window.React;
        const useEffect = React.useEffect;
        const useState = React.useState;

        function React3DOverlay() {
            const [isActive, setIsActive] = useState(true);

            useEffect(function attachTiltTracking() {
                const maxTilt = 4;

                function onMove(event) {
                    if (!isActive) {
                        return;
                    }

                    const width = window.innerWidth || 1;
                    const height = window.innerHeight || 1;
                    const xRatio = (event.clientX / width - 0.5) * 2;
                    const yRatio = (event.clientY / height - 0.5) * 2;

                    const tiltY = (xRatio * maxTilt).toFixed(2);
                    const tiltX = (-yRatio * maxTilt).toFixed(2);

                    document.documentElement.style.setProperty('--rx3d-tilt-x', tiltX + 'deg');
                    document.documentElement.style.setProperty('--rx3d-tilt-y', tiltY + 'deg');
                }

                function resetTilt() {
                    document.documentElement.style.setProperty('--rx3d-tilt-x', '0deg');
                    document.documentElement.style.setProperty('--rx3d-tilt-y', '0deg');
                }

                window.addEventListener('mousemove', onMove, { passive: true });
                window.addEventListener('blur', resetTilt);

                return function cleanup() {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('blur', resetTilt);
                    resetTilt();
                };
            }, [isActive]);

            useEffect(function syncClass() {
                layoutWrapper.classList.toggle('rx3d-active', isActive);
            }, [isActive]);

            return React.createElement(
                React.Fragment,
                null,
                React.createElement(
                    'div',
                    { className: 'rx3d-overlay' },
                    React.createElement('div', { className: 'rx3d-grid' }),
                    React.createElement('div', { className: 'rx3d-orb one' }),
                    React.createElement('div', { className: 'rx3d-orb two' }),
                    React.createElement('div', { className: 'rx3d-orb three' })
                ),
                React.createElement(
                    'div',
                    { className: 'rx3d-chip' },
                    React.createElement('span', null, isActive ? '3D web mode on' : '3D web mode off'),
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            onClick: function onClick() {
                                setIsActive(function flip(value) {
                                    return !value;
                                });
                            }
                        },
                        isActive ? 'Disable' : 'Enable'
                    )
                )
            );
        }

        const root = window.ReactDOM.createRoot(rootElement);
        root.render(React.createElement(React3DOverlay));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
    }

    init();
})();
