#!/bin/bash

# Arena Matrix - Iniciar Sistema Completo
# Este script inicia MongoDB E o backend automaticamente

echo ""
echo "============================================================"
echo "🥋  ARENA MATRIX - Iniciar Sistema Completo"
echo "============================================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Ir para diretório do servidor
cd server 2>/dev/null || {
    echo -e "${RED}❌ Diretório 'server' não encontrado!${NC}"
    echo "Execute este script do diretório ArenaHub"
    exit 1
}

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙${NC}  Criando arquivo .env..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Arquivo .env criado"
fi

# Verificar se dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦${NC} Instalando dependências do backend..."
    npm install
fi

echo ""
echo "============================================================"
echo ""
echo -e "${GREEN}Escolha uma opção:${NC}"
echo ""
echo "1. ${BLUE}Popular banco de dados${NC} e ${GREEN}iniciar servidor${NC} (primeira vez)"
echo "2. ${GREEN}Apenas iniciar servidor${NC} (banco já populado)"
echo "3. ${BLUE}Apenas popular banco${NC} (sem iniciar servidor)"
echo "4. Ver status do MongoDB"
echo "5. Parar MongoDB"
echo ""
read -p "Opção (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}🌱 Populando banco de dados...${NC}"
        npm run seed
        echo ""
        echo -e "${GREEN}🚀 Iniciando servidor backend...${NC}"
        echo ""
        echo "O servidor estará disponível em:"
        echo -e "${GREEN}http://localhost:5000${NC}"
        echo ""
        npm run dev
        ;;
    2)
        echo ""
        echo -e "${GREEN}🚀 Iniciando servidor backend...${NC}"
        echo ""
        echo "O servidor estará disponível em:"
        echo -e "${GREEN}http://localhost:5000${NC}"
        echo ""
        npm run dev
        ;;
    3)
        echo ""
        echo -e "${BLUE}🌱 Populando banco de dados...${NC}"
        npm run seed
        ;;
    4)
        echo ""
        if pgrep -x "mongod" > /dev/null; then
            echo -e "${GREEN}✓ MongoDB está RODANDO${NC}"
            echo ""
            echo "Informações:"
            echo "  - Porta: 27017"
            echo "  - Endereço: mongodb://localhost:27017"
            echo "  - Database: arena-matrix"
        else
            echo -e "${RED}✗ MongoDB NÃO está rodando${NC}"
        fi
        ;;
    5)
        echo ""
        echo -e "${YELLOW}Parando MongoDB...${NC}"
        brew services stop mongodb-community@7.0
        echo -e "${GREEN}✓ MongoDB parado${NC}"
        ;;
    *)
        echo ""
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac
