// Student Dashboard Logic

let studentData = null;
let dashboardData = null;

// Belt Colors
const beltColors = {
    'Branca': { bg: '#F8FAFC', text: '#334155', icon: '#94A3B8' },
    'Cinza': { bg: '#6B7280', text: '#FFFFFF', icon: '#6B7280' },
    'Amarela': { bg: '#FCD34D', text: '#713F12', icon: '#F59E0B' },
    'Laranja': { bg: '#FF6B00', text: '#FFFFFF', icon: '#FF6B00' },
    'Verde': { bg: '#22C55E', text: '#FFFFFF', icon: '#22C55E' },
    'Azul': { bg: '#3B82F6', text: '#FFFFFF', icon: '#3B82F6' },
    'Roxa': { bg: '#A855F7', text: '#FFFFFF', icon: '#A855F7' },
    'Marrom': { bg: '#92400E', text: '#FFFFFF', icon: '#92400E' },
    'Preta': { bg: '#000000', text: '#FFFFFF', icon: '#000000' },
    'Coral': { bg: '#EE1111', text: '#FFFFFF', icon: '#EE1111' },
    'Vermelha': { bg: '#DC2626', text: '#FFFFFF', icon: '#DC2626' }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const stored = localStorage.getItem('studentData');
    if (!stored) {
        window.location.href = 'aluno-login.html';
        return;
    }

    studentData = JSON.parse(stored);
    await loadDashboard();
});

async function loadDashboard() {
    try {
        // Fetch dashboard data
        const response = await fetch(`${appConfig.apiBaseUrl}/students/${studentData.id}/dashboard`);
        const result = await response.json();

        if (!result.success) {
            throw new Error('Failed to load dashboard');
        }

        dashboardData = result.data;

        // Render all sections
        renderHeader();
        renderProgress();
        renderPayment();
        renderAcademyInfo();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Erro ao carregar dados. Tente novamente.');
    }
}

function renderHeader() {
    document.getElementById('student-name').textContent = dashboardData.profile.name;
    document.getElementById('academy-name').textContent = dashboardData.franchise.name;
}

function renderProgress() {
    const { belt, degree, totalClasses, classesForNextDegree, progressPercent, nextLevel } = dashboardData.progress;

    // Belt display
    document.getElementById('current-belt').textContent = belt;
    document.getElementById('current-degree').textContent = degree === 'Nenhum' ? 'Sem graus' : degree;

    // Belt icon styling
    const beltStyle = beltColors[belt] || beltColors['Branca'];
    const iconContainer = document.getElementById('belt-icon-container');
    const icon = document.getElementById('belt-icon');

    iconContainer.style.background = beltStyle.bg;
    icon.style.color = beltStyle.icon;

    // Progress bar
    if (nextLevel) {
        document.getElementById('progress-label').textContent = classesForNextDegree <= 0 ?
            `Pronto para: ${nextLevel.belt} - ${nextLevel.degree}` :
            `Faltam ${classesForNextDegree} aulas para ${nextLevel.degree === 'Nenhum' ? nextLevel.belt : nextLevel.degree}`;
    } else {
        document.getElementById('progress-label').textContent = 'Nível Máximo atingido!';
    }

    document.getElementById('progress-percent').textContent = `${progressPercent}%`;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('total-classes').textContent = totalClasses;
}

function renderPayment() {
    const { status, amount, history } = dashboardData.payment;

    // Status badge
    const badge = document.getElementById('payment-status-badge');
    if (status === 'Paga') {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600';
        badge.innerHTML = '<i class="fa-solid fa-check-circle mr-1"></i> Em Dia';
    } else {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600';
        badge.innerHTML = '<i class="fa-solid fa-exclamation-circle mr-1"></i> Atrasada';
    }

    // Monthly amount
    document.getElementById('monthly-amount').textContent = `R$ ${(amount || 0).toFixed(2)}`;

    // Last payment
    if (history && history.length > 0) {
        const lastPayment = history[0];
        const date = new Date(lastPayment.createdAt).toLocaleDateString('pt-BR');
        document.getElementById('last-payment').textContent = date;
    } else {
        document.getElementById('last-payment').textContent = 'Nenhum pagamento registrado';
    }

    // Payment history list
    const historyContainer = document.getElementById('payment-history');
    if (history && history.length > 0) {
        historyContainer.innerHTML = history.map(p => {
            const statusColor = p.status === 'approved' ? 'text-green-500' :
                p.status === 'pending' ? 'text-yellow-500' : 'text-red-500';
            const statusText = p.status === 'approved' ? 'Aprovado' :
                p.status === 'pending' ? 'Pendente' : 'Rejeitado';

            return `
                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <div>
                        <p class="text-xs font-bold text-slate-700">${p.description || 'Mensalidade'}</p>
                        <p class="text-[10px] text-slate-400">${new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold text-slate-800">R$ ${p.amount.toFixed(2)}</p>
                        <p class="text-[10px] font-bold ${statusColor}">${statusText}</p>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        historyContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Nenhum pagamento registrado</p>';
    }
}

function renderAcademyInfo() {
    document.getElementById('academy-address').textContent = dashboardData.franchise.address || '--';
    document.getElementById('academy-phone').textContent = dashboardData.franchise.phone || '--';
}

async function payTuition() {
    const btn = document.getElementById('pay-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processando...';

    try {
        const paymentData = {
            studentId: studentData.id,
            franchiseId: dashboardData.franchise.id,
            amount: dashboardData.payment.amount || 250,
            description: 'Mensalidade - ' + new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            type: 'Tuition'
        };

        const result = await PaymentAPI.createCheckout(paymentData);

        // Redirect to Mercado Pago
        if (result.initPoint || result.sandboxInitPoint) {
            window.location.href = result.sandboxInitPoint || result.initPoint;
        } else {
            alert('Link de pagamento criado! ID: ' + result.preferenceId);
        }

    } catch (error) {
        console.error('Payment error:', error);
        alert('Erro ao processar pagamento. Tente novamente.');

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-credit-card"></i> <span>Pagar Mensalidade</span>';
    }
}

function logout() {
    if (confirm('Deseja sair do portal?')) {
        localStorage.removeItem('studentData');
        window.location.href = 'aluno-login.html';
    }
}
