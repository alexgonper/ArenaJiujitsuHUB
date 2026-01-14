#!/bin/bash

# Script de Ativação das Otimizações Avançadas
# ArenaHub Performance Boost

echo "╔════════════════════════════════════════════════════════╗"
echo "║   🚀 ATIVAÇÃO DE OTIMIZAÇÕES AVANÇADAS - ArenaHub    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função de aviso
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Função de erro
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função de info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "📋 Checklist de Ativação:"
echo ""

# 1. Verificar Node.js version
echo "1️⃣  Verificando versão do Node.js..."
NODE_VERSION=$(node --version)
if [[ $? -eq 0 ]]; then
    success "Node.js instalado: $NODE_VERSION"
else
    error "Node.js não encontrado!"
    exit 1
fi
echo ""

# 2. Verificar se PM2 está instalado
echo "2️⃣  Verificando PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    success "PM2 instalado: $PM2_VERSION"
else
    warning "PM2 não instalado"
    read -p "   Deseja instalar PM2? (s/n): " install_pm2
    if [[ $install_pm2 == "s" || $install_pm2 == "S" ]]; then
        info "Instalando PM2 globalmente..."
        npm install -g pm2
        if [[ $? -eq 0 ]]; then
            success "PM2 instalado com sucesso!"
        else
            error "Falha ao instalar PM2"
        fi
    fi
fi
echo ""

# 3. Entrar na pasta server
echo "3️⃣  Navegando para pasta server..."
cd server
if [[ $? -eq 0 ]]; then
    success "Diretório server encontrado"
else
    error "Diretório server não encontrado"
    exit 1
fi
echo ""

# 4. Instalar dependências (caso necessário)
echo "4️⃣  Verificando dependências..."
if [ -d "node_modules" ]; then
    success "node_modules já existe"
else
    info "Instalando dependências..."
    npm install
    success "Dependências instaladas"
fi
echo ""

# 5. Otimizar banco de dados
echo "5️⃣  Otimizando banco de dados (criando índices)..."
read -p "   Deseja criar índices otimizados no banco? (s/n): " optimize_db
if [[ $optimize_db == "s" || $optimize_db == "S" ]]; then
    info "Executando optimizeDatabase.js..."
    node scripts/optimizeDatabase.js
    if [[ $? -eq 0 ]]; then
        success "Banco de dados otimizado!"
    else
        warning "Houve um erro na otimização (verifique se MongoDB está rodando)"
    fi
else
    warning "Pulando otimização de banco"
fi
echo ""

# 6. Iniciar com PM2
echo "6️⃣  Iniciando servidor com PM2..."
read -p "   Deseja iniciar o servidor com PM2 (cluster mode)? (s/n): " start_pm2
if [[ $start_pm2 == "s" || $start_pm2 == "S" ]]; then
    info "Parando instâncias PM2 existentes..."
    pm2 stop arena-hub-api 2>/dev/null
    pm2 delete arena-hub-api 2>/dev/null
    
    info "Iniciando servidor com PM2..."
    npm run pm2:start
    
    if [[ $? -eq 0 ]]; then
        success "Servidor iniciado com PM2!"
        echo ""
        info "Comandos úteis:"
        echo "   - Ver status: pm2 status"
        echo "   - Ver logs: npm run pm2:logs"
        echo "   - Monitorar: npm run pm2:monit"
        echo "   - Parar: npm run pm2:stop"
        echo "   - Reiniciar: npm run pm2:restart"
    else
        error "Falha ao iniciar PM2"
    fi
else
    warning "Servidor não iniciado com PM2"
    info "Para iniciar manualmente: npm run pm2:start"
fi
echo ""

# 7. Verificar health
echo "7️⃣  Verificando health do servidor..."
sleep 2
HEALTH_CHECK=$(curl -s http://localhost:5000/health 2>/dev/null)
if [[ $? -eq 0 ]]; then
    success "Servidor respondendo corretamente!"
    echo "   $(echo $HEALTH_CHECK | jq -r '.message' 2>/dev/null || echo 'API is running')"
else
    warning "Servidor não está respondendo (pode levar alguns segundos)"
fi
echo ""

# 8. Verificar memória
echo "8️⃣  Uso de memória atual..."
cd ..
if [ -f "check-memory.sh" ]; then
    sh check-memory.sh
else
    warning "Script check-memory.sh não encontrado"
fi
echo ""

# Resumo final
echo "╔════════════════════════════════════════════════════════╗"
echo "║              🎉 ATIVAÇÃO CONCLUÍDA!                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Próximos passos:"
echo ""
echo "1. Reinicie o Antigravity (Cmd+Q e reabra) para aplicar .vscode/settings.json"
echo "2. Monitore o servidor: npm run pm2:monit"
echo "3. Veja os logs: npm run pm2:logs"
echo "4. Teste a performance: curl http://localhost:5000/health"
echo ""
echo "📖 Documentação completa: ADVANCED_OPTIMIZATIONS_REPORT.md"
echo ""
success "Otimizações ativadas com sucesso! 🚀"
echo ""
