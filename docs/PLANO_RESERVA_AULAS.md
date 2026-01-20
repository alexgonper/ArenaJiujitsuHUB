
# 📋 Plano de Implementação: Sistema de Reserva de Aulas

Este documento detalha o plano técnico para implementar o sistema de **Reserva de Aulas (Booking)**, permitindo que alunos garantam uma vaga antecipadamente e que professores gerenciem essas reservas.

## 1. Visão Geral do Fluxo

1.  **Aluno**: Visualiza a grade de horários, vê vagas disponíveis e clica em **"Reservar"**.
    *   Se a aula estiver cheia (Reservas + Check-ins >= Capacidade): Botão bloqueado ("Vagas Esgotadas").
    *   Se já reservou: Botão muda para **"Cancelar Reserva"**.
2.  **Professor**: No painel da aula, visualiza duas listas (ou uma lista unificada com status):
    *   *Confirmados* (Check-in Realizado).
    *   *Reservados* (Ainda não chegaram).
3.  **Confirmação**: O professor pode clicar em um aluno "Reservado" para confirmar a presença manual (transformando a reserva em presença).

---

## 2. Estrutura de Banco de Dados (Backend)

Precisamos de uma nova entidade para gerenciar a intenção de ir à aula antes do check-in efetivo.

### Novo Modelo: `ClassBooking` (Reserva)
Criar arquivo: `server/models/ClassBooking.js`

```javascript
const mongoose = require('mongoose');

const classBookingSchema = new mongoose.Schema({
    franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true }, // Aula recorrente (ex: Seg 19h)
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: Date, required: true }, // Data ESPECÍFICA da aula (ex: 2023-10-25)
    status: {
        type: String,
        enum: ['reserved', 'cancelled', 'confirmed'], // confirmed = virou check-in
        default: 'reserved'
    }
}, { timestamps: true });

// Índice para garantir que aluno não reserve 2x a mesma aula na mesma data
classBookingSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });
// Índice para contagem rápida de vagas
classBookingSchema.index({ classId: 1, date: 1, status: 1 });

module.exports = mongoose.model('ClassBooking', classBookingSchema);
```

---

## 3. Alterações na API (Backend)

### A. Novo Controller: `bookingController.js`
Responsável pela lógica de reservas.
*   **`createBooking` (POST /bookings)**:
    1.  Recebe `classId`, `date`, `studentId`.
    2.  Verifica se já existe reserva ativa para este aluno.
    3.  **Verificação de Capacidade**: Conta quantas reservas ativas existem para essa `classId` + `date`.
    4.  Se `count < class.capacity`, cria a reserva. Caso contrário, retorna erro "Vagas Esgotadas".
*   **`cancelBooking` (DELETE /bookings/:id)**:
    1.  Altera status para `cancelled` ou remove o documento.

### B. Atualização do `classController.js` -> `getSchedule`
Ao retornar a grade semanal para o aluno, precisamos enriquecer os dados.
*   Para cada aula retornada, calcular a data da próxima ocorrência (dentro da semana visualizada).
*   Incluir campo `bookingStatus`:
    *   `isBookedByMe`: boolean (se o usuário atual já reservou).
    *   `availableSlots`: number (`capacity` - total de reservas ativas).

### C. Atualização do `teacherController.js`
*   No endpoint que lista alunos da aula, buscar tanto da tabela `Attendance` (já confirmados) quanto `ClassBooking` (apenas reservados).

---

## 4. Alterações no Frontend (Portal do Aluno)

### Arquivo: `aluno-app.js`

1.  **Atualizar `renderSchedule`**:
    *   Alterar o botão "Presença" atual para uma lógica de dois estados.
    *   Lógica de renderização do botão:
        ```javascript
        if (aula.isBookedByMe) {
            return <BotaoVermelho text="Cancelar Reserva" onClick={cancelar} />
        } else if (aula.availableSlots <= 0) {
            return <BotaoCinza text="Esgotado" disabled />
        } else {
            return <BotaoPrincipal text="Reservar Aula" onClick={reservar} />
        }
        ```
    *   Exibir contador de vagas no card: "Vagas: 5/30".

2.  **Novas Funções de API**:
    *   `reserveClass(classId, date)`
    *   `cancelReservation(bookingId)`

---

## 5. Alterações no Frontend (Portal do Professor)

### Arquivo: `teacher-app.js`

1.  **Atualizar `loadClassAttendance`**:
    *   Hoje essa função busca apenas check-ins (`/attendance`).
    *   Deverá buscar também as reservas (`/bookings/list`).
    *   Combinar as listas na visualização.

2.  **Visualização da Lista**:
    *   Diferenciar visualmente:
        *   ✅ **Confirmado**: Fundo verde (Check-in feito).
        *   📅 **Reservado**: Fundo amarelo/azul claro. Botão para "Confirmar Presença" (que chama a API de check-in e atualiza o status da reserva).

---

## Resumo dos Passos de Execução

1.  Criar Model `ClassBooking`.
2.  Criar Rotas de API (`bookingRoutes.js`).
3.  Implementar validação de vagas no Backend.
4.  Atualizar Interface do Aluno para exibir vagas e botão de reservar.
5.  Atualizar Interface do Professor para listar reservas e permitir confirmação.
