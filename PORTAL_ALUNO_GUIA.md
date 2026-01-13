# 🎓 Portal do Aluno - Guia de Acesso

## 📱 URLs de Acesso

### Login
```
http://localhost:8080/aluno-login.html
```

### Dashboard (após login)
```
http://localhost:8080/aluno.html
```

---

## ✨ Funcionalidades Disponíveis

### 📊 Minha Evolução
- **Graduação Atual:** Exibe faixa e grau do aluno
- **Progresso:** Barra de progresso para próximo grau
- **Aulas Frequentadas:** Contador total de treinos

### 💰 Financeiro
- **Status da Mensalidade:** Badge visual (Em Dia / Atrasada)
- **Valor da Mensalidade:** Exibição do valor mensal
- **Último Pagamento:** Data do último pagamento registrado
- **Botão de Pagamento:** Integração com Mercado Pago
- **Histórico:** Lista completa de pagamentos anteriores

### 🏢 Minha Academia
- **Nome da Academia:** Informações da unidade
- **Endereço:** Localização completa
- **Telefone:** Contato principal
- **📧 Email de Suporte:** (se configurado no White Label)
- **📱 WhatsApp de Suporte:** (se configurado no White Label)

---

## 🔐 Como Fazer Login

1. Acesse: `http://localhost:8080/aluno-login.html`
2. **Selecione sua academia** no dropdown
3. **Digite seu email** OU **telefone** cadastrado
4. Clique em **"Acessar Minha Área"**

### Exemplo de Credenciais de Teste

Para testar, você pode usar qualquer aluno cadastrado no sistema. Para encontrar um:

```bash
cd server
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub')
  .then(async () => {
    const Student = require('./models/Student');
    const students = await Student.find().limit(5).populate('franchiseId');
    console.log('📋 Alunos de Teste:\n');
    students.forEach(s => {
      console.log(\`Nome: \${s.name}\`);
      console.log(\`Email: \${s.email}\`);
      console.log(\`Telefone: \${s.phone}\`);
      console.log(\`Academia: \${s.franchiseId?.name}\`);
      console.log('---');
    });
    process.exit(0);
  });
"
```

---

## 🎨 Layout Responsivo

### Desktop (Telas Grandes)
```
┌─────────────────────────────────────────┐
│  Header (Nome + Academia)               │
├──────────────────┬──────────────────────┤
│                  │                      │
│  📊 Evolução     │  🏢 Minha Academia  │
│                  │  (Sidebar Fixa)     │
│  💰 Financeiro   │                      │
│                  │                      │
└──────────────────┴──────────────────────┘
```

### Mobile (Telas Pequenas)
```
┌─────────────────┐
│  Header         │
├─────────────────┤
│  📊 Evolução    │
├─────────────────┤
│  🏢 Academia    │
├─────────────────┤
│  💰 Financeiro  │
└─────────────────┘
```

---

## 🔧 Configurar Dados de Suporte

Para que os contatos de suporte apareçam:

1. Acesse o **Painel do Franqueado**
2. Vá em **"Dados da Academia"** (ícone de engrenagem)
3. Role até **"Design & Branding (White Label)"**
4. Preencha:
   - **Email de Suporte:** `suporte@suaacademia.com`
   - **Telefone de Suporte:** `(48) 99999-9999`
5. Clique em **"Salvar Alterações"**

Agora os alunos dessa academia verão os contatos na seção "Minha Academia"!

---

## 🐛 Troubleshooting

### Página em branco ou erro
1. Abra o Console (F12)
2. Verifique se há erros em vermelho
3. Confirme que a API está rodando: `http://localhost:5000/api/v1/health`

### Dados não aparecem
1. Faça um **Hard Refresh:** Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
2. Limpe o cache do navegador
3. Verifique se você está logado (localStorage deve ter `studentData`)

### Seção de suporte não aparece
- Isso é normal! Ela só aparece se você configurou `supportEmail` ou `supportPhone` no White Label

---

## 📝 Diferenças entre os Portais

| Funcionalidade | `student.html` | `aluno.html` |
|----------------|----------------|--------------|
| Check-in       | ✅ Sim         | ❌ Não       |
| Evolução       | ⚠️ Básico      | ✅ Completo  |
| Financeiro     | ❌ Não         | ✅ Sim       |
| Academia       | ✅ Sim         | ✅ Sim       |
| Ranking        | ✅ Sim         | ❌ Não       |
| Agenda         | ✅ Sim         | ❌ Não       |
| Layout         | Mobile-first   | Desktop-first|

**Recomendação:** Use `aluno.html` para funcionalidades completas de dashboard.

---

## 🚀 Próximos Passos

Agora que você está usando `aluno.html`, você tem acesso a:
- ✅ Todas as informações de evolução
- ✅ Sistema completo de pagamentos
- ✅ Informações da academia com suporte
- ✅ Layout responsivo e moderno
- ✅ White Label totalmente funcional

**Acesse agora:** `http://localhost:8080/aluno-login.html`

Oss! 🥋
