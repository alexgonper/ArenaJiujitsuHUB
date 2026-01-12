#!/bin/bash

# Arena Hub - Parar Todos os Servidores

echo ""
echo "============================================================"
echo "🛑  ARENA HUB - Parar Todos os Servidores"
echo "============================================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Diretório base
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Parar Backend
if [ -f "$BASE_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$BASE_DIR/.backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Parando Backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        sleep 1
        # Force kill se ainda estiver rodando
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓${NC} Backend parado"
    else
        echo -e "${BLUE}ℹ${NC}  Backend não está rodando"
    fi
    rm "$BASE_DIR/.backend.pid"
else
    echo -e "${BLUE}ℹ${NC}  Backend não está rodando"
fi

# Parar Frontend
if [ -f "$BASE_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$BASE_DIR/.frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Parando Frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        sleep 1
        # Force kill se ainda estiver rodando
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓${NC} Frontend parado"
    else
        echo -e "${BLUE}ℹ${NC}  Frontend não está rodando"
    fi
    rm "$BASE_DIR/.frontend.pid"
else
    echo -e "${BLUE}ℹ${NC}  Frontend não está rodando"
fi

# Perguntar sobre MongoDB
echo ""
echo -e "${YELLOW}Deseja parar o MongoDB também?${NC}"
echo "1. Sim (parar MongoDB)"
echo "2. Não (deixar MongoDB rodando)"
echo ""
read -p "Opção (1-2): " mongo_choice

if [ "$mongo_choice" = "1" ]; then
    echo ""
    echo -e "${YELLOW}Parando MongoDB...${NC}"
    brew services stop mongodb-community@7.0
    echo -e "${GREEN}✓${NC} MongoDB parado"
fi

echo ""
echo "============================================================"
echo -e "${GREEN}✅ Servidores parados com sucesso!${NC}"
echo "============================================================"
echo ""
