/**
 * PM2 Ecosystem Configuration
 * Otimização de performance Node.js com clustering e memory limits
 */

module.exports = {
  apps: [{
    name: 'arena-hub-api',
    script: './dist/server.js',
    
    // Clustering - usa todos os CPUs disponíveis
    instances: 'max', // ou número específico como 2, 4, etc
    exec_mode: 'cluster',
    
    // Otimizações de Memória
    node_args: [
      '--max-old-space-size=2048',  // Limite de heap: 2GB
      '--max-semi-space-size=64',    // Otimiza garbage collection
      '--optimize-for-size',          // Otimiza para menor uso de memória
    ],
    
    // Auto-restart em caso de uso excessivo de memória
    max_memory_restart: '2G',
    
    // Environment
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logs
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Performance
    listen_timeout: 10000,
    kill_timeout: 5000,
    
    // Auto-restart
    autorestart: true,
    watch: false, // Desabilitado em produção
    max_restarts: 10,
    min_uptime: '10s',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    
    // Monitoramento
    instance_var: 'INSTANCE_ID'
  }]
};
