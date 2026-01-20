# Especificação Funcional e Técnica - Arena Jiu-Jitsu Hub
**Versão:** 2.0 (Release Candidate)  
**Data:** 20 de Janeiro de 2026  
**Confidencialidade:** Documento Interno e Clientes  

---

## 1. Visão Executiva
O **Arena Jiu-Jitsu Hub** é uma plataforma SaaS (Software as a Service) *multi-tenant* desenvolvida para a gestão integral de redes de academias de artes marciais. O sistema foca na padronização operacional, integridade pedagógica (compliance IBJJF) e automação financeira entre Matriz e Franqueados.

O diferencial arquitetural do sistema reside na sua capacidade de **Scaling Vertical e Horizontal**, suportando milhares de alunos simultâneos com garantia de integridade de dados (ACID-like properties em transações críticas) e regras de negócio configuráveis em nível de rede.

---

## 2. Regras de Negócio Críticas (Business Logic Core)

### 2.1. Motor de Graduação e Compliance IBJJF
O sistema implementa um **Motor de Regras de Graduação (Graduation Engine)** que valida rigosamente os critérios para promoção de faixa, asseverando a credibilidade da academia. As regras seguem o **Regulamento Geral de Graduação da IBJJF (International Brazilian Jiu-Jitsu Federation)**.

#### 2.1.1. Validação de Idade (Age Gate)
O sistema bloqueia automaticamente tentativas de graduação que violem a idade mínima, calculada com base na data de nascimento do aluno no momento da promoção:

| Faixa Alvo | Idade Mínima (IBJJF) | Regra do Sistema |
| :--- | :--- | :--- |
| **Cinza** | 04 a 15 anos | Bloqueia se idade < 4 |
| **Amarela** | 07 a 15 anos | Bloqueia se idade < 7 |
| **Laranja** | 10 a 15 anos | Bloqueia se idade < 10 |
| **Verde** | 13 a 15 anos | Bloqueia se idade < 13 |
| **Azul** | 16 anos | **CRÍTICO:** Bloqueia estritamente se idade < 16 |
| **Roxa** | 16 anos | Permitido (desde que cumpra tempo de azul) |
| **Marrom** | 18 anos | **CRÍTICO:** Bloqueia estritamente se idade < 18 |
| **Preta** | 19 anos | **CRÍTICO:** Bloqueia estritamente se idade < 19 |

#### 2.1.2. Interstícios e Tempos de Permanência (Min Days)
O sistema contabiliza o tempo exato de permanência na graduação atual. A promoção só é habilitada após o cumprimento dos períodos mínimos (convertidos internamente para dias):

*   **Azul → Roxa:** Mínimo de **2 anos** (~730 dias).
*   **Roxa → Marrom:** Mínimo de **1.5 anos** (~547 dias).
*   **Marrom → Preta:** Mínimo de **1 ano** (~365 dias).

#### 2.1.3. Critério Híbrido (Tempo + Frequência)
Diferente da IBJJF que exige apenas tempo, o Arena Hub implementa um critério de **Qualidade Técnica** baseado em frequência.
*   **Lógica:** `Elegível = (Dias na Faixa >= MinTimeIBJJF) AND (Aulas Presentes >= MinAttendanceRequirement)`
*   **Contagem:** A contagem de aulas é reiniciada a cada troca de faixa ou grau, garantindo consistência no ciclo de aprendizado.

---

### 2.2. Gestão de Capacidade e Concorrência (Booking Engine)
Para evitar *overbooking* (superlotação) em horários de pico, o sistema utiliza um modelo de **Controle de Concorrência Otimista (Optimistic Concurrency Control)**.

#### 2.2.1. Lógica de Reserva Atômica
1.  **Verificação de Vagas:** Antes de confirmar, o sistema verifica se `bookedCount < capacity`.
2.  **Operação Atômica:** Utiliza `findOneAndUpdate` do MongoDB com a condição de guarda `{ $lt: ["$bookedCount", "$capacity"] }`. Isso garante que duas requisições simultâneas para a "última vaga" não resultem em superlotação; apenas uma terá sucesso.
3.  **Verificação de Duplicidade:** Impede que o mesmo `studentId` reserve o mesmo `classId` (ou sessões simultâneas) na mesma data.

