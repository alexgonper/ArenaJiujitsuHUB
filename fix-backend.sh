#!/bin/bash
# Matar apenas o tunnel da porta 5000 (Backend)
pkill -f "localtunnel --port 5000"

# Iniciar novo tunnel
nohup npx localtunnel --port 5000 > backend_url_new.log 2>&1 &
PID=$!

echo "Aguardando URL..."
sleep 5

# Capturar URL
URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.loca\.lt' backend_url_new.log | head -n 1)

if [ -z "$URL" ]; then
    echo "Falha ao gerar URL. Tentando novamente..."
    sleep 5
    URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.loca\.lt' backend_url_new.log | head -n 1)
fi

if [ -z "$URL" ]; then
    echo "Erro fatal: Não foi possível obter URL."
    exit 1
fi

echo "Nova URL do Backend: $URL"

# Atualizar config
echo "window.API_URL = '$URL/api/v1';" > api-config.js
echo "window.API_BASE_URL = '$URL/api/v1';" >> api-config.js

echo "Configuração atualizada!"
