#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ArenaHub: Tunelamento Externo ===${NC}"
echo -e "${ORANGE}Certifique-se de que o Backend (porta 5000) e o Frontend (porta 8080) já estão rodando.${NC}"

# Função para limpar processos ao sair
cleanup() {
    echo -e "\n${ORANGE}Encerrando túneis...${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT

# 1. Iniciar túnel do Backend
echo -e "\n1. Criando link externo para o ${GREEN}Backend (API)${NC}..."
npx localtunnel --port 5000 > backend_url.log 2>&1 &
BACKEND_PID=$!

# Aguarda um pouco para o túnel estabilizar e obter a URL
sleep 5
BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.loca\.lt' backend_url.log | head -n 1)

if [ -z "$BACKEND_URL" ]; then
    echo -e "${ORANGE}Aguardando URL do localtunnel... (isso pode levar alguns segundos)${NC}"
    sleep 5
    BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.loca\.lt' backend_url.log | head -n 1)
fi

if [ -z "$BACKEND_URL" ]; then
    echo -e "Erro: Não foi possível obter a URL do Backend."
    echo "Verifique se 'npx localtunnel' está funcionando ou tente rodar manualmente."
    cat backend_url.log
    kill $BACKEND_PID
    exit 1
fi

echo -e "${GREEN}API Link:${NC} $BACKEND_URL"

# 2. Atualizar o arquivo de configuração do Frontend
echo -e "2. Atualizando ${BLUE}api-config.js${NC} com a nova URL..."
echo "// Arquivo gerado automaticamente pelo script de túnel" > api-config.js
echo "window.API_URL = '$BACKEND_URL/api/v1';" >> api-config.js
echo "window.API_BASE_URL = '$BACKEND_URL/api/v1';" >> api-config.js

# 3. Frontend is now hosted on Netlify
echo -e "\n${BLUE}=== Instruções para Netlify ===${NC}"
echo -e "1. Arraste a pasta ${ORANGE}ArenaHub${NC} para https://app.netlify.com/drop"
echo -e "2. O arquivo ${GREEN}api-config.js${NC} já foi atualizado com o link do Backend acima."
echo -e "3. A cada reinicialização do túnel, você deve fazer um novo deploy no Netlify ou atualizar o arquivo api-config.js lá (se possível)."
echo -e "\n${GREEN}Backend Tunnel Running... (Press Ctrl+C to stop)${NC}"

# Keep script running to maintain backend tunnel
wait $BACKEND_PID