#### 2.2.2. Integridade Histórica (Snapshot Pattern)
Ao registrar presença, o sistema grava um **Snapshot** dos dados da aula (Nome do Professor, Horário, Nível).
*   *Por que?* Se o professor da aula mudar no futuro, o histórico do aluno preserva quem *realmente* deu a aula naquele dia. Isso é crucial para auditorias e pagamento de comissões por aula.

---

### 2.3. Inteligência Financeira (Financial Intelligence)
O módulo financeiro opera com **Split de Pagamentos Automatizado**, essencial para o modelo de franquias.

*   **Gateway:** Integração direta via API (Mercado Pago).
*   **Regra de Royalties:** No ato da transação, o sistema calcula automaticamente a retenção da Matriz (ex: 10%).
    *   *Exemplo:* Mensalidade de R$ 200,00.
    *   **Split 1 (Matriz):** R$ 20,00 → Direcionado à conta da Holding.
    *   **Split 2 (Franquia):** R$ 180,00 → Direcionado à conta da Unidade.
*   **Conciliação:** Webhooks processam o status (`pending` → `approved`) em tempo real, liberando o check-in do aluno instantaneamente.

---

## 3. Detalhamento Funcional por Módulo

### 3.1. Painel da Matriz (Headquarters)
*   **Big Data Analytics:**
    *   Consolidação de faturamento de toda a rede.
    *   Mapa de calor de alunos ativos por região geográfica.
*   **Governança:**
    *   Definição de regras de graduação globais (ninguém altera localmente).
    *   Envio de Diretrizes (Comunicados Oficiais) com rastreamento de leitura.

### 3.2. Portal do Franqueado (Manager)
*   **Dashboard Operacional:** KPIs de Alunos Ativos, Churn Rate (Cancelamentos) e Ticket Médio.
*   **Gestão Acadêmica:** Configuração da Grade de Horários (com repetição semanal).
*   **CRM de Alunos:**
    *   Perfil 360º: Dados pessoais, Financeiro, Histórico de Graduações e Frequência.
    *   Visualização de Carteirinha Digital.
*   **Auditor IA:** Widget inteligente que analisa dados e sugere ações (ex: "Sexta-feira 19h tem baixa adesão, sugerimos aulão temático").

### 3.3. Portal do Professor
*   **Chamada Digital:** Interface otimizada para tablets/celulares. O check-in só é liberado 15 minutos antes do início da aula; antes disso, a confirmação permanece bloqueada.
*   **Visão de Graduação:** Lista automática de alunos "Prontos para Graduar" baseada nas regras do sistema.
*   **Minhas Métricas:** Relatório de "Alunos Atendidos" para acompanhamento de engajamento.

### 3.4. Área do Aluno (App PWA)
*   **Smart Booking:** Agendamento de aulas com 1 clique.
*   **Linha do Tempo:** Visualização da jornada de graduação (quantas aulas faltam para a próxima faixa).
*   **Pagamentos:** Gestão de mensalidades integrada via Mercado Pago.

---

## 4. Arquitetura Técnica

### 4.1. Stack Tecnológico
*   **Backend:** Node.js (Runtime), Express (Framework), TypeScript (Tipagem Estática).
*   **Database:** MongoDB 6.0+ (NoSQL).
*   **Frontend:** Vanilla JS Modular (ES6+) com TailwindCSS (Performance First).

### 4.2. Modelagem de Dados Avançada
Para suportar o volume de dados de presença (potencialmente milhões de registros), utilizamos o **Bucket Pattern**:
*   Em vez de 1 documento por presença, utilizamos 1 documento por **Aluno/Mês**.
*   As presenças diárias são armazenadas em um array interno `records`.
*   **Benefício:** Reduz o tamanho do índice em 95% e acelera consultas históricas de graduação.

### 4.3. Segurança
*   **Autenticação:** JWT (Json Web Tokens) com rotação de chaves.
*   **API Security:** Rate Limiting (prevenção DDoS) e validação estrita de inputs (Zod/Joi schema validation).
*   **Privacidade:** Dados sensíveis de pagamento não são persistidos (apenas tokens do gateway), em conformidade com PCI-DSS.

---

*Documentação Técnica Proprietária - Desenvolvida pelo Time de Engenharia Antigravity.*
