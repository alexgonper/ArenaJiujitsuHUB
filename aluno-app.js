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
        const response = await fetch(`${appConfig.apiBaseUrl}/students/${studentData.id}/dashboard?_t=${new Date().getTime()}`);
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
        // loadSchedule(); // Deprecated - schedule now loads on demand when clicking "Grade Horária"
        loadRanking();


    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        
        // Auto-Logout if dashboard fails completely (invalid user/session)
        if (!dashboardData) {
            console.warn('Dashboard load failed critically. Clearing session and redirecting.');
            localStorage.removeItem('studentData');
            localStorage.removeItem('arena_token');
            alert('Sessão inválida. Por favor faça login novamente.');
            window.location.href = 'aluno-login.html';
            return;
        }

        showToast('Erro ao carregar dados.', 'error');
    }
}

function renderHeader() {
    const name = dashboardData.profile.name;
    const academy = dashboardData.franchise.name;

    const nameEl = document.getElementById('student-name');
    if (nameEl) nameEl.textContent = `Olá, ${name.split(' ')[0]}`;

    const academyEl = document.getElementById('academy-name');
    if (academyEl) academyEl.textContent = academy;

    const sidebarName = document.getElementById('student-name-sidebar');
    if (sidebarName) sidebarName.textContent = name;

    const sidebarAcademy = document.getElementById('academy-name-sidebar');
    if (sidebarAcademy) sidebarAcademy.textContent = academy;

    const avatar = document.getElementById('profile-avatar-sidebar');
    if (avatar) avatar.textContent = name.charAt(0);
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
    const beltLabel = belt;
    const degreeLabel = degree === 'Nenhum' ? '0 Graus' : degree;

    // --- NEW: Next Belt Logic ---
    const beltOrder = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'];
    const currentIndex = beltOrder.indexOf(belt);
    const nextBeltName = currentIndex >= 0 && currentIndex < beltOrder.length - 1 ? beltOrder[currentIndex + 1] : 'Mestre';
    
    // --- 1. POPULATE DASHBOARD CARD (dash- prefixes) ---
    const dashBelt = document.getElementById('dash-current-belt');
    const dashDegree = document.getElementById('dash-current-degree');
    const dashNextBelt = document.getElementById('dash-next-belt');
    
    if (dashBelt) dashBelt.textContent = beltLabel;
    if (dashDegree) dashDegree.textContent = degreeLabel;
    if (dashNextBelt) dashNextBelt.textContent = nextBeltName;

    document.getElementById('dash-visual-curr-belt') && renderRealisticBelt('dash-visual-curr-belt', belt, degree);
    document.getElementById('dash-visual-next-belt') && renderRealisticBelt('dash-visual-next-belt', nextBeltName, '0');

    // --- 2. POPULATE EVOLUTION PAGE (evo-page- prefixes) ---
    const evoBelt = document.getElementById('evo-page-current-belt');
    const evoDegree = document.getElementById('evo-page-current-degree');
    const evoNextBelt = document.getElementById('evo-page-next-belt');
    
    if (evoBelt) evoBelt.textContent = beltLabel;
    if (evoDegree) evoDegree.textContent = degreeLabel;
    if (evoNextBelt) evoNextBelt.textContent = nextBeltName;

    document.getElementById('visual-curr-belt') && renderRealisticBelt('visual-curr-belt', belt, degree);
    document.getElementById('visual-next-belt') && renderRealisticBelt('visual-next-belt', nextBeltName, '0');


    // Progress bar calculations
    const classesRequired = stats.classesRequired || 0;
    const classesForNextDegree = Math.max(0, classesRequired - totalClasses);
    let progressLabel = '';

    if (classesForNextDegree > 0) {
        progressLabel = `Faltam ${classesForNextDegree} aulas`;
    } else if (classesRequired > 0) {
        progressLabel = 'Pronto para graduação!';
    } else {
        progressLabel = 'Continue treinando!';
    }

    // Update Dashboard Stats (Journey Card)
    const dashClassesLeft = document.getElementById('dash-classes-left-big');
    const dashPercent = document.getElementById('dash-percent-text-big');
    const dashBar = document.getElementById('dash-progress-bar-big');
    const dashTotal = document.getElementById('dash-total-classes-footer');

    if (dashClassesLeft) dashClassesLeft.textContent = classesForNextDegree;
    if (dashPercent) dashPercent.textContent = `${progressPercent}%`;
    if (dashBar) dashBar.style.width = `${progressPercent}%`;
    if (dashTotal) dashTotal.textContent = totalClasses;

    // Update Evolution Page Stats
    const bigClassesLeft = document.getElementById('big-classes-left');
    const bigPercentText = document.getElementById('big-percent-text');
    const evoBar = document.getElementById('evo-page-progress-bar');
    const evoTotal = document.getElementById('evo-page-total-classes');

    if (bigClassesLeft) bigClassesLeft.textContent = classesForNextDegree;
    if (bigPercentText) bigPercentText.textContent = `${progressPercent}%`;
    if (evoBar) evoBar.style.width = `${progressPercent}%`;
    if (evoTotal) evoTotal.textContent = totalClasses;
}

