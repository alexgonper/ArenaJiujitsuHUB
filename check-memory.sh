#!/bin/bash

# Script para monitorar uso de memória do projeto ArenaHub

echo "╔════════════════════════════════════════╗"
echo "║   MONITORAMENTO DE MEMÓRIA - ArenaHub  ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Total geral
echo "📊 USO TOTAL DE MEMÓRIA:"
ps aux | grep -E "Antigravity|node|tsserver" | grep -v grep | awk '{sum+=$6} END {printf "   %.2f GB (%.0f MB)\n", sum/1024/1024, sum/1024}'
echo ""

# Antigravity
echo "🚀 ANTIGRAVITY:"
ps aux | grep "Antigravity" | grep -v "Helper\|crashpad\|grep" | head -1 | awk '{printf "   %.0f MB\n", $6/1024}'
echo ""

# Node.js processos
echo "⚡ NODE.JS:"
node_count=$(ps aux | grep "node" | grep -v grep | wc -l | tr -d ' ')
node_mem=$(ps aux | grep "node" | grep -v grep | awk '{sum+=$6} END {printf "%.0f", sum/1024}')
echo "   ${node_mem} MB (${node_count} processos)"
echo ""

# Top 5 processos Node por memória
echo "🔝 TOP 5 PROCESSOS NODE:"
ps aux | grep "node" | grep -v grep | sort -k4 -r | head -5 | awk '{cmd=$11; for(i=12;i<=15;i++) cmd=cmd" "$i; printf "   %.0f MB - %s\n", $6/1024, cmd}'
echo ""

echo "💡 Dica: Execute 'sh check-memory.sh' para verificar novamente"
echo ""
