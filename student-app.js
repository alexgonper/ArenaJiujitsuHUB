// ==========================================
// ARENA JIU-JITSU HUB - STUDENT APP v1.0
// Mobile-first client logic
// ==========================================

const STUDENT_API_URL = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:5000/api/v1';

// --- AUTH & INIT ---

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboard();
});

function checkAuth() {
    const token = localStorage.getItem('arena_student_token');
    if (!token) {
        window.location.href = 'student-login.html';
    }
}

// --- UI MODAL SYSTEM ---

function showPortalModal(title, message, iconType = 'info') {
    const modal = document.getElementById('portal-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const iconEl = document.getElementById('modal-icon');
    const footerEl = document.getElementById('modal-footer');

    // Reset Footer to default (Single "ENTENDIDO" button)
    footerEl.innerHTML = `
        <button onclick="closePortalModal()"
            class="w-full bg-[#0F172A] text-white font-bold py-5 rounded-[24px] hover:bg-[#1E293B] active:scale-[0.98] transition-all uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-slate-200">
            Entendido
        </button>
    `;

    // Configure Icon & Color (Matching high-fidelity reference)
    iconEl.className = 'w-24 h-24 mx-auto rounded-[32px] flex items-center justify-center text-3xl mb-6 transition-all duration-500';
    if (iconType === 'success') {
        iconEl.classList.add('bg-emerald-50', 'text-emerald-500');
        iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    } else if (iconType === 'error') {
        iconEl.classList.add('bg-[#FEF2F2]', 'text-[#EF4444]');
        iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else if (iconType === 'confirm') {
        iconEl.classList.add('bg-amber-50', 'text-amber-500');
        iconEl.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
    } else {
        iconEl.classList.add('bg-blue-50', 'text-blue-500');
        iconEl.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    }

    titleEl.textContent = title;
    msgEl.textContent = message;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function showPortalConfirm(title, message, onConfirm, iconType = 'confirm') {
    showPortalModal(title, message, iconType);
    const footerEl = document.getElementById('modal-footer');

    // Replace footer with two buttons - High Fidelity Style
    footerEl.innerHTML = `
        <div class="flex flex-col gap-3">
            <button id="modal-confirm-btn" 
                class="w-full bg-[#0F172A] text-white font-bold py-5 rounded-[24px] hover:bg-[#1E293B] active:scale-[0.98] transition-all uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-slate-200">
                Confirmar
            </button>
            <button onclick="closePortalModal()" 
                class="w-full py-4 bg-transparent text-slate-400 rounded-xl font-bold uppercase tracking-[0.1em] text-[10px] active:scale-[0.95] transition-all">
                Agora não
            </button>
        </div>
    `;

    document.getElementById('modal-confirm-btn').onclick = () => {
        closePortalModal();
        if (onConfirm) onConfirm();
    };
}

function closePortalModal() {
    const modal = document.getElementById('portal-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function logout() {
    showPortalConfirm(
        'Sair do App',
        'Tem certeza que deseja encerrar sua sessão? Você precisará fazer login novamente.',
        () => {
            localStorage.removeItem('arena_student_token');
            localStorage.removeItem('arena_student_data');
            window.location.href = 'student-login.html';
        }
    );
}

// --- CORE LOGIC ---

async function loadDashboard() {
    try {
        const studentData = JSON.parse(localStorage.getItem('arena_student_data') || '{}');
        if (!studentData.id) return;

        // Optimistic UI update from local storage first
        updateHeader(studentData);

        // Fetch fresh data
        const res = await fetch(`${STUDENT_API_URL}/students/dashboard/${studentData.id}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success) {
            const data = json.data;

            // Update Header
            updateHeader(data);

            // Update Stats
            animateValue('stat-attended', 0, data.stats.classesAttended, 1000);
            animateValue('stat-streak', 0, data.stats.streak || 0, 1000);

            // Update Progress
            const progressEl = document.getElementById('progress-bar');
            const percentEl = document.getElementById('progress-percent');
            if (progressEl) progressEl.style.setProperty('--progress', `${data.stats.progressPercent}%`);
            if (percentEl) percentEl.textContent = `${data.stats.progressPercent}%`;

            // Update Labels
            const labelEnd = document.getElementById('label-end');
            if (labelEnd) labelEnd.textContent = "Próximo Nível";

            // Render History
            renderHistory(data.history || []);
        }

    } catch (e) {
        console.error('Error loading dashboard:', e);
    }
}

function updateHeader(data) {
    if (!data.name) return;
    document.getElementById('header-name').textContent = data.name.split(' ')[0]; // First name
    document.getElementById('header-belt').textContent = `${data.belt} ${data.degree ? ' • ' + data.degree : ''}`;

    // Avatar
    const avatar = document.getElementById('header-avatar');
    if (data.photo) {
        avatar.innerHTML = `<img src="${data.photo}" class="w-full h-full object-cover">`;
    }
}

// --- TAB SYSTEM ---

function changePortalTab(tab) {
    // 1. Reset Visibility
    document.getElementById('tab-home').classList.add('hidden');
    document.getElementById('tab-schedule').classList.add('hidden');
    document.getElementById('tab-ranking').classList.add('hidden');
    const academyTab = document.getElementById('tab-academy');
    if (academyTab) academyTab.classList.add('hidden');

    // 2. Reset Nav Icons
    const navItems = ['home', 'schedule', 'ranking', 'academy'];
    navItems.forEach(item => {
        const btn = document.getElementById(`nav-${item}`);
        if (btn) {
            btn.classList.remove('text-orange-600');
            btn.classList.add('text-slate-300');
        }
    });

    // 3. Show Active Tab
    const activeTab = document.getElementById(`tab-${tab}`);
    if (activeTab) {
        activeTab.classList.remove('hidden');
        const activeNav = document.getElementById(`nav-${tab}`);
        if (activeNav) {
            activeNav.classList.remove('text-slate-300');
            activeNav.classList.add('text-orange-600');
        }
    } else {
        showPortalModal('Em Breve', `O módulo de ${tab.toUpperCase()} será liberado em breve!`, 'info');
        // Default back to home if tab doesn't exist
        document.getElementById('tab-home').classList.remove('hidden');
        document.getElementById('nav-home').classList.add('text-orange-600');
    }

    // 4. Specific Tab Actions
    if (tab === 'schedule') {
        loadSchedule();
    } else if (tab === 'ranking') {
        loadRanking();
    } else if (tab === 'academy') {
        loadAcademyInfo();
    }
}

async function loadAcademyInfo() {
    try {
        const studentData = JSON.parse(localStorage.getItem('arena_student_data') || '{}');
        if (!studentData.franchiseId) return;

        const res = await fetch(`${STUDENT_API_URL}/franchises/${studentData.franchiseId}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success) {
            const franchise = json.data;
            const branding = franchise.branding || {};

            // Update academy info
            document.getElementById('academy-name-detail').textContent = franchise.name;
            document.getElementById('academy-address').textContent = franchise.address || 'Endereço não cadastrado';
            document.getElementById('academy-phone').textContent = franchise.phone || 'Telefone não cadastrado';

            // Show/hide support section
            const supportSection = document.getElementById('support-section');
            const emailContainer = document.getElementById('support-email-container');
            const phoneContainer = document.getElementById('support-phone-container');

            let hasSupport = false;

            if (branding.supportEmail) {
                document.getElementById('support-email').textContent = branding.supportEmail;
                emailContainer.classList.remove('hidden');
                hasSupport = true;
            } else {
                emailContainer.classList.add('hidden');
            }

            if (branding.supportPhone) {
                document.getElementById('support-phone').textContent = branding.supportPhone;
                phoneContainer.classList.remove('hidden');
                hasSupport = true;
            } else {
                phoneContainer.classList.add('hidden');
            }

            if (hasSupport) {
                supportSection.classList.remove('hidden');
            } else {
                supportSection.classList.add('hidden');
            }
        }
    } catch (e) {
        console.error('Error loading academy info:', e);
    }
}

async function loadRanking(period = 'current_month') {
    try {
        const studentData = JSON.parse(localStorage.getItem('arena_student_data') || '{}');

        // Show loading state
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = `
            <div class="p-10 text-center text-slate-400">
                <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                <p class="text-xs font-bold uppercase tracking-widest">Carregando...</p>
            </div>
        `;

        // Load Leaderboard with period filter
        const resRanking = await fetch(`${STUDENT_API_URL}/students/ranking/${studentData.franchiseId}?period=${period}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const jsonRanking = await resRanking.json();
        if (jsonRanking.success) renderLeaderboard(jsonRanking.data);

        // Load Badges (only on first load)
        if (period === 'current_month') {
            const resBadges = await fetch(`${STUDENT_API_URL}/students/badges/${studentData.id}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const jsonBadges = await resBadges.json();
            if (jsonBadges.success) renderBadges(jsonBadges.data.badges);
        }

    } catch (e) {
        console.error('Ranking error:', e);
    }
}

function changeRankingPeriod(period) {
    loadRanking(period);
}

function renderLeaderboard(data) {
    const list = document.getElementById('leaderboard-list');
    if (!data || data.length === 0) {
        list.innerHTML = `<div class="p-10 text-center text-slate-400">Nenhum dado este mês</div>`;
        return;
    }

    // Belt styles for badges (matching student header format)
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
            <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
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

function renderBadges(badges) {
    const grid = document.getElementById('badges-grid');
    grid.innerHTML = badges.map(b => `
        <div class="bg-white p-5 rounded-3xl border ${b.unlocked ? 'border-orange-100 bg-gradient-to-br from-white to-orange-50/30' : 'border-slate-50 opacity-60'} flex flex-col items-center text-center gap-2 group transition-all">
            <div class="w-14 h-14 rounded-2xl ${b.unlocked ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-300'} flex items-center justify-center text-xl shadow-lg shadow-orange-100/20">
                <i class="fa-solid ${b.icon}"></i>
            </div>
            <div>
                <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-800">${b.name}</h4>
                <p class="text-[9px] font-medium text-slate-400 leading-tight mt-1">${b.desc}</p>
            </div>
            ${!b.unlocked ? `
                <div class="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div class="h-full bg-slate-300" style="width: ${b.progress}%"></div>
                </div>
                <span class="text-[8px] font-bold text-slate-300 uppercase">${b.progress}%</span>
            ` : `<span class="text-[8px] font-bold text-orange-500 uppercase">Conquistado!</span>`}
        </div>
    `).join('');
}

async function loadSchedule() {
    try {
        const studentData = JSON.parse(localStorage.getItem('arena_student_data') || '{}');
        const list = document.getElementById('schedule-list');
        const label = document.getElementById('current-date-label');

        // Date formatting
        const now = new Date();
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        label.textContent = now.toLocaleDateString('pt-BR', options);

        const res = await fetch(`${STUDENT_API_URL}/classes/franchise/${studentData.franchiseId}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success && json.data.length > 0) {
            renderSchedule(json.data);
        } else {
            list.innerHTML = `
                <div class="text-center py-20 text-slate-400">
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

    const categoryColors = {
        'BJJ': { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'fa-user-ninja' },
        'No-Gi': { bg: 'bg-slate-100', text: 'text-slate-800', icon: 'fa-shirt' },
        'Fundamentals': { bg: 'bg-green-50', text: 'text-green-600', icon: 'fa-graduation-cap' },
        'Kids': { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'fa-child' },
        'Wrestling': { bg: 'bg-red-50', text: 'text-red-600', icon: 'fa-hand-rock' }
    };

    list.innerHTML = classes.map(c => {
        const style = categoryColors[c.category] || categoryColors['BJJ'];
        return `
            <div class="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm group active:scale-[0.98] transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl ${style.bg} flex flex-col items-center justify-center ${style.text}">
                        <span class="text-xs font-black leading-none">${c.startTime}</span>
                        <i class="fa-solid ${style.icon} text-lg mt-1"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-800 text-sm">${c.name}</h4>
                        <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                            <i class="fa-solid fa-user-tie"></i>
                            <span>${c.teacherId?.name || 'Instrutor Arena'}</span>
                        </div>
                    </div>
                </div>
                <button onclick="performCheckIn('${c._id}')" class="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-wider group-hover:bg-orange-500 group-hover:text-white transition-all">
                    Presença
                </button>
            </div>
        `;
    }).join('');
}

// --- CHECK-IN LOGIC ---

async function performCheckIn(classId = null) {
    const btn = document.getElementById('btn-checkin');

    // UI Feedback
    const btnText = btn.querySelector('.text-lg');
    const originalText = btnText ? btnText.textContent : 'CHECK-IN';
    if (btnText) btnText.textContent = 'VALIDANDO...';
    btn.classList.add('animate-pulse', 'pointer-events-none');

    // 1. Get Location
    if (!navigator.geolocation) {
        showPortalModal('Ops!', 'Seu navegador não suporta geolocalização. Use o Chrome ou Safari.', 'error');
        resetCheckInBtn(btn, btnText, originalText);
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        try {
            const studentData = JSON.parse(localStorage.getItem('arena_student_data') || '{}');

            const res = await fetch(`${STUDENT_API_URL}/students/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    studentId: studentData.id,
                    location: { lat: latitude, lng: longitude },
                    classId: classId
                })
            });

            const json = await res.json();

            if (json.success) {
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                showPortalModal('Sucesso!', 'Presença confirmada! Bom treino no tatame. Oss!', 'success');
                loadDashboard();
            } else {
                showPortalModal('Check-in Negado', json.message, 'error');
            }
        } catch (e) {
            console.error(e);
            showPortalModal('Erro', 'Houve uma falha na conexão com o tatame.', 'error');
        } finally {
            resetCheckInBtn(btn, btnText, originalText);
        }
    }, (error) => {
        console.error('Geolocation error:', error);
        let msg = 'Erro ao obter localização.';
        if (error.code === 1) msg = 'Por favor, autorize o acesso à localização para bater o ponto.';
        showPortalModal('Atenção', msg, 'error');
        resetCheckInBtn(btn, btnText, originalText);
    }, {
        enableHighAccuracy: true,
        timeout: 10000
    });
}

function resetCheckInBtn(btn, btnText, originalText) {
    btn.classList.remove('animate-pulse', 'pointer-events-none');
    if (btnText) btnText.textContent = originalText;
}

// --- UTILS ---

function animateValue(id, start, end, duration) {
    if (start === end) return;
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const obj = document.getElementById(id);
    if (!obj) return;

    const timer = setInterval(function () {
        current += increment;
        obj.innerHTML = current;
        if (current == end) {
            clearInterval(timer);
        }
    }, stepTime);
}

function renderHistory(items) {
    const container = document.getElementById('history-list');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-300 border-2 border-dashed border-slate-100 rounded-[32px]">
                <p class="text-[10px] font-bold uppercase tracking-widest">Nenhum treino registrado</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => {
        const date = new Date(item.date);
        const dateLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

        return `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 text-lg">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-800 text-sm">${item.classId?.name || 'Check-in Avulso'}</h4>
                        <span class="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full capitalize">${dateLabel}</span>
                    </div>
                </div>
                <span class="text-xs font-black text-slate-900">+1</span>
            </div>
        `;
    }).join('');
}
