# Escopo Oficial do Projeto: Arena Jiu-Jitsu Hub

Este documento contém os requisitos oficiais do sistema, servindo como base para comparação e validação do desenvolvimento.

## Objetivo Geral do Sistema
Construir um sistema completo (web e mobile) para gestão de academias de Jiu-Jitsu onde:
- As academias controlem presenças, graduações e pagamentos.
- Os professores registrem chamadas e aprovem exames.
- Os alunos acompanhem sua jornada até a faixa preta.
- A matriz de uma rede de academias possa receber parte das receitas.
- Tudo seja opcionalmente oferecido em white label no plano mais avançado.

---

## Perfis de Usuário

### 1. Admin Geral (Matriz ou Administrador Principal)
- Acesso total ao sistema.
- Configura faixas, regras e quantidade de aulas por grau.
- Configura os planos Standard e Master.
- Define o percentual de repasse (ex: matriz recebe 10% de cada academia).
- Gerencia academias e professores.

### 2. Academia
- Gerencia seus alunos.
- Cria e gerencia turmas (iniciantes, femininas, kids, adultos, avançados, etc.).
- Cria planos de pagamento.
- Cadastra professores.
- Acompanha inadimplência.
- Visualiza relatórios de presença, evolução e pagamentos.

### 3. Professor
- Registra presença dos alunos em cada aula.
- Visualiza seus grupos e turmas.
- Notifica alunos elegíveis para exame.
- Aprova trocas de faixa (após pagamento do exame).

### 4. Aluno
- Acompanha evolução por faixa e graus.
- Vê quantas aulas faltam para o próximo grau.
- Vê quando estará elegível ao exame de faixa.
- Pode escolher e trocar entre diferentes planos (no plano Master).
- Faz pagamento de planos e exames via integração Mercado Pago.

---

## Gestão de Turmas
As academias podem criar e gerenciar turmas com:
- Horário e Dias da semana.
- Professor responsável.
- Tipo da turma (iniciantes, intermediários, avançados, femininas, kids, etc.).
- Faixa mínima obrigatória e Capacidade máxima (opcional).
- **Chamada obrigatória:** O professor faz a chamada no início da aula (substitui catracas).

---

## Regras de Evolução e Graduação
- **Modelo:** Segue o padrão da IBJJF.
- **Graus:** Quantidade de aulas configurável pelo admin/matriz.
- **Automação:** Recebimento automático de grau a cada X aulas.
- **Notificação:** Aluno e professor notificados ao completar todos os graus.
- **Exame:** O sistema cria uma tarefa para agendar o exame de faixa.
- **Conclusão:** A troca de faixa requer aprovação do professor e confirmação de pagamento (no Master).

---

## Modelos de Negócio

### 1. Free
- Monitora apenas número de aulas por aluno.
- Sem graduações automáticas ou planos de pagamento.
- Sem Mercado Pago ou revenue share.

### 2. Standard
- **Preço:** R$ 0,50 por aluno.
- Frequência e Graduações automáticas.
- Gestão de exames e Configuração de planos (sem cobrança direta).
- Revenue share opcional para a matriz.

### 3. Master
- **Preço:** R$ 0,75 por aluno.
- Tudo do Standard + Controle de adimplência.
- Integração Mercado Pago (planos e exames).
- Troca de plano na área logada (recorrência no cartão de crédito).
- **Bloqueio automático:** Check-in bloqueado em caso de inadimplência.
- **White label:** Customização completa para academias.

---

## Pagamentos e Adimplência (Plano Master)
- Integração completa com Mercado Pago.
- Pagamentos recorrentes e notificações de inadimplência.
- **Bloqueio de Check-in:** Alunos inadimplentes não podem marcar presença.
- O professor visualiza o status no momento da chamada.
- Cancelamentos devem ser feitos presencialmente na academia.

---

## Revenue Share para Redes de Academia
- Configuração de percentual de repasse pela matriz (ex: 10% do valor de cada aluno).
- Cálculo automático pelo sistema com repasse mensal.
- Dashboards financeiros detalhados por filial e por rede.

---

## Área do Aluno
- Visualização do plano atual e comparação com outros planos.
- Vantagens da assinatura e mudanças imediatas de plano (Master).
- Histórico de pagamentos.

---

## White Label (Apenas Plano Master)
- Inserção de marca e alteração de cores.
- Alteração de favicon e logotipos (Web e Mobile).
- Personalização de e-mails de notificação.

---

## Estrutura de Dados Principais
- Usuários, Academias, Turmas, Professores, Alunos.
- Presenças, Faixas e graus, Configurações IBJJF.
- Planos da academia, Pagamentos, Assinaturas, Exames de faixa.
- Rede de academias (para revenue share).

---

## Requisitos Técnicos
- App + Web responsivo.
- Multi-tenant (várias academias e redes).
- Multi-perfil.
- Integração Mercado Pago completa.
- Notificações (E-mail e Push).
- Autogeração de graus baseada em presença.
- Dashboard completo para cada nível de usuário.
