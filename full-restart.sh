#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Salvar diretório raiz (ArenaHub)
ROOT_DIR=$(pwd)

echo -e "${BLUE}=== ArenaHub: Reinicialização Local ===${NC}"
echo -e "Diretório Raiz: ${ROOT_DIR}"

# 1. Matar processos antigos para evitar conflitos de porta
echo -e "1. Limpando processos antigos..."
killall node 2>/dev/null
pkill -f "python3 -m http.server" 2>/dev/null
sleep 2

# 2. Iniciar o Backend em background
echo -e "2. Iniciando ${GREEN}Backend (Porta 5000)${NC}..."
cd "${ROOT_DIR}/server" && npm start > "${ROOT_DIR}/backend_output.log" 2>&1 &
sleep 5 # Espera o backend subir

# 3. Iniciar o Frontend (Python) em background
echo -e "3. Iniciando ${GREEN}Frontend (Porta 8080)${NC}..."
cd "${ROOT_DIR}" && python3 -m http.server 8080 > "${ROOT_DIR}/frontend_output.log" 2>&1 &
sleep 2

echo -e "\n${GREEN}Sessão Local Inicializada!${NC}"
echo -e "${BLUE}API Local:${NC} http://localhost:5000/api/v1"
echo -e "${BLUE}Frontend Local:${NC} http://localhost:8080"
echo -e "\nOs logs estão sendo salvos em backend_output.log e frontend_output.log"
