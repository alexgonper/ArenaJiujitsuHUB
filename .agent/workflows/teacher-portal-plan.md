# Plano de Implementação: Painel do Professor (Teacher Portal) 🥋👨‍🏫

Este plano descreve a criação de um portal mobile-first exclusivo para os instrutores da Arena Jiu-Jitsu Hub, focado em gestão de aulas e controle de presença.

## 1. Infraestrutura Backend
- **Controller de Professores:**
    - `login`: Autenticação via e-mail.
    - `getDashboard`: Retorna estatísticas do professor e sua agenda do dia.
- **Estatísticas e Controle:**
    - Listagem de alunos por unidade (para chamada manual).
    - Endpoint para confirmação/registro manual de presença pelo professor.

## 2. Interface (Frontend)
- **Acessos:** 
    - `teacher-login.html`: Login premium com visual focado em autoridade/liderança.
    - `teacher.html`: Dashboard principal com navegação simplificada.
    - `teacher-app.js`: Lógica de gerenciamento de estado e chamadas API.

## 3. Funcionalidades Core (Tabs)
- **Home (Dashboard):**
    - Card da "Aula Ativa" ou "Próxima Aula".
    - Resumo de alunos treinando hoje na unidade.
- **Agenda:**
    - Grade completa de horários do professor logado.
    - Filtro por dia da semana.
- **Gestão de Aula (O coração do sistema):**
    - Lista em tempo real de quem fez check-in via GPS.
    - Busca rápida de alunos para "Check-in Manual" (para quem esqueceu o celular ou alunos visitantes).
    - Botão de "Finalizar Aula" para consolidar estatísticas.

## 4. Diferenciais Premium
- **Modo Noturno Nativo:** Interface dark-themed por padrão para ser usada no ambiente de academia.
- **Feedback Visual:** Indicadores de cor para alunos com mensalidade em dia vs. atrasada (futuro).
- **Notificações:** Alerta quando o limite de capacidade da aula for atingido.

---
**Status Atual:** Aguardando sinal verde para iniciar o Passo 1 (Login e Dashboard Backend).
