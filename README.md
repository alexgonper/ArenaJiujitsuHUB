# Arena Matrix - Central de Comando Global

![Arena Matrix](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-4.0-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

Sistema de gestão integrada para a rede Arena Jiu-Jitsu com inteligência artificial. Uma plataforma completa para gerenciar múltiplas unidades, analisar performance, gerar conteúdo de marketing e tomar decisões estratégicas baseadas em dados.

## 🌟 Funcionalidades Principais

### 📊 Dashboard de Performance
- Visão geral consolidada de todas as unidades
- Métricas em tempo real (alunos, faturamento, unidades ativas)
- Gráficos interativos de performance
- Ranking de unidades por número de alunos

### 🗺️ Rede de Academias
- Visualização em lista e mapa
- Detalhes completos de cada unidade
- Filtros e busca inteligente
- Mapa interativo com geolocalização

### 🤖 Recursos de IA

#### Auditores IA
- Análise automática de saúde da unidade
- Insights acionáveis e recomendações
- Texto-para-voz (leitura das análises)

#### Marketing Studio ✨
- Geração automática de imagens promocionais
- Campanhas personalizadas para Instagram, Facebook e marketing local
- Regeneração de conteúdo com um clique
- Legendas e emails profissionais

#### Análise SWOT
- Avaliação estratégica completa
- Forças, Fraquezas, Oportunidades e Ameaças
- Baseada em dados reais da unidade

#### Previsões Inteligentes
- Projeções de crescimento para 3 e 6 meses
- Estimativas de alunos e receita
- Recomendações estratégicas

#### Sensei Virtual
- Assistente de chat inteligente
- Responde dúvidas sobre gestão
- Suporte técnico e estratégico

### 💬 Matrix Hub
- Central de comunicação oficial
- Diretrizes polidas por IA
- Histórico completo de mensagens
- Organização por unidade

## 🚀 Como Começar

### Instalação Simples

1. **Clone ou baixe este repositório**
   ```bash
   cd ArenaHub
   ```

2. **Abra o arquivo `index.html` em um navegador moderno**
   - Chrome (recomendado)
   - Firefox
   - Safari
   - Edge

Não é necessário servidor ou instalação de dependências! O projeto funciona completamente no navegador.

### Configuração (Opcional)

#### 1. Firebase (Persistência de Dados)

Se quiser salvar dados permanentemente:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative a autenticação anônima
3. Crie um banco Firestore
4. Copie suas credenciais para `config.js`:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

const appConfig = {
    appId: 'arena-matrix-v4-mobile',
    enableFirebase: true, // Mude para true
    useMockData: false // Mude para false
};
```

#### 2. Google Gemini AI (Recursos de IA)

Para ativar os recursos de IA:

1. Obtenha uma API key do [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Configure em `config.js`:

```javascript
const geminiConfig = {
    apiKey: "SUA_GEMINI_API_KEY",
    modelName: "gemini-1.5-flash",
    imageModel: "imagen-3.0-generate-001"
};
```

**Sem API Key?** Não se preocupe! O sistema usa respostas mock inteligentes automaticamente.

## 📁 Estrutura do Projeto

```
ArenaHub/
├── index.html          # Estrutura HTML principal
├── styles.css          # Estilos personalizados
├── config.js           # Configurações e dados mock
├── app.js              # Lógica da aplicação
└── README.md           # Este arquivo
```

## 🎨 Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com animações
- **Tailwind CSS** - Framework CSS utility-first
- **JavaScript ES6+** - Lógica interativa
- **Chart.js** - Gráficos e visualizações
- **Leaflet** - Mapas interativos
- **Font Awesome** - Ícones
- **Firebase** (Opcional) - Backend e banco de dados
- **Google Gemini AI** (Opcional) - Inteligência artificial

## 💡 Uso do Sistema

### Navegação Principal

1. **Dashboard Geral** - Visão consolidada da rede
2. **Rede de Academias** - Gerencie todas as unidades
3. **Matrix Hub** - Central de comunicação

### Funcionalidades por Seção

#### Dashboard
- Visualize métricas agregadas
- Analise gráficos de performance
- Consulte ranking de unidades
- Alterne entre visão financeira e de alunos

#### Rede de Academias
- **Vista em Lista**: Cards com informações de cada unidade
- **Vista em Mapa**: Visualização geográfica
- Clique em "Auditores IA" para análise detalhada

#### Detalhes da Unidade
- Métricas operacionais
- Gráficos históricos
- **Marketing ✨**: Gerar kit completo
- **SWOT ✨**: Análise estratégica
- **Previsão IA ✨**: Projeções de crescimento
- **Matrix Directive**: Enviar comunicados

#### Sensei Virtual
- Clique no botão flutuante (canto inferior direito)
- Digite suas dúvidas sobre gestão
- Receba orientação especializada

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:

- 📱 Smartphones
- 📲 Tablets
- 💻 Laptops
- 🖥️ Desktops

## 🎯 Dados de Exemplo

O sistema vem com 5 unidades pré-configuradas:

1. **Arena Papanduva** - SC, Brasil
2. **Arena São Francisco do Sul** - SC, Brasil
3. **Arena Guaratuba** - PR, Brasil
4. **Arena Cascais** - Portugal
5. **Arena México** - México

Você pode modificar esses dados em `config.js` no array `mockFranchises`.

## 🔧 Personalização

### Adicionar Nova Unidade (Mock)

Edite `config.js`:

```javascript
const mockFranchises = [
    // ... unidades existentes
    {
        id: "6",
        name: "Arena Nova Unidade",
        owner: "Prof. Seu Nome",
        address: "Seu Endereço Completo",
        phone: "Seu Telefone",
        students: 50,
        revenue: 8000,
        expenses: 3000,
        lat: -23.5505, // Latitude
        lng: -46.6333  // Longitude
    }
];
```

### Alterar Cores do Tema

Modifique em `styles.css`:

```css
.orange-gradient {
    background: linear-gradient(135deg, #SUA_COR1 0%, #SUA_COR2 100%);
}
```

### Customizar Prompts de IA

Edite `config.js`:

```javascript
const ARENA_PERSONA_PROMPT = "Sua descrição personalizada para geração de imagens";
```

## 🐛 Solução de Problemas

### O mapa não aparece
- Verifique sua conexão com a internet
- Certifique-se de que as coordenadas (lat/lng) estão corretas

### IA não funciona
- Adicione sua API key do Gemini em `config.js`
- Ou use as respostas mock (funcionam sem API)

### Dados não persistem
- Ative o Firebase ou os dados serão apenas em memória
- Configure `enableFirebase: true` em `config.js`

### Erros no console
- Use um navegador moderno (Chrome 90+, Firefox 88+, Safari 14+)
- Habilite JavaScript no navegador

## 🚢 Deploy

### Opção 1: GitHub Pages
1. Faça upload do projeto para um repositório GitHub
2. Vá em Settings → Pages
3. Selecione a branch main
4. Pronto! Seu site estará online

### Opção 2: Netlify
1. Arraste a pasta do projeto para [Netlify Drop](https://app.netlify.com/drop)
2. Deploy instantâneo e gratuito

### Opção 3: Vercel
```bash
npm i -g vercel
vercel
```

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar!

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:

- Reportar bugs
- Sugerir novas funcionalidades
- Melhorar a documentação
- Submeter pull requests

## 👨‍💻 Autor

Desenvolvido para a rede **Arena Jiu-Jitsu**

## 📞 Suporte

Para dúvidas ou suporte:
- Abra uma issue no GitHub
- Consulte a documentação
- Use o Sensei Virtual dentro do app

---

**Arena Matrix** - Gestão Inteligente para Academias de Jiu-Jitsu 🥋

Feito com ❤️ e muita tecnologia
>>>>>>> 861e121 (feat: initial commit with AI auditor, management dashboard, and mobile fixes)
