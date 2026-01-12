/**
 * Mobile Detection & Responsive Adapter
 * Detecta automaticamente o dispositivo e adapta a interface
 */

class MobileDetector {
    constructor() {
        // Check for stored simulation
        const storedSimulation = sessionStorage.getItem('arenaDeviceSimulation');

        if (storedSimulation) {
            this.simulationMode = storedSimulation;
            this.isMobile = (storedSimulation === 'mobile');
            this.isTablet = (storedSimulation === 'tablet');
            this.isDesktop = (storedSimulation === 'desktop');
        } else {
            this.simulationMode = null;
            this.isMobile = this.detectMobile();
            this.isTablet = this.detectTablet();
            this.isDesktop = !this.isMobile && !this.isTablet;
        }

        this.orientation = this.getOrientation();

        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            this.orientation = this.getOrientation();
            this.handleOrientationChange();
        });

        // Listen for resize events
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Expose helper methods globally
        window.simulateDevice = this.simulate.bind(this);
        window.resetDeviceSimulation = this.resetSimulation.bind(this);
    }

    simulate(type) {
        if (!['mobile', 'tablet', 'desktop'].includes(type)) return;

        sessionStorage.setItem('arenaDeviceSimulation', type);
        this.simulationMode = type;
        this.handleResize(); // Trigger update

        console.log(`[MobileDetector] Simulating ${type} mode (persistent)`);
    }

    resetSimulation() {
        sessionStorage.removeItem('arenaDeviceSimulation');
        this.simulationMode = null;
        this.handleResize(); // Trigger update to auto-detection

        console.log('[MobileDetector] Simulation reset to auto-detection');
    }

    detectMobile() {
        // If simulation is active, respect it
        if (this.simulationMode) {
            return this.simulationMode === 'mobile';
        }

        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Check for mobile devices
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUA = mobileRegex.test(userAgent);

        // Check screen size
        const isMobileScreen = window.innerWidth <= 768;

        // Check touch capability
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        return isMobileUA || (isMobileScreen && hasTouch);
    }

    detectTablet() {
        if (this.simulationMode) {
            return this.simulationMode === 'tablet';
        }

        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isTabletUA = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
        const isTabletScreen = window.innerWidth > 768 && window.innerWidth <= 1024;

        return isTabletUA || isTabletScreen;
    }

    getOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    handleOrientationChange() {
        this.orientation = this.getOrientation(); // Ensure orientation updates
        console.log('Orientation changed to:', this.orientation);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('arenaOrientationChange', {
            detail: { orientation: this.orientation }
        }));

        // Re-render widgets if needed
        if (window.widgetSystem) {
            window.widgetSystem.handleResponsiveChange();
        }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        const wasTablet = this.isTablet;

        if (this.simulationMode) {
            this.isMobile = (this.simulationMode === 'mobile');
            this.isTablet = (this.simulationMode === 'tablet');
            this.isDesktop = (this.simulationMode === 'desktop');
        } else {
            this.isMobile = this.detectMobile();
            this.isTablet = this.detectTablet();
            this.isDesktop = !this.isMobile && !this.isTablet;
        }

        this.orientation = this.getOrientation();

        // If device type changed or forced update
        if (wasMobile !== this.isMobile || wasTablet !== this.isTablet || this.simulationMode) {
            console.log('Device state updated:', {
                isMobile: this.isMobile,
                isTablet: this.isTablet,
                isDesktop: this.isDesktop
            });

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('arenaDeviceChange', {
                detail: {
                    isMobile: this.isMobile,
                    isTablet: this.isTablet,
                    isDesktop: this.isDesktop
                }
            }));

            // Apply appropriate styles
            this.applyDeviceStyles();
        }
    }

    applyDeviceStyles() {
        const body = document.body;

        // Remove all device classes
        body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');

        // Add appropriate class
        if (this.isMobile) {
            body.classList.add('is-mobile');
        } else if (this.isTablet) {
            body.classList.add('is-tablet');
        } else {
            body.classList.add('is-desktop');
        }

        // Add orientation class
        body.classList.remove('orientation-portrait', 'orientation-landscape');
        body.classList.add(`orientation-${this.orientation}`);
    }

    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isDesktop: this.isDesktop,
            orientation: this.orientation,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent
        };
    }

    // Utility: Debounce function
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
    }
}

// Initialize detector
const deviceDetector = new MobileDetector();
deviceDetector.applyDeviceStyles();

// Log device info
console.log('🥋 Arena Hub - Device Detection:', deviceDetector.getDeviceInfo());

// Export for global use
window.deviceDetector = deviceDetector;