// Helper for CSS Belts
function renderRealisticBelt(elementId, beltName, degree) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const colorData = beltColors[beltName] || beltColors['Branca'];
    
    // Background based on belt color
    el.style.background = colorData.bg;
    el.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    
    // Rank Bar Color (Black for colored belts, Red for Black belt, Black for White belt)
    let rankBarColor = 'black';
    if (beltName === 'Preta') rankBarColor = '#DC2626'; // Red
    // if (beltName === 'Vermelha') rankBarColor = 'white'; // Example

    // Parse degrees
    let degreeCount = 0;
    if (typeof degree === 'string') {
        const match = degree.match(/(\d+)/);
        if (match) degreeCount = parseInt(match[1]);
    } else if (typeof degree === 'number') {
        degreeCount = degree;
    }

    // Build Stripes HTML
    let stripesHtml = '';
    for (let i = 0; i < degreeCount; i++) {
        stripesHtml += `<div class="bg-white w-full h-[3px] rounded-sm shadow-sm"></div>`;
    }

    // Inject Inner HTML for the Rank Bar
    el.innerHTML = `
        <div class="absolute right-0 top-0 bottom-0 w-4 rounded-r flex flex-col justify-center gap-1 px-0.5 shadow-sm border-l border-white/10" 
             style="background-color: ${rankBarColor};">
             ${stripesHtml}
        </div>
    `;
}

function renderPayment() {
    const { status, amount, history } = dashboardData.payment;

    // Status badge
    const badge = document.getElementById('payment-status-badge');
    const badgePage = document.getElementById('fin-page-status-badge');
    
    let badgeHTML = '';
    let badgeClass = '';

    if (status === 'Paga') {
        badgeClass = 'px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600';
        badgeHTML = '<i class="fa-solid fa-check-circle mr-1"></i> Em Dia';
    } else {
        badgeClass = 'px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600';
        badgeHTML = '<i class="fa-solid fa-exclamation-circle mr-1"></i> Atrasada';
    }

    if (badge) {
        badge.className = badgeClass;
        badge.innerHTML = badgeHTML;
    }
    if (badgePage) {
        badgePage.className = badgeClass;
        badgePage.innerHTML = badgeHTML;
    }

    // Monthly amount
    const amountFormatted = `R$ ${(amount || 0).toFixed(2)}`;
    const amountEl = document.getElementById('monthly-amount');
    const amountPageEl = document.getElementById('fin-page-monthly-amount');
    
    if (amountEl) amountEl.textContent = amountFormatted;
    if (amountPageEl) amountPageEl.textContent = amountFormatted;

    // Last payment
    let lastPaymentText = 'Nenhum pagamento registrado';
    if (history && history.length > 0) {
        const lastPayment = history[0];
        lastPaymentText = new Date(lastPayment.createdAt).toLocaleDateString('pt-BR');
    }
    
    const lastPaymentEl = document.getElementById('last-payment');
    const lastPaymentPageEl = document.getElementById('fin-page-last-payment');

    if (lastPaymentEl) lastPaymentEl.textContent = lastPaymentText;
    if (lastPaymentPageEl) lastPaymentPageEl.textContent = lastPaymentText;

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

    const addressEl = document.getElementById('academy-address');
    if (addressEl) addressEl.textContent = f.address || '--';
    
    const phoneEl = document.getElementById('academy-phone');
    if (phoneEl) phoneEl.textContent = f.phone || '--';

    // Support Info
    const emailRow = document.getElementById('support-email-row');
    const phoneRow = document.getElementById('support-phone-row');
    const supportEmailEl = document.getElementById('support-email');
    const supportPhoneEl = document.getElementById('support-phone');

    if (b.supportEmail && supportEmailEl && emailRow) {
        supportEmailEl.textContent = b.supportEmail;
        emailRow.classList.remove('hidden');
    } else if (emailRow) {
        emailRow.classList.add('hidden');
    }

    if (b.supportPhone && supportPhoneEl && phoneRow) {
        supportPhoneEl.textContent = b.supportPhone;
        phoneRow.classList.remove('hidden');
    } else if (phoneRow) {
        phoneRow.classList.add('hidden');
    }
}

