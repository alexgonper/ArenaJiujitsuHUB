# 🚀 Arena Matrix - Guia Completo do Backend

## ✅ Backend Criado com Sucesso!

Seu backend Node.js + MongoDB está pronto! Aqui está tudo que você precisa saber.

---

## 📦 O Que Foi Criado

### Estrutura Completa

```
server/
├── config/
│   └── database.js              # Conexão MongoDB
├── controllers/
│   ├── franchiseController.js   # Lógica de academias
│   └── directiveController.js   # Lógica de comunicados
├── models/
│   ├── Franchise.js             # Schema de academias
│   └── Directive.js             # Schema de comunicados
├── routes/
│   ├── franchiseRoutes.js       # Rotas de academias
│   └── directiveRoutes.js       # Rotas de comunicados
├── scripts/
│   ├── seedDatabase.js          # Popular banco
│   └── setup.js                 # Configuração inicial
├── .env.example                 # Exemplo de configuração
├── .gitignore                   # Arquivos ignorados
├── package.json                 # Dependências
├── README.md                    # Documentação completa
└── server.js                    # Servidor principal
```

### Dependências Instaladas ✅

- **express** - Framework web
- **mongoose** - MongoDB ODM
- **dotenv** - Variáveis de ambiente
- **cors** - Compartilhamento de recursos
- **helmet** - Segurança HTTP
- **morgan** - Logger de requisições
- **compression** - Compressão de respostas
- **express-rate-limit** - Proteção contra DDoS
- **nodemon** - Auto-reload em desenvolvimento

---

## 🎯 Como Usar (Passo a Passo)

### Passo 1: Instalar MongoDB

Escolha UMA das opções:

**Opção A - Local (Recomendado para desenvolvimento):**

```bash
# Se estiver no Mac:
brew install mongodb-community
brew services start mongodb-community

# Verificar se está rodando:
brew services list | grep mongodb
```

**Opção B - Cloud (MongoDB Atlas):**

1. Crie conta gratuita: https://www.mongodb.com/cloud/atlas
2. Crie um cluster
3. Copie a connection string
4. Use no .env

### Passo 2: Configurar Variáveis de Ambiente

```bash
cd server

# Copiar arquivo de exemplo
cp .env.example .env
```

Edite `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/arena-matrix
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500
```

**Se usar MongoDB Atlas:**

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arena-matrix
```

### Passo 3: Popular Banco de Dados

```bash
npm run seed
```

Você verá:

```
✅ Database seeded successfully!
📊 Created 5 franchises:
   1. Arena Papanduva - 78 students
   2. Arena São Francisco do Sul - 92 students
   3. Arena Guaratuba - 84 students
   4. Arena Cascais - 65 students
   5. Arena México - 145 students

📈 Network Statistics:
   Total Students: 464
   Total Revenue: R$ 60,200
   ...
```

### Passo 4: Iniciar o Servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# OU modo produção
npm start
```

Você verá:

```
============================================================
🥋  ARENA MATRIX API SERVER
============================================================
🚀 Server running in development mode
📡 Listening on port 5000
🌐 API Base URL: http://localhost:5000/api/v1
🏥 Health Check: http://localhost:5000/health
============================================================
```

### Passo 5: Testar a API

Abra em outro terminal:

```bash
# Testar health check
curl http://localhost:5000/health

# Listar academias
curl http://localhost:5000/api/v1/franchises

# Estatísticas da rede
curl http://localhost:5000/api/v1/franchises/stats/network
```

---

## 🌐 API Endpoints Disponíveis

### Franchises (Academias)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/franchises` | Lista todas as academias |
| GET | `/api/v1/franchises/:id` | Busca academia específica |
| POST | `/api/v1/franchises` | Cria nova academia |
| PUT | `/api/v1/franchises/:id` | Atualiza academia |
| DELETE | `/api/v1/franchises/:id` | Remove academia |
| GET | `/api/v1/franchises/stats/network` | Estatísticas da rede |
| GET | `/api/v1/franchises/stats/top` | Top academias |
| GET | `/api/v1/franchises/nearby/:lng/:lat` | Academiaspróximas|

### Directives (Comunicados)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/directives` | Lista comunicados |
| GET | `/api/v1/directives/:id` | Busca comunicado específico |
| POST | `/api/v1/directives` | Cria comunicado |
| PUT | `/api/v1/directives/:id` | Atualiza comunicado |
| DELETE | `/api/v1/directives/:id` | Remove comunicado |
| GET | `/api/v1/directives/recent/:limit` | Comunicados recentes |
| GET | `/api/v1/directives/urgent` | Comunicados urgentes |
| POST | `/api/v1/directives/:id/acknowledge` | Marcar como lido |

---

## 💻 Exemplos Práticos

### Criar Nova Academia

```bash
curl -X POST http://localhost:5000/api/v1/franchises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arena Curitiba Centro",
    "owner": "Prof. Carlos Santos",
    "address": "Rua XV de Novembro, 500 - Centro, Curitiba - PR",
    "phone": "41 99999-8888",
    "email": "centro@arenajj.com",
    "students": 120,
    "revenue": 18000,
    "expenses": 7500,
    "lat": -25.4284,
    "lng": -49.2733
  }'
```

### Buscar Academias Próximas

