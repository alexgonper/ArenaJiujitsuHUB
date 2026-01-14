/**
 * Lazy Loading Utility
 * Carrega scripts e módulos sob demanda para melhorar performance inicial
 */

class LazyLoader {
    constructor() {
        this.loadedScripts = new Set();
        this.loadingScripts = new Map();
    }

    /**
     * Carrega um script JavaScript sob demanda
     * @param {string} src - URL do script
     * @param {Object} options - Opções de carregamento
     * @returns {Promise}
     */
    async loadScript(src, options = {}) {
        // Se já foi carregado, retorna imediatamente
        if (this.loadedScripts.has(src)) {
            return Promise.resolve();
        }

        // Se está sendo carregado, retorna a promise existente
        if (this.loadingScripts.has(src)) {
            return this.loadingScripts.get(src);
        }

        // Cria nova promise de carregamento
        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = options.async !== false; // async por padrão
            script.defer = options.defer || false;

            script.onload = () => {
                this.loadedScripts.add(src);
                this.loadingScripts.delete(src);
                console.log(`✅ Script carregado: ${src}`);
                resolve();
            };

            script.onerror = () => {
                this.loadingScripts.delete(src);
                console.error(`❌ Erro ao carregar script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });

        this.loadingScripts.set(src, loadPromise);
        return loadPromise;
    }

    /**
     * Carrega múltiplos scripts em paralelo
     * @param {Array<string>} scripts - Array de URLs
     * @returns {Promise}
     */
    async loadScripts(scripts) {
        return Promise.all(scripts.map(src => this.loadScript(src)));
    }

    /**
     * Carrega CSS sob demanda
     * @param {string} href - URL do CSS
     * @returns {Promise}
     */
    async loadCSS(href) {
        if (this.loadedScripts.has(href)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;

            link.onload = () => {
                this.loadedScripts.add(href);
                console.log(`✅ CSS carregado: ${href}`);
                resolve();
            };

            link.onerror = () => {
                console.error(`❌ Erro ao carregar CSS: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };

            document.head.appendChild(link);
        });
    }

    /**
     * Pre-carrega recursos para uso futuro
     * @param {string} href - URL do recurso
     * @param {string} as - Tipo do recurso (script, style, image, etc)
     */
    preload(href, as = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
        console.log(`🔄 Pre-loading: ${href}`);
    }

    /**
     * Carrega componente apenas quando visível (Intersection Observer)
     * @param {HTMLElement} element - Elemento a observar
     * @param {Function} callback - Função a executar quando visível
     * @param {Object} options - Opções do IntersectionObserver
     */
    loadWhenVisible(element, callback, options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '50px', // Carrega 50px antes de ficar visível
            threshold: 0.01
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(element);
                    observer.unobserve(element);
                }
            });
        }, { ...defaultOptions, ...options });

        observer.observe(element);
    }

    /**
     * Carrega módulo sob demanda com import dinâmico
     * @param {string} modulePath - Caminho do módulo
     * @returns {Promise}
     */
    async loadModule(modulePath) {
        try {
            const module = await import(modulePath);
            console.log(`✅ Módulo carregado: ${modulePath}`);
            return module;
        } catch (error) {
            console.error(`❌ Erro ao carregar módulo: ${modulePath}`, error);
            throw error;
        }
    }
}

// Singleton instance
const lazyLoader = new LazyLoader();

// Export para uso global
if (typeof window !== 'undefined') {
    window.LazyLoader = lazyLoader;
}

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoader;
}