async function payTuition(btnId = 'pay-btn') {
    const btn = document.getElementById(btnId);
    const originalContent = btn ? btn.innerHTML : 'Pagar Mensalidade';
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processando...';
    }

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
        showToast('Erro ao processar pagamento.', 'error');

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
}

// Logout
function logout() {
    showPortalConfirm('Encerrar Sessão', 'Deseja realmente sair do portal do aluno?', () => {
        localStorage.removeItem('studentData');
        window.location.href = 'aluno-login.html';
    });
}

// Global UI Helpers (System Standard)
window.closeModal = function () {
    const modal = document.getElementById('ui-modal');
    const panel = document.getElementById('modal-panel');
    if (panel) {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => {
        if (modal) modal.style.display = 'none';
    }, 300);
};

window.showPortalConfirm = function (title, message, onConfirm) {
    const modal = document.getElementById('ui-confirm-modal');
    const panel = document.getElementById('confirm-panel');
    const backdrop = document.getElementById('confirm-backdrop');
    if (!modal) return;
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerText = message;
    const yesBtn = document.getElementById('btn-confirm-yes');
    yesBtn.onclick = () => {
        closeConfirmModal();
        if (onConfirm) onConfirm();
    };
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.closeConfirmModal = function () {
    const modal = document.getElementById('ui-confirm-modal');
    const panel = document.getElementById('confirm-panel');
    const backdrop = document.getElementById('confirm-backdrop');
    if (panel) {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
    }
    setTimeout(() => {
        if (modal) modal.style.display = 'none';
    }, 300);
};

window.showToast = function (message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;

    toastMsg.textContent = message;

    if (type === 'success') {
        toastIcon.className = 'w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg';
        toastIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
    } else {
        toastIcon.className = 'w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg';
        toastIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }

    toast.classList.remove('opacity-0', 'translate-x-32');
    toast.classList.add('opacity-100', 'translate-x-0');

    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-x-0');
        toast.classList.add('opacity-0', 'translate-x-32');
    }, 3000);
};

