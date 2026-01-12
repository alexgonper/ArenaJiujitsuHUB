#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== ArenaHub: Reinicialização Completa + Links Externos ===${NC}"

# 1. Matar processos antigos para evitar conflitos de porta
echo -e "1. Limpando processos antigos..."
killall node 2>/dev/null
pkill -f "python3 -m http.server" 2>/dev/null
sleep 2

# 2. Iniciar o Backend em background
echo -e "2. Iniciando ${GREEN}Backend (Porta 5000)${NC}..."
cd server && npm start > ../backend_output.log 2>&1 &
cd ..
sleep 5 # Espera o backend subir

# 3. Iniciar o Frontend (Python) em background
echo -e "3. Iniciando ${GREEN}Frontend (Porta 8080)${NC}..."
python3 -m http.server 8080 > frontend_output.log 2>&1 &
sleep 2

# 4. Iniciar túnel do Backend
echo -e "4. Criando link externo para o ${GREEN}Backend (API)${NC}..."
npx localtunnel --port 5000 > backend_url.log 2>&1 &
sleep 5
BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.loca\.lt' backend_url.log | head -n 1)

if [ -z "$BACKEND_URL" ]; then
    echo -e "${ORANGE}Tentando obter URL do Backend novamente...${NC}"
    sleep 5
    BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.loca\.lt' backend_url.log | head -n 1)
fi

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}Erro: Não foi possível obter a URL do Backend.${NC}"
    exit 1
fi

echo -e "${GREEN}API Link:${NC} $BACKEND_URL"

# 5. Atualizar o arquivo de configuração do Frontend
echo -e "5. Atualizando ${BLUE}api-config.js${NC}..."
echo "window.API_URL = '$BACKEND_URL/api/v1';" > api-config.js
echo "window.API_BASE_URL = '$BACKEND_URL/api/v1';" >> api-config.js

# 6. Iniciar túnel do Frontend
echo -e "\n6. Criando link externo para o ${GREEN}Frontend (Site)${NC}..."
echo -e "${ORANGE}Compartilhe este link para acessar o sistema:${NC}"
npx localtunnel --port 8080
