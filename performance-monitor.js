/**
 * Performance Monitor
 * Monitora métricas de performance do frontend
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: null,
            firstPaint: null,
            firstContentfulPaint: null,
            domInteractive: null,
            domComplete: null,
            resources: []
        };
        
        this.initialized = false;
    }

    /**
     * Inicializa o monitoramento de performance
     */
    init() {
        if (this.initialized) return;
        
        // Aguarda o load completo
        if (document.readyState === 'complete') {
            this._collectMetrics();
        } else {
            window.addEventListener('load', () => this._collectMetrics());
        }
        
        this.initialized = true;
    }

    /**
     * Coleta métricas de performance
     */
    _collectMetrics() {
        try {
            const perfData = window.performance;
            const timing = perfData.timing;
            const navigation = perfData.getEntriesByType('navigation')[0];
            const paint = perfData.getEntriesByType('paint');

            // Timing Navigation
            if (timing) {
                this.metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
                this.metrics.domInteractive = timing.domInteractive - timing.navigationStart;
                this.metrics.domComplete = timing.domComplete - timing.navigationStart;
            }

            // Paint Timing
            if (paint) {
                paint.forEach(entry => {
                    if (entry.name === 'first-paint') {
                        this.metrics.firstPaint = entry.startTime;
                    } else if (entry.name === 'first-contentful-paint') {
                        this.metrics.firstContentfulPaint = entry.startTime;
                    }
                });
            }

            // Resource Timing
            const resources = perfData.getEntriesByType('resource');
            this.metrics.resources = resources.map(resource => ({
                name: resource.name,
                type: resource.initiatorType,
                duration: resource.duration,
                size: resource.transferSize || 0
            }));

            // Log métricas
            this._logMetrics();

        } catch (error) {
            console.error('Erro ao coletar métricas:', error);
        }
    }

    /**
     * Exibe métricas no console
     */
    _logMetrics() {
        console.group('📊 Performance Metrics');
        
        if (this.metrics.pageLoad) {
            console.log(`⏱️  Page Load: ${this.metrics.pageLoad.toFixed(2)}ms`);
        }
        
        if (this.metrics.firstPaint) {
            console.log(`🎨 First Paint: ${this.metrics.firstPaint.toFixed(2)}ms`);
        }
        
        if (this.metrics.firstContentfulPaint) {
            console.log(`🖼️  First Contentful Paint: ${this.metrics.firstContentfulPaint.toFixed(2)}ms`);
        }
        
        if (this.metrics.domInteractive) {
            console.log(`⚡ DOM Interactive: ${this.metrics.domInteractive.toFixed(2)}ms`);
        }

        // Análise de recursos pesados
        const heavyResources = this.metrics.resources
            .filter(r => r.duration > 100)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);

        if (heavyResources.length > 0) {
            console.group('⚠️  Recursos Lentos (>100ms)');
            heavyResources.forEach(r => {
                console.log(`${r.type}: ${r.name.split('/').pop()} - ${r.duration.toFixed(2)}ms`);
            });
            console.groupEnd();
        }

        // Total de recursos
        const totalSize = this.metrics.resources.reduce((sum, r) => sum + r.size, 0);
        console.log(`📦 Total Resources: ${this.metrics.resources.length} (${(totalSize / 1024).toFixed(2)} KB)`);
        
        console.groupEnd();
    }

    /**
     * Marca um ponto de performance customizado
     * @param {string} name - Nome do mark
     */
    mark(name) {
        if (window.performance && window.performance.mark) {
            window.performance.mark(name);
        }
    }

    /**
     * Mede o tempo entre dois marks
     * @param {string} name - Nome da medida
     * @param {string} startMark - Mark inicial
     * @param {string} endMark - Mark final
     */
    measure(name, startMark, endMark) {
        if (window.performance && window.performance.measure) {
            try {
                window.performance.measure(name, startMark, endMark);
                const measures = window.performance.getEntriesByName(name);
                if (measures.length > 0) {
                    console.log(`⏱️  ${name}: ${measures[0].duration.toFixed(2)}ms`);
                }
            } catch (error) {
                console.error('Erro ao medir performance:', error);
            }
        }
    }

    /**
     * Monitora uso de memória (Chrome only)
     */
    checkMemory() {
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            console.group('💾 Memory Usage');
            console.log(`Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
            console.log(`Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
            console.log(`Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
            console.groupEnd();
        } else {
            console.log('⚠️  Memory API não disponível neste navegador');
        }
    }

    /**
     * Retorna report de performance
     */
    getReport() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }
}

// Singleton
const perfMonitor = new PerformanceMonitor();

// Auto-inicializar em desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    perfMonitor.init();
}

// Export global
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = perfMonitor;
}

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