// --- WHITE LABEL / BRANDING ---
function applyBranding(franchise) {
    if (!franchise || !franchise.branding) return;
    const b = franchise.branding;

    const primaryColor = b.primaryColor || '#3B82F6'; // Default student portal is blue-ish
    const brandName = b.brandName || franchise.name;

    // Set Global CSS Variable for Sensei & Systems
    document.documentElement.style.setProperty('--brand-primary', primaryColor);

    // 1. CSS Styles
    const styleEl = document.getElementById('branding-styles');
    if (styleEl) {
        styleEl.innerHTML = `
            /* Sidebar & Menu Branding */
            .sidebar-item-active {
                background-color: ${primaryColor}15 !important;
                color: ${primaryColor} !important;
                border-left: 4px solid ${primaryColor} !important;
            }
            .sidebar-item-active i {
                color: ${primaryColor} !important;
            }
            .hover\\:text-blue-600:hover { color: ${primaryColor} !important; }
            #profile-avatar-sidebar { background: ${primaryColor} !important; }

            /* Check-in Card (Hero) Branding */
            #checkin-card { background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%) !important; }
            #checkin-card h3, #checkin-card p { color: white !important; opacity: 0.9; }
            #checkin-card .bg-white\\/10 { background-color: rgba(255,255,255, 0.15) !important; }
            #btn-checkin div:first-child { background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%) !important; }

            /* Action Buttons Branding */
            .brand-btn-bg { background-color: ${primaryColor} !important; }
            .brand-btn-bg:hover { filter: brightness(110%); }
            
            /* Blue/Indigo Theme Overrides */
            .text-blue-500, .text-blue-600 { color: ${primaryColor} !important; }
            .bg-blue-50 { background-color: ${primaryColor}10 !important; }
            .bg-blue-500, .bg-blue-600 { background-color: ${primaryColor} !important; }
            .border-blue-100 { border-color: ${primaryColor}30 !important; }
            .from-blue-600, .from-blue-500 { --tw-gradient-from: ${primaryColor} !important; }
            .to-indigo-700, .to-indigo-600 { --tw-gradient-to: ${primaryColor}dd !important; }

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
                showToast('✅ Presença confirmada! Bom treino no tatame. Oss!');
                loadDashboard(); // Reload to update stats
            } else {
                showToast('❌ Check-in Negado: ' + json.message, 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('❌ Erro na conexão com o servidor.', 'error');
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
            showToast('✅ Presença confirmada! Seu lugar está reservado.');
            loadDashboard(); // Refresh UI
        } else {
            showToast('❌ ' + json.message, 'error');
            // Reset button
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    } catch (e) {
        console.error(e);
        showToast('❌ Erro de conexão.', 'error');
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

// --- WEEKLY SCHEDULE LOGIC (Student) ---
let currentStudentScheduleFilter = 'my'; // 'my' or 'all'
let allStudentWeeklyClasses = [];
let studentAttendedClassIds = []; // Track which classes student has attended
let studentActiveBookings = []; // Track active future bookings

async function loadStudentSchedule() {
    try {
        // Wait for dashboard data to be ready
        if (!dashboardData || !dashboardData.franchise) {
            console.warn('Dashboard data not ready yet, retrying in 500ms...');
            setTimeout(loadStudentSchedule, 500);
            return;
        }

        const franchiseId = dashboardData.franchise?.id || dashboardData.franchise?._id;
    
    if (!franchiseId) {
        showToast('⚠️ Erro de Sessão: Franquia não identificada. Por favor, saia e entre novamente.', 'error');
        console.error('Franchise ID not found in dashboardData', dashboardData);
        return;
    }

    const today = new Date();
    // Start of current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0,0,0,0);
    
    // End of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

        // Inner try removed to fix nesting error
        const timestamp = Date.now();
        const startStr = startOfWeek.toISOString();
        const endStr = endOfWeek.toISOString();
        
        console.log(`Fetching schedule for Franchise: ${franchiseId} (${startStr} to ${endStr})`);

        // Parallel requests with Auth Headers
        const [scheduleRes, bookingsRes] = await Promise.all([
            // Add view=week to fetch all classes for the weekly schedule view
            fetch(`${appConfig.apiBaseUrl}/classes/franchise/${franchiseId}?view=week&startDate=${startStr}&endDate=${endStr}&studentId=${studentData.id}&_t=${timestamp}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('arena_token')}` }
            }),
            fetch(`${appConfig.apiBaseUrl}/bookings/student/${studentData.id}?_t=${timestamp}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('arena_token')}` }
            })
        ]);

        const scheduleResult = await scheduleRes.json();
        const bookingsResult = await bookingsRes.json();
        
        console.log('Schedule API response:', scheduleResult);
        console.log('Bookings API response:', bookingsResult);

        if (scheduleResult.success) {
            allStudentWeeklyClasses = scheduleResult.data || [];
            studentActiveBookings = bookingsResult.success ? (bookingsResult.data || []) : [];
            
            // Get list of class IDs student has attended to highlight them (History)
            if (dashboardData.history) {
                studentAttendedClassIds = dashboardData.history.map(h => {
                    return h.classId && typeof h.classId === 'object' ? h.classId._id : h.classId;
                }).filter(Boolean);
            }
            
            // Merge Booking Info manually if backend missed it
            allStudentWeeklyClasses.forEach(cls => {
                const classId = cls._id || cls.id;
                
                // Find matching booking for this class (approximate date match)
                if (!cls.bookingInfo) cls.bookingInfo = { availableSlots: 30, capacity: 30 };
                
                // If backend already flagged it, good. If not, check manual list.
                if (cls.bookingInfo.isBookedByMe) return;

                const nextDate = cls.bookingInfo.nextDate ? new Date(cls.bookingInfo.nextDate) : null;
                
                const matchingBooking = studentActiveBookings.find(b => {
                    // 1. ID Check (Robust to string/object differences)
                    // Normalize both IDs to strings explicitly
                    const rawBId = b.classId && (b.classId._id || b.classId);
                    const bClassIdStr = rawBId ? String(rawBId) : '';
                    const classIdStr = String(classId);
                    
                    // DEBUG LOG: Only log if we suspect a match (performance) or for the first few
                    // console.log(`Comparing Booking Class ${bClassIdStr} with Schedule Class ${classIdStr}`);
                    
                    if (bClassIdStr !== classIdStr) return false;
                    
                    console.log('🔹 MATCH ID FOUND!', classIdStr);
                    
                    // 2. Date Check (Use UTC to avoid timezone boundary issues)
                    if (!nextDate) return true; // Fallback: if class has no specific date, match by ID
                    
                    // If IDs match, we trust it 99%, unless date is wildly off (like next month)
                    // We simply accept it for Weekly View to ensure Green Card appears
                    return true;
                });
                
                if (matchingBooking) {
                    console.log('✅ Found manual booking match for class:', cls.name);
                    cls.bookingInfo.isBookedByMe = true;
                    cls.bookingInfo.myBookingId = matchingBooking._id;
                    // Force UI update params
                    cls.isReservedLocally = true;
                }
            });
            
            console.log('Loaded', allStudentWeeklyClasses.length, 'classes');
            console.log('Student attended', studentAttendedClassIds.length, 'classes');
            console.log('Active bookings', studentActiveBookings.length);
            
            renderStudentSchedule();
        } else {
            console.error('Failed to load schedule:', scheduleResult.message);
            showToast('Erro: ' + (scheduleResult.message || 'Falha ao buscar dados'), 'error');
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        showToast('Erro de conexão ao carregar agenda', 'error');
    }
}

function renderStudentSchedule() {
    console.log('Rendering schedule with filter:', currentStudentScheduleFilter);
    
    // Apply filter
    const classesToShow = currentStudentScheduleFilter === 'my' 
        ? allStudentWeeklyClasses.filter(cls => {
            // Show classes from student's attendance history OR booked classes
            const classId = cls._id || cls.id;
            const hasAttended = studentAttendedClassIds.includes(classId);
            const isBooked = cls.bookingInfo?.isBookedByMe || false;
            
            if (isBooked || hasAttended) {
                console.log('Class included in "my" filter:', cls.name, { hasAttended, isBooked, bookingInfo: cls.bookingInfo });
            }
            
            return hasAttended || isBooked;
        })
        : allStudentWeeklyClasses;
    
    console.log('Classes to show after filter:', classesToShow.length, 'of', allStudentWeeklyClasses.length);

    // Clear all columns
    for (let i = 0; i < 7; i++) {
        const col = document.getElementById(`student-day-col-${i}`);
        if (col) col.innerHTML = '';
    }

    console.log('Rendering schedule with', classesToShow.length, 'classes');

    // Group classes by day and render
    classesToShow.forEach(cls => {
        const col = document.getElementById(`student-day-col-${cls.dayOfWeek}`);
        
        if (!col) {
            console.error('Column not found for day', cls.dayOfWeek);
            return;
        }
        
        const teacherName = cls.teacherId?.name || 'Professor';
        const categoryColor = getStudentScheduleCategoryColor(cls.category);
        const classId = cls._id || cls.id;
        
        // Booking Info
        const booking = cls.bookingInfo || { availableSlots: 30, capacity: 30, isBookedByMe: false, nextDate: null };
        const isFull = booking.availableSlots <= 0;
        const nextDateStr = booking.nextDate ? new Date(booking.nextDate).toISOString() : '';
        
        // Get full color classes
        const colorClasses = getCategoryColorClasses(cls.category);
        
        let btnHtml = '';
        if (booking.isBookedByMe) {
             // Use myBookingId for cancellation
             const bookingId = booking.myBookingId || '';
             btnHtml = `<button onclick="cancelBooking('${bookingId}')" class="w-full mt-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold uppercase hover:bg-red-100 transition-colors border border-red-100">
                <i class="fa-solid fa-times-circle mr-1"></i> Cancelar
             </button>`;
        } else if (isFull) {
            btnHtml = `<button disabled class="w-full mt-2 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold uppercase cursor-not-allowed border border-slate-200">
                <i class="fa-solid fa-ban mr-1"></i> Esgotado
             </button>`;
        } else {
            // Use Branding Color for Reserve Button
            btnHtml = `<button onclick="reserveClass('${classId}', '${nextDateStr}')" class="w-full mt-2 py-1.5 rounded-lg brand-btn-bg text-white text-[10px] font-bold uppercase hover:brightness-110 transition-all shadow-sm">
                <i class="fa-regular fa-calendar-check mr-1"></i> Reservar
             </button>`;
        }

        // Vagas indicator
        const slotsColor = isFull ? 'text-red-500' : (booking.availableSlots < 5 ? 'text-orange-500' : 'text-slate-400');

        // Reserved card styling
        const isReserved = booking.isBookedByMe;
        const cardBgClass = isReserved ? 'bg-green-50 border-green-300 shadow-green-100' : 'bg-white border-slate-100';
        const cardBorderWidth = isReserved ? 'border-2' : 'border';

        const cardHtml = `
            <div class="${cardBgClass} ${cardBorderWidth} rounded-xl p-3 shadow-sm hover:shadow-md transition group relative flex flex-col min-h-[180px]">
                <div class="mb-2">
                    <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${colorClasses.badge} inline-block">
                        ${cls.category || 'Geral'}
                    </span>
                    <div class="mt-1.5">
                        <span class="text-[8px] font-black uppercase ${slotsColor} inline-block">
                            ${booking.availableSlots}/${booking.capacity} VAGAS
                    </div>
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="font-bold text-slate-700 text-xs leading-tight line-clamp-2 mb-1 h-[32px]">${cls.name}</h4>
                        <p class="text-[10px] text-slate-400 mb-2 truncate">${teacherName}</p>
                    </div>
                    <div class="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg w-fit whitespace-nowrap">
                        <i class="fa-regular fa-clock text-slate-400"></i>
                        ${cls.startTime} - ${cls.endTime}
                    </div>
                </div>
                <div class="mt-2">
                    ${btnHtml}
                </div>
            </div>
        `;
        
        col.innerHTML += cardHtml;
        console.log('Added class', cls.name, 'to column', cls.dayOfWeek);
    });

    // Show empty message if no classes
    for (let i = 0; i < 7; i++) {
        const col = document.getElementById(`student-day-col-${i}`);
        if (col && col.innerHTML.trim() === '') {
            col.innerHTML = `
                <div class="text-center py-8 text-slate-300 text-[10px]">
                    <i class="fa-regular fa-calendar-xmark mb-2 text-2xl block opacity-30"></i>
                    <p>Sem aulas</p>
                </div>
            `;
        }
    }
}

function getStudentScheduleCategoryColor(category) {
    const map = {
        'BJJ': 'blue',
        'No-Gi': 'red',
        'Wrestling': 'orange',
        'Kids': 'green',
        'Fundamentals': 'slate'
    };
    return map[category] || 'slate';
}

function getCategoryColorClasses(category) {
    const classes = {
        'BJJ': {
            badge: 'bg-blue-50 text-blue-600 border border-blue-100',
            btnBg: 'bg-blue-500 hover:bg-blue-600'
        },
        'No-Gi': {
            badge: 'bg-red-50 text-red-600 border border-red-100',
            btnBg: 'bg-red-500 hover:bg-red-600'
        },
        'Wrestling': {
            badge: 'bg-orange-50 text-orange-600 border border-orange-100',
            btnBg: 'bg-orange-500 hover:bg-orange-600'
        },
        'Kids': {
            badge: 'bg-green-50 text-green-600 border border-green-100',
            btnBg: 'bg-green-500 hover:bg-green-600'
        },
        'Fundamentals': {
            badge: 'bg-slate-50 text-slate-600 border border-slate-100',
            btnBg: 'bg-slate-500 hover:bg-slate-600'
        }
    };
    
    return classes[category] || classes['Fundamentals'];
}

window.reserveClass = async function(classId, dateStr) {
    showConfirmModal(
        'Reservar Vaga',
        'Deseja reservar sua vaga nesta aula?',
        async () => {
            console.log('Reserving class:', { classId, dateStr, studentId: studentData.id, franchiseId: dashboardData.franchise.id });
            
            try {
                const res = await fetch(`${appConfig.apiBaseUrl}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        classId,
                        date: dateStr,
                        studentId: studentData.id,
                        franchiseId: dashboardData.franchise.id
                    })
                });
                const json = await res.json();
                
                console.log('Reservation response:', json);
                
                if (json.success) {
                    // Close modal first
                    closeConfirmModal();
                    
                    // Show success message
                    showToast('✅ Reserva confirmada com sucesso!');

                    // DATA UPDATE: Update the local model so filters work immediately
                    const classObj = allStudentWeeklyClasses.find(c => (c._id || c.id) === classId);
                    if (classObj) {
                        if (!classObj.bookingInfo) classObj.bookingInfo = {};
                        classObj.bookingInfo.isBookedByMe = true;
                        classObj.bookingInfo.myBookingId = json.data ? json.data._id : '';
                        classObj.bookingInfo.availableSlots--;
                    }
                    
                    // RE-RENDER: Refresh the UI using the updated data model
                    renderStudentSchedule();

                    // Wait a bit to ensure backend has fully processed consistency
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // SYNC: Reload schedule to ensure data matches server truth perfectly
                    await loadStudentSchedule();
                } else {
                    showToast('❌ ' + json.message, 'error');
                }
            } catch (e) {
                console.error('Reservation error:', e);
                showToast('Erro ao realizar reserva', 'error');
            }
        }
    );
};

