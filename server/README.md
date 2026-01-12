# Arena Matrix Backend

Backend API para o sistema Arena Matrix de gestão de academias de Jiu-Jitsu.

## 🛠️ Stack Tecnológica

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Security**: Helmet, CORS, Rate Limiting

## 🚀 Quick Start

### Pré-requisitos

```bash
# Node.js 18 ou superior
node --version

# MongoDB (escolha uma opção)
# Opção 1: Local
brew install mongodb-community
brew services start mongodb-community

# Opção 2: Cloud (MongoDB Atlas)
# Crie conta em: https://www.mongodb.com/cloud/atlas
```

### Instalação

```bash
# 1. Navegue até o diretório do servidor
cd server

# 2. Instale as dependências
npm install

# 3. Configure o ambiente (opcional - script interativo)
npm run setup

# OU copie manualmente o arquivo de exemplo
cp .env.example .env
# Edite .env com suas configurações

# 4. Popule o banco de dados com dados iniciais
npm run seed

# 5. Inicie o servidor
npm run dev  # Modo desenvolvimento (com auto-reload)
# OU
npm start    # Modo produção
```

## 📡 API Endpoints

### Franchises (Academias)

```
GET    /api/v1/franchises              - Listar todas as academias
GET    /api/v1/franchises/:id          - Buscar academia específica
POST   /api/v1/franchises              - Criar nova academia
PUT    /api/v1/franchises/:id          - Atualizar academia
DELETE /api/v1/franchises/:id          - Deletar academia

GET    /api/v1/franchises/stats/network    - Estatísticas da rede
GET    /api/v1/franchises/stats/top        - Top academias por alunos
GET    /api/v1/franchises/nearby/:lng/:lat - Academias próximas
```

### Directives (Comunicados)

```
GET    /api/v1/directives              - Listar comunicados
GET    /api/v1/directives/:id          - Buscar comunicado específico
POST   /api/v1/directives              - Criar novo comunicado
PUT    /api/v1/directives/:id          - Atualizar comunicado
DELETE /api/v1/directives/:id          - Deletar comunicado

GET    /api/v1/directives/recent/:limit  - Comunicados recentes
GET    /api/v1/directives/urgent         - Comunicados urgentes
POST   /api/v1/directives/:id/acknowledge - Marcar como lido
```

### Health Check

```
GET    /health                          - Status do servidor
```

## 📝 Exemplos de Uso

### Criar Nova Academia

```bash
curl -X POST http://localhost:5000/api/v1/franchises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arena Floripa",
    "owner": "Prof. João Silva",
    "address": "Rua das Flores, 123 - Florianópolis - SC",
    "phone": "48 99999-9999",
    "email": "floripa@arenajj.com",
    "students": 45,
    "revenue": 8500,
    "expenses": 3500,
    "lat": -27.5954,
    "lng": -48.5480
  }'
```

### Buscar Estatísticas da Rede

```bash
curl http://localhost:5000/api/v1/franchises/stats/network
```

### Criar Comunicado

```bash
curl -X POST http://localhost:5000/api/v1/directives \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Novo protocolo de limpeza implementado em todas as unidades",
    "priority": "high",
    "category": "policy",
    "targetUnit": "Rede Geral"
  }'
```

## 🗂️ Estrutura do Projeto

```
server/
├── config/
│   └── database.js         # Configuração do MongoDB
├── controllers/
│   ├── franchiseController.js
│   └── directiveController.js
├── models/
│   ├── Franchise.js        # Schema de academias
│   └── Directive.js        # Schema de comunicados
├── routes/
│   ├── franchiseRoutes.js
│   └── directiveRoutes.js
├── scripts/
│   ├── seedDatabase.js     # Popular banco de dados
│   └── setup.js            # Script de configuração
├── .env.example            # Exemplo de variáveis de ambiente
├── package.json
└── server.js               # Arquivo principal
```

## ⚙️ Variáveis de Ambiente

```env
# Servidor
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/arena-matrix

# API
API_PREFIX=/api/v1

# Segurança
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔒 Segurança

O backend inclui:

- **Helmet**: Headers HTTP seguros
- **CORS**: Controle de origem cruzada
- **Rate Limiting**: Proteção contra DDoS
- **Compression**: Compressão de respostas
- **Input Validation**: Validação via Mongoose

## 📊 Database Schema

### Franchise (Academia)

```javascript
{
  name: String,              // Nome da academia
  owner: String,             // Proprietário
  address: String,           // Endereço completo
  phone: String,             // Telefone
  email: String,             // Email
  students: Number,          // Número de alunos
  revenue: Number,           // Receita mensal
  expenses: Number,          // Despesas mensais
  location: {                // Localização geográfica
    type: "Point",
    coordinates: [lng, lat]
  },
  status: String,            // active, inactive, pending
  metrics: {                 // Métricas de performance
    retention: Number,       // Taxa de retenção (%)
    satisfaction: Number,    // Satisfação (0-10)
    growth: Number          // Crescimento (%)
  },
  metadata: {
    founded: Date,
    lastUpdated: Date,
    notes: String
  }
}
```

### Directive (Comunicado)

```javascript
{
  text: String,              // Texto do comunicado
  targetUnit: String,        // Unidade alvo
  targetFranchiseId: ObjectId, // ID da academia (opcional)
  priority: String,          // low, medium, high, urgent
  category: String,          // announcement, training, event, etc
  status: String,            // draft, published, archived
  author: {
    name: String,
    role: String
  },
  metadata: {
    views: Number,
    acknowledged: [           // Confirmações de leitura
      {
        franchiseId: ObjectId,
        acknowledgedAt: Date
      }
    ]
  }
}
```

## 🧪 Testando a API

### Com cURL

```bash
# Testar health check
curl http://localhost:5000/health

# Listarall academias
curl http://localhost:5000/api/v1/franchises

# Estatísticas da rede
curl http://localhost:5000/api/v1/franchises/stats/network
```

### Com Postman ou Insomnia

Importe a collection (crie arquivo `arena-matrix-api.json`):

```json
{
  "name": "Arena Matrix API",
  "baseUrl": "http://localhost:5000/api/v1"
}
```

## 🚀 Deploy

### Heroku

```bash
# Login
heroku login

# Criar app
heroku create arena-matrix-api

# Adicionar MongoDB
heroku addons:create mongolab

# Deploy
git push heroku main
```

### Railway

```bash
# Instalar CLI
npm i -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

### Render

1. Conecte seu repositório GitHub
2. Configure build command: `npm install`
3. Configure start command: `npm start`
4. Adicione variáveis de ambiente
5. Deploy automático!

## 📈 Monitoramento

```bash
# Logs em desenvolvimento
npm run dev

# Logs em produção
pm2 logs arena-matrix
```

## 🐛 Troubleshooting

### MongoDB não conecta

```bash
# Verificar se MongoDB está rodando
brew services list

# Iniciar MongoDB
brew services start mongodb-community

# OU use MongoDB Atlas cloud
```

### Erro de porta em uso

```bash
# Mudar porta no .env
PORT=3000

# OU matar processo
lsof -ti:5000 | xargs kill -9
```

### Dependências faltando

```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📚 Recursos Adicionais

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para Arena Jiu-Jitsu**