```bash
# Buscar academias num raio de 50km de Curitiba
curl "http://localhost:5000/api/v1/franchises/nearby/-49.2733/-25.4284?distance=50000"
```

### Criar Comunicado Urgente

```bash
curl -X POST http://localhost:5000/api/v1/directives \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Campeonato estadual confirmado para próximo mês. Todas as unidades devem iniciar preparação imediata.",
    "priority": "urgent",
    "category": "event",
    "targetUnit": "Rede Geral"
  }'
```

---

## 🔗 Conectar Frontend com Backend

O arquivo `api-client.js` já foi criado para você! Veja como usar:

### No HTML

```html
<script src="api-client.js"></script>
<script>
  // Buscar todas as academias
  FranchiseAPI.getAll().then(response => {
    console.log('Academias:', response.data);
  });

  // Buscar estatísticas
  FranchiseAPI.getStats().then(response => {
    console.log('Stats:', response.data);
  });
</script>
```

### Atualizar Frontend Standalone

Edite `standalone-app.js`:

```javascript
// Trocar dados mock por dados reais da API
async function init() {
    try {
        // Verificar se backend está disponível
        const isOnline = await API.checkHealth();
        
        if (isOnline) {
            // Carregar dados da API
            const response = await FranchiseAPI.getAll();
            franchises = response.data;
            console.log('✅ Carregado do backend');
        } else {
            // Fallback para dados mock
            franchises = mockFranchises;
            console.log('⚠️ Usando dados mock (backend offline)');
        }
        
        renderNetwork();
        updateStats();
        initMainChart();
    } catch (error) {
        // Fallback em caso de erro
        franchises = mockFranchises;
    }
}
```

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
cd server
npm run dev          # Inicia com auto-reload

# Produção
npm start            # Inicia servidor

# Database
npm run seed         # Popula banco de dados

# Configuração
npm run setup        # Assistente de configuração

# Reinstalar
rm -rf node_modules
npm install
```

---

## 🐛 Solução de Problemas

### ❌ "Error connecting to MongoDB"

**Solução:**

```bash
# Verificar se MongoDB está rodando
brew services list

# Se não estiver, iniciar:
brew services start mongodb-community

# OU instalar:
brew install mongodb-community
```

### ❌ "Port 5000 already in use"

**Solução 1:** Mudar porta no `.env`:

```env
PORT=3000
```

**Solução 2:** Matar processo:

```bash
lsof -ti:5000 | xargs kill -9
```

### ❌ "Cannot find module 'express'"

**Solução:**

```bash
cd server
npm install
```

### ❌ "CORS error" no frontend

**Solução:** Adicionar origin do frontend no `.env`:

```env
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500,http://localhost:8000
```

---

## 📊 Monitoramento

### Ver Logs

```bash
# Modo desenvolvimento (automático)
npm run dev

# Ver banco de dados
mongo
> use arena-matrix
> db.franchises.find().pretty()
> db.directives.find().pretty()
```

### Testar Performance

```bash
# Instalar ferramenta de teste
npm install -g artillery

# Testar API
artillery quick --count 100 --num 10 http://localhost:5000/api/v1/franchises
```

---

## 🚀 Deploy em Produção

### Opção 1: Heroku

```bash
# Login
heroku login

# Criar aplicação
heroku create arena-matrix-api

# Adicionar MongoDB
heroku addons:create mongolab

# Configurar variáveis
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Opção 2: Railway.app

1. Acesse https://railway.app
2. Conecte repositório GitHub
3. Adicione MongoDB
4. Deploy automático!

### Opção 3: Render.com

1. Acesse https://render.com
2. New → Web Service
3. Conecte repositório
4. Build: `npm install`
5. Start: `npm start`
6. Adicione MongoDB Atlas (gratuito)

---

## 📈 Próximos Passos

### Melhorias Recomendadas

1. **Autenticação:**
   - Adicionar JWT
   - Criar sistema de login
   - Proteger rotas

2. **Validação:**
   - Adicionar express-validator
   - Validação mais rigorosa

3. **Testes:**
   - Jest para testes unitários
   - Supertest para testes de API

4. **Cache:**
   - Redis para cache
   - Melhorar performance

5. **Documentação:**
   - Swagger/OpenAPI
   - Postman Collection

---

## 🎓 Recursos de Aprendizado

- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)
- [MongoDB University](https://university.mongodb.com/) - Cursos gratuitos
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## ✅ Checklist de Verificação

- [ ] MongoDB instalado e rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Banco de dados populado (`npm run seed`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Health check funcionando
- [ ] API retornando dados
- [ ] Frontend conectado ao backend

---

## 🎉 Parabéns!

Seu backend profissional está pronto para produção!

**Features Incluídas:**
- ✅ API RESTful completa
- ✅ MongoDB com Mongoose
- ✅ Validação de dados
- ✅ Segurança (Helmet, CORS, Rate Limiting)
- ✅ Compressão de respostas
- ✅ Logging
- ✅ Tratamento de erros
- ✅ Consultas geoespaciais
- ✅ Agregações e estatísticas
- ✅ Scripts de configuração e seed
- ✅ Documentação completa

**Próximo:** Conecte o frontend ao backend e comece a gerenciar suas academias!

---

**Desenvolvido com ❤️ para Arena Jiu-Jitsu**

🥋 **Boa Sorte!**
