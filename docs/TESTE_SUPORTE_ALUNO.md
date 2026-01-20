# 🧪 Como Testar os Dados de Suporte no Portal do Aluno

## Situação Atual
Apenas a **Arena Toronto** tem dados de suporte configurados:
- Email: `suporte@rwer3.com.br`
- Phone: `00000000`

## Opção 1: Testar com Arena Toronto

### Passo 1: Encontrar um aluno da Arena Toronto
```bash
cd server
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub')
  .then(async () => {
    const Student = require('./models/Student');
    const Franchise = require('./models/Franchise');
    
    const toronto = await Franchise.findOne({ name: /Toronto/i });
    if (toronto) {
      const students = await Student.find({ franchiseId: toronto._id }).limit(3);
      console.log('Alunos da Arena Toronto:');
      students.forEach(s => {
        console.log(\`  Nome: \${s.name}\`);
        console.log(\`  Email: \${s.email}\`);
        console.log(\`  Phone: \${s.phone}\`);
        console.log('');
      });
    }
    process.exit(0);
  });
"
```

### Passo 2: Fazer login no Portal do Aluno
1. Acesse: `http://localhost:3000/aluno-login.html`
2. Selecione: **Arena Toronto**
3. Use o email ou telefone de um dos alunos listados acima
4. Clique em "Acessar Minha Área"

### Passo 3: Verificar a Seção "Minha Academia"
Role a página até a seção **"Minha Academia"** e você verá:
- 📍 Endereço
- 📞 Telefone da academia
- **✉️ Email de Suporte:** `suporte@rwer3.com.br`
- **📱 WhatsApp:** `00000000`

---

## Opção 2: Configurar Suporte em Outra Academia

### Passo 1: Acessar o Painel do Franqueado
1. Acesse: `http://localhost:3000/franqueado-login.html`
2. Selecione a academia desejada (ex: Arena São Paulo)
3. Use a senha padrão: `123456`

### Passo 2: Ir para Configurações
1. No painel, clique no ícone de **engrenagem** (⚙️) ou botão "Personalizar"
2. Procure o widget **"Dados da Academia"**

### Passo 3: Configurar White Label
Role até a seção **"Design & Branding (White Label)"** e preencha:
- **Email de Suporte:** `suporte@suaacademia.com`
- **Telefone de Suporte:** `(48) 99999-9999`

### Passo 4: Salvar
Clique em **"Salvar Alterações"**

### Passo 5: Testar no Portal do Aluno
1. Acesse: `http://localhost:3000/aluno-login.html`
2. Selecione a academia que você configurou
3. Faça login com um aluno dessa academia
4. Veja os contatos de suporte na seção "Minha Academia"

---

## 🔍 Debug: Verificar se os Dados Estão Chegando

Abra o Console do Navegador (F12) no Portal do Aluno e digite:
```javascript
console.log('Franchise Data:', dashboardData.franchise);
console.log('Branding:', dashboardData.franchise.branding);
console.log('Support Email:', dashboardData.franchise.branding?.supportEmail);
console.log('Support Phone:', dashboardData.franchise.branding?.supportPhone);
```

Se os valores aparecerem mas não estiverem visíveis na tela, verifique:
```javascript
console.log('Email Row:', document.getElementById('support-email-row'));
console.log('Phone Row:', document.getElementById('support-phone-row'));
```

---

## ✅ Resultado Esperado

Quando configurado, você verá na seção "Minha Academia":

```
🏢 Minha Academia

📍 Rua Exemplo, 123
📞 (48) 3333-4444

─────────────────────

✉️ suporte@suaacademia.com
📱 (48) 99999-9999
```

Os ícones de email e WhatsApp só aparecem se os dados estiverem configurados!