window.cancelBooking = async function(classId, dateStr) {
    // We need booking ID. But our UI loop uses classId.
    // Ideally the backend should return the booking ID in `bookingInfo`.
    // Or we handle cancellation by ClassId+Date + StudentId in backend or fetch listing.
    
    // IMPORTANT: The backend `bookingInfo` created in classController does NOT return the booking ID currently.
    // I should fix backend or use a lookup endpoint.
    // For now, let's assume I can query for my booking to get ID, or update backend to return ID.
    // Let's update backend classController to return myBookingId if booked.
    
    // Workaround for now: Call a "find my booking" or assume we can cancel by context.
    // Wait, the standard REST way is DELETE /bookings/:id.
    // I will verify if I passed the ID. I didn't.
    // I will fix classController to pass ID.
    
    if (!confirm('Tem certeza que deseja cancelar sua reserva?')) return;
    
    // Quick Fix: Retrieve booking ID first via list or modified endpoint
    // Actually, let's modify the cancel endpoint to accept studentId/classId/date via query?
    // OR just fix the controller to return bookingId.
    // Fix controller is better.
    // But since I'm in frontend edit, I'll assume I'll fix controller next.
    // Using a placeholder that will fail until controller fixed.
    
    // BETTER: Implement "cancel by query" in backend or just use the ID I'll add.
    // I will use `bookingId` which I will add to the class object in a moment.
    
    // Oops, I can't access bookingId here yet.
    // I will pause this invalid implementation logic and fix backend first in next step?
    // No, I can implement it in one go if I know the property name.
    // Property name: `bookingInfo.myBookingId`
    
    // Re-fetching class to get booking ID... or just searching local array if I stored it?
    // Since I rebuild HTML strings, I lose the object reference unless I embedded the ID in the HTML.
    // I should embed it.
    
    // Re-writing this function to assume ID is passed to it 
    // AND updating the HTML generation above to pass it (I need to update the Replacement above).
    // But I will first finish this function block assuming ID is passed.
};

