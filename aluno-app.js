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
    'Coral': { bg: 'repeating-linear-gradient(90deg, #F00 0, #F00 10px, #FFF 10px, #FFF 20px)', text: '#000000', border: '#DC2626' },
    'Vermelha': { bg: '#EE1111', text: '#FFFFFF', border: '#EE1111' }
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
        console.log('🔍 Loading dashboard for student:', studentData);
        const response = await fetch(`${appConfig.apiBaseUrl}/students/${studentData.id}/dashboard`);
        const result = await response.json();

        console.log('📦 API Response:', result);

        if (!result.success) {
            throw new Error('Failed to load dashboard');
        }

        dashboardData = result.data;
        console.log('✅ Dashboard Data:', dashboardData);

        // Render all sections
        applyBranding(dashboardData.franchise);
        renderHeader();
        renderProgress();
        renderPayment();
        renderAcademyInfo();

        // Update stats
        if (dashboardData.stats) {
            document.getElementById('stat-attended').textContent = dashboardData.stats.classesAttended || 0;
            document.getElementById('stat-streak').textContent = dashboardData.stats.streak || 0;
        }

        // Render history
        if (dashboardData.history) {
            renderHistory(dashboardData.history);
        }

        // Render Graduation History
        if (dashboardData.profile && dashboardData.profile.graduationHistory) {
            renderGraduationHistoryTable(dashboardData.profile.graduationHistory);
        }

        // Load schedule and ranking
        loadSchedule();
        loadRanking();

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        alert('Erro ao carregar dados. Tente novamente.');
    }
}

function renderHeader() {
    document.getElementById('student-name').textContent = dashboardData.profile.name;
    document.getElementById('academy-name').textContent = dashboardData.franchise.name;
}

