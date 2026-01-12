#!/bin/bash

# Arena Hub - Iniciar Todos os Servidores
# Este script inicia MongoDB, Backend e Frontend automaticamente

echo ""
echo "============================================================"
echo "🥋  ARENA JIU-JITSU HUB - Iniciar Todos os Servidores"
echo "============================================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Diretório base
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# ============================================================
# 1. VERIFICAR E INICIAR MONGODB
# ============================================================

echo -e "${CYAN}[1/3] Verificando MongoDB...${NC}"
echo ""

# Verificar se MongoDB está instalado
if ! command -v mongod &> /dev/null; then
    echo -e "${RED}❌ MongoDB não está instalado!${NC}"
    echo ""
    echo "Instalando MongoDB..."
    brew tap mongodb/brew
    brew install mongodb-community@7.0
fi

echo -e "${GREEN}✓${NC} MongoDB instalado"

# Verificar se MongoDB está rodando
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}▶${NC} Iniciando MongoDB..."
    brew services start mongodb-community@7.0
    sleep 3
    echo -e "${GREEN}✓${NC} MongoDB iniciado"
else
    echo -e "${GREEN}✓${NC} MongoDB já está rodando"
fi

# Verificar conexão com MongoDB
echo -e "${BLUE}⏳${NC} Testando conexão com MongoDB..."
if mongosh --eval "db.version()" --quiet 2>/dev/null || mongo --eval "db.version()" --quiet 2>/dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB conectado com sucesso!"
else
    echo -e "${YELLOW}⚠${NC}  MongoDB pode não estar totalmente pronto, mas continuando..."
fi

echo ""

# ============================================================
# 2. INICIAR BACKEND (Node.js + Express)
# ============================================================

echo -e "${CYAN}[2/3] Iniciando Backend...${NC}"
echo ""

# Ir para diretório do servidor
cd "$BASE_DIR/server" 2>/dev/null || {
    echo -e "${RED}❌ Diretório 'server' não encontrado!${NC}"
    exit 1
}

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙${NC}  Criando arquivo .env..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Arquivo .env criado"
    else
        echo -e "${YELLOW}⚠${NC}  .env.example não encontrado, criando .env básico..."
        cat > .env << EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arena-matrix
API_PREFIX=/api/v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
        echo -e "${GREEN}✓${NC} Arquivo .env básico criado"
    fi
fi

# Verificar se dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦${NC} Instalando dependências do backend..."
    npm install
fi

# Perguntar se deve popular o banco
echo ""
echo -e "${YELLOW}Deseja popular o banco de dados?${NC}"
echo "1. Sim (recomendado na primeira vez)"
echo "2. Não (banco já está populado)"
echo ""
read -p "Opção (1-2): " seed_choice

if [ "$seed_choice" = "1" ]; then
    echo ""
    echo -e "${BLUE}🌱 Populando banco de dados...${NC}"
    npm run seed
    echo ""
fi

# Iniciar backend em background
echo -e "${GREEN}🚀 Iniciando servidor backend...${NC}"
echo -e "${BLUE}   Backend rodando em: http://localhost:5000${NC}"
echo ""

# Usar npm run dev em background
npm run dev > "$BASE_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BASE_DIR/.backend.pid"

sleep 2

# Verificar se backend iniciou
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend iniciado (PID: $BACKEND_PID)"
else
    echo -e "${RED}❌ Erro ao iniciar backend${NC}"
    echo "Verifique o log: $BASE_DIR/backend.log"
    exit 1
fi

echo ""

# ============================================================
# 3. INICIAR FRONTEND (HTTP Server)
# ============================================================

echo -e "${CYAN}[3/3] Iniciando Frontend...${NC}"
echo ""

cd "$BASE_DIR"

# Usar Python's built-in HTTP server (não requer instalação)
echo -e "${GREEN}🌐 Iniciando servidor frontend...${NC}"
echo -e "${BLUE}   Frontend rodando em: http://localhost:8080${NC}"
echo ""

# Python 3 HTTP server
python3 -m http.server 8080 > "$BASE_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$BASE_DIR/.frontend.pid"

sleep 2

# Verificar se frontend iniciou
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend iniciado (PID: $FRONTEND_PID)"
else
    echo -e "${RED}❌ Erro ao iniciar frontend${NC}"
    echo "Verifique o log: $BASE_DIR/frontend.log"
    exit 1
fi

echo ""
echo "============================================================"
echo -e "${GREEN}✅ TODOS OS SERVIDORES INICIADOS COM SUCESSO!${NC}"
echo "============================================================"
echo ""
echo -e "${CYAN}📍 URLs Disponíveis:${NC}"
echo ""
echo -e "   ${GREEN}Frontend:${NC}      http://localhost:8080"
echo -e "   ${GREEN}Backend API:${NC}   http://localhost:5000"
echo -e "   ${GREEN}Health Check:${NC}  http://localhost:5000/health"
echo -e "   ${GREEN}MongoDB:${NC}       mongodb://localhost:27017"
echo ""
echo -e "${CYAN}📋 Páginas Principais:${NC}"
echo ""
echo -e "   ${BLUE}Portal de Acesso:${NC}     http://localhost:8080/index.html"
echo -e "   ${BLUE}Dashboard Matriz:${NC}     http://localhost:8080/matriz-app.html"
echo -e "   ${BLUE}Standalone:${NC}           http://localhost:8080/index-standalone.html"
echo -e "   ${BLUE}Franqueado:${NC}           http://localhost:8080/franqueado-login.html"
echo ""
echo -e "${CYAN}📝 Logs:${NC}"
echo ""
echo -e "   Backend:  tail -f $BASE_DIR/backend.log"
echo -e "   Frontend: tail -f $BASE_DIR/frontend.log"
echo ""
echo -e "${CYAN}🛑 Para parar todos os servidores:${NC}"
echo ""
echo -e "   ./stop-all.sh"
echo ""
echo "============================================================"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar todos os servidores${NC}"
echo ""

# Função para limpar ao sair
cleanup() {
    echo ""
    echo ""
    echo -e "${YELLOW}🛑 Parando servidores...${NC}"
    
    if [ -f "$BASE_DIR/.backend.pid" ]; then
        BACKEND_PID=$(cat "$BASE_DIR/.backend.pid")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID 2>/dev/null
            echo -e "${GREEN}✓${NC} Backend parado"
        fi
        rm "$BASE_DIR/.backend.pid"
    fi
    
    if [ -f "$BASE_DIR/.frontend.pid" ]; then
        FRONTEND_PID=$(cat "$BASE_DIR/.frontend.pid")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID 2>/dev/null
            echo -e "${GREEN}✓${NC} Frontend parado"
        fi
        rm "$BASE_DIR/.frontend.pid"
    fi
    
    echo ""
    echo -e "${BLUE}MongoDB continua rodando. Para parar:${NC}"
    echo "   brew services stop mongodb-community@7.0"
    echo ""
    echo -e "${GREEN}Até logo! 🥋${NC}"
    echo ""
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Manter script rodando
while true; do
    sleep 1
done