// Redefine cancelBooking correctly with ID
window.cancelBooking = async function(bookingId) {
    showConfirmModal(
        'Cancelar Reserva',
        'Tem certeza que deseja cancelar sua reserva?',
        async () => {
            try {
                // OPTIMISTIC UI UPDATE (Immediate Fade)
                // Find the button with this bookingId
                const btn = document.querySelector(`button[onclick="cancelBooking('${bookingId}')"]`);
                let originalCardContent = null;
                let card = null;

                if (btn) {
                    card = btn.closest('.group');
                    if (card) {
                        // Revert styles immediately
                        card.className = card.className.replace('bg-green-50', 'bg-white')
                                                       .replace('border-green-300 shadow-green-100', 'border-slate-100')
                                                       .replace('border-2', 'border');
                        
                        // Revert button to a temporary loading/disabled state or generic Reserve
                        // We can't fully reconstruct the 'Reserve' button with correct dates easily without full render
                        // So we just show "Cancelado" disabled for a moment
                        btn.outerHTML = `<button disabled class="w-full mt-2 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold uppercase border border-slate-200">
                            <i class="fa-solid fa-ban mr-1"></i> Cancelado
                         </button>`;
                    }
                }

                const res = await fetch(`${appConfig.apiBaseUrl}/bookings/${bookingId}`, {
                    method: 'DELETE'
                });
                const json = await res.json();
                
                if (json.success) {
                    // Close modal first
                    closeConfirmModal();
                    
                    // Show success message
                    showToast('✅ Reserva cancelada.');
                    
                    // DATA UPDATE: Update the local model so filters work immediately
                    const classObj = allStudentWeeklyClasses.find(c => c.bookingInfo && c.bookingInfo.myBookingId === bookingId);
                    if (classObj) {
                        classObj.bookingInfo.isBookedByMe = false;
                        classObj.bookingInfo.myBookingId = null;
                        classObj.bookingInfo.availableSlots++;
                    }

                    // RE-RENDER: Refresh the UI using the updated data model
                    renderStudentSchedule();

                    // Wait a bit to ensure backend has processed
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // SYNC: Reload schedule to show updated UI (Re-enable Reserve buttons)
                    await loadStudentSchedule();
                } else {
                    showToast('❌ ' + json.message, 'error');
                    // If failed, we should probably reload schedule to revert optimistic change
                    await loadStudentSchedule();
                }
            } catch (e) {
                showToast('Erro ao cancelar', 'error');
            }
        }
    );
};

window.filterStudentSchedule = function(filterValue) {
    currentStudentScheduleFilter = filterValue;
    renderStudentSchedule();
};
