/**
 * Theme Manager for Arena Jiu-Jitsu Hub
 * Handles light/dark mode persistence and UI synchronization
 */

const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('arena-theme') || 'light';
        this.setTheme(savedTheme);
        this.addToggleShortcut();
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('arena-theme', theme);
        
        // Update all toggle buttons in the page
        document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#FF6B00');
        }
    },

    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Optional: show toast
        if (typeof showToast === 'function') {
            showToast(`Tema ${newTheme === 'dark' ? 'Escuro' : 'Claro'} Ativado`);
        }
    },

    addToggleShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 't') {
                this.toggle();
            }
        });
    }
};

// Initialize as soon as possible
ThemeManager.init();

window.toggleTheme = () => ThemeManager.toggle();