function renderProgress() {
    // API returns 'stats' not 'progress'
    const stats = dashboardData.stats || {};
    const profile = dashboardData.profile || {};

    const belt = profile.belt || 'Branca';
    const degree = profile.degree || 'Nenhum';
    const totalClasses = stats.classesAttended || 0;
    const progressPercent = stats.progressPercent || 0;

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
    const classesRequired = stats.classesRequired || 0;
    const classesForNextDegree = Math.max(0, classesRequired - totalClasses);

    if (classesForNextDegree > 0) {
        document.getElementById('progress-label').textContent = `Faltam ${classesForNextDegree} aulas para próximo grau`;
    } else if (classesRequired > 0) {
        document.getElementById('progress-label').textContent = 'Pronto para graduação!';
    } else {
        document.getElementById('progress-label').textContent = 'Continue treinando!';
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
    const f = dashboardData.franchise;
    const b = f.branding || {};

    document.getElementById('academy-address').textContent = f.address || '--';
    document.getElementById('academy-phone').textContent = f.phone || '--';

    // Support Info
    const emailRow = document.getElementById('support-email-row');
    const phoneRow = document.getElementById('support-phone-row');
    const emailEl = document.getElementById('support-email');
    const phoneEl = document.getElementById('support-phone');

    if (b.supportEmail) {
        emailEl.textContent = b.supportEmail;
        emailRow.classList.remove('hidden');
    } else {
        emailRow.classList.add('hidden');
    }

    if (b.supportPhone) {
        phoneEl.textContent = b.supportPhone;
        phoneRow.classList.remove('hidden');
    } else {
        phoneRow.classList.add('hidden');
    }
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

// --- WHITE LABEL / BRANDING ---
function applyBranding(franchise) {
    if (!franchise || !franchise.branding) return;
    const b = franchise.branding;

    const primaryColor = b.primaryColor || '#3B82F6'; // Default student portal is blue-ish
    const brandName = b.brandName || franchise.name;

    // 1. CSS Styles
    const styleEl = document.getElementById('branding-styles');
    if (styleEl) {
        styleEl.innerHTML = `
            :root {
                --brand-primary: ${primaryColor};
            }
            .from-blue-500 { --tw-gradient-from: ${primaryColor} !important; }
            .to-blue-600 { --tw-gradient-to: ${primaryColor}dd !important; }
            .from-blue-50 { --tw-gradient-from: ${primaryColor}10 !important; }
            .to-indigo-50 { --tw-gradient-to: ${primaryColor}05 !important; }
            .text-blue-500 { color: ${primaryColor} !important; }
            .text-blue-600 { color: ${primaryColor} !important; }
            .bg-blue-500 { background-color: ${primaryColor} !important; }
            .border-blue-100 { border-color: ${primaryColor}30 !important; }
            
            /* Check-in Card Branding Override */
            .from-orange-500 { --tw-gradient-from: ${primaryColor} !important; }
            .to-red-600 { --tw-gradient-to: ${primaryColor}dd !important; }

            /* Dynamic Button Branding */
            .active-presence-btn { background-color: ${primaryColor} !important; }
            .active-presence-btn:hover { filter: brightness(110%); }
        `;
    }

    // 2. Logo
    const logoImg = document.getElementById('logo-img');
    const logoIcon = document.getElementById('logo-icon');
    if (b.logoUrl && logoImg) {
        logoImg.src = b.logoUrl;
        logoImg.classList.remove('hidden');
        if (logoIcon) logoIcon.classList.add('hidden');
        document.getElementById('logo-container').classList.remove('bg-gradient-to-br');
    }

    // 3. Favicon & Title
    if (b.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = b.faviconUrl;
    }
    document.title = `${brandName} | Portal do Aluno`;

    // 4. Login Background (if on login page)
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen && b.loginBackground) {
        if (b.loginBackground.startsWith('http') || b.loginBackground.startsWith('data:')) {
            loginScreen.style.backgroundImage = `url(${b.loginBackground})`;
            loginScreen.style.backgroundSize = 'cover';
            loginScreen.style.backgroundPosition = 'center';
        } else {
            loginScreen.style.backgroundColor = b.loginBackground;
            loginScreen.style.backgroundImage = 'none';
        }
    }
}

// --- CHECK-IN FUNCTIONALITY ---

async function performCheckIn(classId = null) {
    const btn = document.getElementById('btn-checkin');

    // UI Feedback
    btn.classList.add('animate-pulse', 'pointer-events-none');
    btn.innerHTML = `
    <div class="w-16 h-16 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
        <i class="fa-solid fa-spinner fa-spin"></i>
    </div>
    <div class="flex flex-col">
        <span class="text-lg font-black text-slate-800 tracking-tight">VALIDANDO...</span>
        <span class="text-[10px] font-bold text-slate-400 uppercase">Aguarde</span>
    </div>
`;

    // Get Location
    if (!navigator.geolocation) {
        alert('Seu navegador não suporta geolocalização. Use o Chrome ou Safari.');
        resetCheckInBtn(btn);
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        try {
            const res = await fetch(`${appConfig.apiBaseUrl}/students/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentData.id,
                    location: { lat: latitude, lng: longitude },
                    classId: classId
                })
            });

            const json = await res.json();

            if (json.success) {
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                alert('✅ Presença confirmada! Bom treino no tatame. Oss!');
                loadDashboard(); // Reload to update stats
            } else {
                alert('❌ Check-in Negado: ' + json.message);
            }
        } catch (e) {
            console.error(e);
            alert('❌ Erro na conexão com o servidor.');
        } finally {
            resetCheckInBtn(btn);
        }
    }, (error) => {
        console.error('Geolocation error:', error);
        let msg = 'Erro ao obter localização.';
        if (error.code === 1) msg = 'Por favor, autorize o acesso à localização para bater o ponto.';
        alert('⚠️ ' + msg);
        resetCheckInBtn(btn);
    }, {
        enableHighAccuracy: true,
        timeout: 10000
    });
}

function resetCheckInBtn(btn) {
    btn.classList.remove('animate-pulse', 'pointer-events-none');
    btn.innerHTML = `
    <div class="w-16 h-16 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
        <i class="fa-solid fa-location-dot"></i>
    </div>
    <div class="flex flex-col">
        <span class="text-lg font-black text-slate-800 tracking-tight">CHECK-IN</span>
        <span class="text-[10px] font-bold text-slate-400 uppercase">Bater Ponto</span>
    </div>
`;
}

// --- HISTORY RENDERING ---

function renderHistory(items) {
    const container = document.getElementById('history-list');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
        <div class="text-center py-8 text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
            <i class="fa-solid fa-clock-rotate-left text-4xl mb-2 opacity-20"></i>
            <p class="text-xs font-bold uppercase tracking-widest">Nenhum treino registrado</p>
        </div>
    `;
        return;
    }

    container.innerHTML = items.map(item => {
        const date = new Date(item.date);
        const dateLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

        return `
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 text-lg">
                    <i class="fa-solid fa-check"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${item.classId?.name || 'Check-in Avulso'}</h4>
                    <span class="text-xs text-slate-400 font-medium capitalize">${dateLabel}</span>
                </div>
            </div>
            <span class="text-xs font-black text-green-600">+1</span>
        </div>
    `;
    }).join('');
}

// --- CLASS BOOKING (NO LOCATION) ---

async function confirmClassPresence(classId) {
    // Find button to animate
    const btn = document.getElementById(`btn-presence-${classId}`);
    const originalText = btn ? btn.innerHTML : 'Presença';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    }

    try {
        const res = await fetch(`${appConfig.apiBaseUrl}/students/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: studentData.id,
                classId: classId
                // No location sent, backend will skip geo-check for class bookings
            })
        });

        const json = await res.json();

        if (json.success) {
            alert('✅ Presença confirmada! Seu lugar está reservado.');
            loadDashboard(); // Refresh UI
        } else {
            alert('❌ ' + json.message);
            // Reset button
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    } catch (e) {
        console.error(e);
        alert('❌ Erro de conexão.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// --- SCHEDULE LOADING ---

async function loadSchedule() {
    try {
        const list = document.getElementById('schedule-list');
        const label = document.getElementById('current-date-label');

        if (!list || !label) return;

        // Date formatting
        const now = new Date();
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        label.textContent = now.toLocaleDateString('pt-BR', options);

        const res = await fetch(`${appConfig.apiBaseUrl}/classes/franchise/${dashboardData.franchise.id}`);
        const json = await res.json();

        if (json.success && json.data.length > 0) {
            renderSchedule(json.data);
        } else {
            list.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i class="fa-solid fa-calendar-xmark text-4xl mb-4 opacity-20"></i>
                <p class="text-xs font-bold uppercase tracking-widest">Nenhuma aula hoje</p>
            </div>
        `;
        }
    } catch (e) {
        console.error('Schedule error:', e);
    }
}

function renderSchedule(classes) {
    const list = document.getElementById('schedule-list');
    if (!list) return;

    const categoryColors = {
        'BJJ': { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'fa-user-ninja' },
        'No-Gi': { bg: 'bg-slate-100', text: 'text-slate-800', icon: 'fa-shirt' },
        'Fundamentals': { bg: 'bg-green-50', text: 'text-green-600', icon: 'fa-graduation-cap' },
        'Kids': { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'fa-child' },
        'Wrestling': { bg: 'bg-red-50', text: 'text-red-600', icon: 'fa-hand-rock' }
    };

    list.innerHTML = classes.map(c => {
        const style = categoryColors[c.category] || categoryColors['BJJ'];
        const isAttended = hasAttendedClass(c._id);

        const buttonHtml = isAttended
            ? `<button disabled class="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider opacity-80 cursor-not-allowed shadow-sm flex items-center gap-1">
                 <i class="fa-solid fa-check"></i> Presença Confirmada
               </button>`
            : `<button id="btn-presence-${c._id}" onclick="confirmClassPresence('${c._id}')" class="px-4 py-2 active-presence-btn text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:scale-105 active:scale-95">
                 Presença
               </button>`;

        return `
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-shadow gap-4">
            <div class="flex items-center gap-4 w-full md:w-auto">
                <div class="w-14 h-14 rounded-2xl ${style.bg} flex flex-col items-center justify-center ${style.text}">
                    <span class="text-xs font-black leading-none">${c.startTime}</span>
                    <i class="fa-solid ${style.icon} text-lg mt-1"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${c.name}</h4>
                    <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <i class="fa-solid fa-user-tie"></i>
                        <span>${c.teacherId?.name || 'Instrutor Arena'}</span>
                    </div>
                </div>
            </div>
            <div class="w-full md:w-auto flex justify-end">
                ${buttonHtml}
            </div>
        </div>
    `;
    }).join('');
}

function hasAttendedClass(classId) {
    if (!dashboardData || !dashboardData.history) return false;

    // Check if any check-in in history matches this class ID and is from today
    const today = new Date().toDateString();

    return dashboardData.history.some(item => {
        const itemDate = new Date(item.date).toDateString();
        // Handle populated classId object or direct string ID
        const itemClassId = item.classId && typeof item.classId === 'object' ? item.classId._id : item.classId;

        return itemClassId === classId && itemDate === today;
    });
}

// --- RANKING LOADING ---

async function loadRanking(period = 'current_month') {
    try {
        const list = document.getElementById('leaderboard-list');
        if (!list) return; // Guard clause

        list.innerHTML = `
        <div class="p-10 text-center text-slate-400">
            <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
            <p class="text-xs font-bold uppercase tracking-widest">Carregando...</p>
        </div>
    `;

        const res = await fetch(`${appConfig.apiBaseUrl}/students/ranking/${dashboardData.franchise.id}?period=${period}`);
        const json = await res.json();

        if (json.success) renderLeaderboard(json.data);

    } catch (e) {
        console.error('Ranking error:', e);
    }
}

function changeRankingPeriod(period) {
    loadRanking(period);
}

function renderLeaderboard(data) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    if (!data || data.length === 0) {
        list.innerHTML = `<div class="p-10 text-center text-slate-400">Nenhum dado este mês</div>`;
        return;
    }

    const beltStyles = {
        'Branca': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border border-slate-300' },
        'Cinza': { bg: 'bg-gray-400', text: 'text-white', border: '' },
        'Amarela': { bg: 'bg-yellow-400', text: 'text-yellow-900', border: '' },
        'Laranja': { bg: 'bg-orange-500', text: 'text-white', border: '' },
        'Verde': { bg: 'bg-green-500', text: 'text-white', border: '' },
        'Azul': { bg: 'bg-blue-500', text: 'text-white', border: '' },
        'Roxa': { bg: 'bg-purple-500', text: 'text-white', border: '' },
        'Marrom': { bg: 'bg-amber-800', text: 'text-white', border: '' },
        'Preta': { bg: 'bg-black', text: 'text-white', border: '' },
        'Coral': { bg: 'bg-red-400', text: 'text-white', border: '' },
        'Vermelha': { bg: 'bg-red-600', text: 'text-white', border: '' }
    };

    list.innerHTML = data.map((item, index) => {
        const isTop3 = index < 3;
        const trophyColors = ['text-yellow-500', 'text-slate-400', 'text-orange-400'];
        const style = beltStyles[item.belt] || beltStyles['Branca'];
        const degreeText = item.degree && item.degree !== 'Nenhum' ? ` • ${item.degree}` : '';

        return `
        <div class="p-4 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
            <div class="flex items-center gap-4">
                <span class="w-6 text-xs font-black text-slate-300">${index + 1}</span>
                <div class="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                    ${item.photo ? `<img src="${item.photo}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><i class="fa-solid fa-user"></i></div>`}
                </div>
                <div>
                    <h4 class="text-xs font-bold text-slate-800">${item.name}</h4>
                    <div class="mt-1">
                        <span class="${style.bg} ${style.text} ${style.border} text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded inline-block">
                            ${item.belt}${degreeText}
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-xs font-black text-slate-900">${item.count} <span class="text-[9px] text-slate-400 font-bold uppercase">Treinos</span></span>
                ${isTop3 ? `<i class="fa-solid fa-trophy ${trophyColors[index]}"></i>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

function renderGraduationHistoryTable(history) {
    const container = document.getElementById('graduation-history-container');
    const tbody = document.getElementById('graduation-history-body');

    if (!container || !tbody) return;

    if (!history || history.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    // Sort by date descending
    const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map(item => {
        const date = new Date(item.date).toLocaleDateString('pt-BR');
        const promotedName = item.promotedBy ? item.promotedBy.name : (item.promotedBy === null ? '-' : 'Sistema');

        // Handle case where promotedBy might be just an ID string if population failed (though it shouldn't)
        const masterName = typeof item.promotedBy === 'object' && item.promotedBy?.name ? item.promotedBy.name : '-';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 text-slate-600 font-medium">${date}</td>
                <td class="px-4 py-3 font-bold text-slate-800">${item.belt}</td>
                <td class="px-4 py-3 text-slate-500">${item.degree || 'Nenhum'}</td>
                <td class="px-4 py-3 text-slate-500 text-[10px] uppercase font-bold tracking-wider">${masterName}</td>
            </tr>
        `;
    }).join('');
}
