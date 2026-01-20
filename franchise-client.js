// ========================================
// FRANCHISE CLIENT v105 - EMAIL FIELD FIX
// ========================================
console.log('%c🔧 FRANCHISE CLIENT v106 LOADED - TEACHER EMAIL DEBUG', 'background: #FF6B00; color: white; padding: 5px; font-weight: bold;');

// Configuration - FORCE RENDER URL FALLBACK for mobile cache issues
const RENDER_API_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';
var API_URL = window.API_URL;

// If window.API_URL is missing, use a sensible default based on current environment
if (!API_URL) {
    if (typeof appConfig !== 'undefined' && appConfig.apiBaseUrl) {
        API_URL = appConfig.apiBaseUrl;
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        API_URL = 'http://localhost:5000/api/v1';
    } else {
        API_URL = RENDER_API_URL;
    }
}
// Note: We removed the force-overwrite for 'localhost' to allow local development

let currentFranchiseId = null;
let currentFranchise = null;
var myStudents = [];
var myTeachers = [];
var myMetrics = [];
let currentSort = { key: 'name', direction: 'asc' };

// ===== UTILITY FUNCTIONS =====
// Format currency values with R$ prefix and 2 decimal places
function formatCurrency(value) {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ===== UI HELPER FUNCTIONS =====

/**
 * Shows a high-fidelity modal window
 * @param {string} title Modal title
 * @param {string} message Modal body text
 * @param {string} type 'info', 'success', 'error', 'confirm'
 */
window.showPortalModal = function (title, message, type = 'info') {
    const modal = document.getElementById('ui-modal');
    if (!modal) {
        console.warn('UI Modal container not found');
        return;
    }

    const content = document.getElementById('modal-content');
    const panel = document.getElementById('modal-panel');

    // Icon Configuration
    let iconHTML = '';
    let iconClass = 'w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm';

    if (type === 'success') {
        iconHTML = '<i class="fa-solid fa-circle-check"></i>';
        iconClass += ' bg-emerald-50 text-emerald-500';
    } else if (type === 'error') {
        iconHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        iconClass += ' bg-red-50 text-red-500';
    } else if (type === 'confirm' || type === 'warning') {
        iconHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        iconClass += ' bg-amber-50 text-amber-500';
    } else {
        iconHTML = '<i class="fa-solid fa-circle-info"></i>';
        iconClass += ' bg-blue-50 text-blue-500';
    }

    content.innerHTML = `
        <div class="text-center">
            <div class="${iconClass}">${iconHTML}</div>
            <h3 class="text-2xl font-black text-slate-900 mb-2 tracking-tight">${title}</h3>
            <p class="text-sm text-slate-500 leading-relaxed mb-8">${message}</p>
            <button onclick="closeModal()" 
                class="w-full py-4 orange-gradient text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg transition-transform active:scale-95">
                Entendido
            </button>
        </div>
    `;

    // Show with animation
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    setTimeout(() => {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    }, 10);
};

/**
 * Shows a confirmation dialog
 * @param {string} title Title
 * @param {string} message Message
 * @param {function} onConfirm Callback on YES
 */
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

window.closeModal = function () {
    const modal = document.getElementById('ui-modal');
    const panel = document.getElementById('modal-panel');
    if (!modal) return;

    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }, 300);
};

window.closeConfirmModal = function () {
    const modal = document.getElementById('ui-confirm-modal');
    const panel = document.getElementById('confirm-panel');
    const backdrop = document.getElementById('confirm-backdrop');

    if (!modal) return;

    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }, 300);
};

/**
 * Show a transient notification
 */
window.showToast = function (message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    if (!toast) return;

    toastMsg.innerText = message;

    // Change icon if error
    const iconContainer = toast.querySelector('div');
    if (type === 'error') {
        iconContainer.classList.remove('bg-orange-500');
        iconContainer.classList.add('bg-red-500');
        iconContainer.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    } else {
        iconContainer.classList.remove('bg-red-500');
        iconContainer.classList.add('bg-orange-500');
        iconContainer.innerHTML = '<i class="fa-solid fa-check"></i>';
    }

    toast.classList.remove('translate-x-32', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-32', 'opacity-0');
    }, 3000);
};

// Shared Style Config (Matches Matrix Portal)
const beltColors = {
    'Branca': { bg: '#F8FAFC', text: '#334155', border: '#CBD5E1' },
    'Cinza': { bg: '#6B7280', text: '#FFFFFF', border: '#6B7280' },
    'Amarela': { bg: '#FCD34D', text: '#713F12', border: '#FCD34D' },
    'Laranja': { bg: '#FF6B00', text: '#FFFFFF', border: '#FF6B00' },
    'Verde': { bg: '#22C55E', text: '#FFFFFF', border: '#22C55E' },
    'Azul': { bg: '#3B82F6', text: '#FFFFFF', border: '#3B82F6' },
    'Roxa': { bg: '#A855F7', text: '#FFFFFF', border: '#A855F7' },
    'Marrom': { bg: '#92400E', text: '#FFFFFF', border: '#92400E' },
    'Preta': { bg: '#09090b', text: '#FFFFFF', border: '#000000' },
    'Coral': { bg: 'repeating-linear-gradient(90deg, #F00 0, #F00 10px, #FFF 10px, #FFF 20px)', text: '#000000', border: '#DC2626' },
    'Vermelha': { bg: '#EE1111', text: '#FFFFFF', border: '#EE1111' }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we're on the login page (has login elements)
    const isLoginPage = document.getElementById('login-email') && document.getElementById('btn-login-action');

    if (isLoginPage) {
        // We're on the login page - load franchise options
        await loadLoginOptions();
    } else {
        // We're on the premium page - check auth and initialize
        if (!checkAuth()) {
            return; // Stop execution if not authenticated
        }
        // If authenticated, the page should already have the franchise ID from login
        // We need to load it and initialize the app
        const savedFranchiseId = localStorage.getItem('franqueado_franchise_id');
        if (savedFranchiseId) {
            await loadFranchiseAndInit(savedFranchiseId);
        }
    }
});

// ===== AUTHENTICATION =====
function checkAuth() {
    const isLoggedIn = localStorage.getItem('franqueado_logged_in');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        // Redirect to login page
        window.location.href = 'franqueado-login.html';
        return false;
    }
    return true;
}

async function loadLoginOptions() {
    const select = document.getElementById('login-email'); // We'll re-purpose this ID for the Franchise Select
    const btn = document.getElementById('btn-login-action');

    try {
        const res = await fetch(`${API_URL}/franchises`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        if (!res.ok) throw new Error('Falha ao conectar servidor');
        const data = await res.json();
        const franchises = data.data || [];

        select.innerHTML = `<option value="" selected>Selecione</option>` + franchises.map(f =>
            `<option value="${f._id}">${f.name} - ${f.city || 'Local'}</option>`
        ).join('');

        btn.disabled = false;
        btn.innerHTML = 'Aceder ao Painel';

        // Add change listener to select to apply branding immediately
        select.addEventListener('change', async () => {
            const selectedId = select.value;
            if (selectedId) {
                try {
                    const res = await fetch(`${API_URL}/franchises/${selectedId}`, {
                        headers: { 'Bypass-Tunnel-Reminder': 'true' }
                    });
                    const json = await res.json();
                    if (json.success) {
                        applyBranding(json.data);
                    }
                } catch (e) {
                    console.error("Error applying live branding:", e);
                }
            }
        });
    } catch (e) {
        console.error(e);
        const apiUrl = window.API_URL || 'undefined';
        select.innerHTML = `<option>Erro: ${e.message}</option>`;
        btn.innerHTML = `<div class="flex flex-col"><span class="text-xs">Falha na Conexão</span><span class="text-[9px] opacity-75">${apiUrl}</span></div>`;
        btn.className = 'w-full bg-red-100 text-red-600 font-bold py-3 rounded-xl leading-tight';
    }
}

// Load franchise data and initialize app (for returning users)
async function loadFranchiseAndInit(franchiseId) {
    try {
        const res = await fetch(`${API_URL}/franchises/${franchiseId}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success) {
            currentFranchise = json.data;
            currentFranchiseId = franchiseId;
            await initApp();

            // Show app content
            const appContent = document.getElementById('app-content');
            if (appContent) {
                appContent.classList.remove('hidden');
            }
        } else {
            throw new Error('Falha ao carregar franquia');
        }
    } catch (e) {
        console.error('Error loading franchise:', e);
        // If we can't load the franchise, clear the session and redirect to login
        localStorage.removeItem('franqueado_logged_in');
        localStorage.removeItem('franqueado_franchise_id');
        window.location.href = 'franqueado-login.html';
    }
}

// --- AUTH ---
window.handleLogin = async () => {
    const btn = document.getElementById('btn-login-action');
    const select = document.getElementById('login-email');
    const selectedId = select.value;

    if (!selectedId) return;

    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Acedendo...';
    btn.disabled = true;

    try {
        // Fetch specific franchise details
        const res = await fetch(`${API_URL}/franchises/${selectedId}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success) {
            currentFranchise = json.data;
            currentFranchiseId = selectedId;

            // Save franchise ID to localStorage for session persistence
            localStorage.setItem('franqueado_logged_in', 'true');
            localStorage.setItem('franqueado_franchise_id', selectedId);

            // Check if we're on a standalone login page or an SPA page
            const appContent = document.getElementById('app-content');
            const loginScreen = document.getElementById('login-screen');

            if (!appContent || !loginScreen) {
                // We're on the standalone login page - redirect to premium page
                showToast('Login realizado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = 'franqueado-premium.html';
                }, 1000);
            } else {
                // We're on an SPA page - do the transition
                await initApp();
                loginScreen.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => loginScreen.style.display = 'none', 500);
                appContent.classList.remove('hidden');
            }
        } else {
            throw new Error('Falha no login');
        }
    } catch (e) {
        btn.disabled = false;
        btn.innerHTML = 'Tentar Novamente';
        showToast('Erro ao acessar unidade. Verifique o servidor.', 'error');
    }
};

// Handle logout - Open custom modal
window.handleLogout = function () {
    openLogoutModal();
};

// Open logout confirmation modal
function openLogoutModal() {
    const modal = document.getElementById('logout-confirm-modal');
    const panel = document.getElementById('logout-panel');
    const backdrop = document.getElementById('logout-backdrop');

    if (!modal || !panel || !backdrop) return;

    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'block';

    // Trigger animations
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Attach confirm handler
    const confirmBtn = document.getElementById('btn-logout-confirm');
    if (confirmBtn) {
        confirmBtn.onclick = confirmLogout;
    }
}

// Close logout modal
window.closeLogoutModal = function () {
    const modal = document.getElementById('logout-confirm-modal');
    const panel = document.getElementById('logout-panel');
    const backdrop = document.getElementById('logout-backdrop');

    if (!modal || !panel || !backdrop) return;

    // Reverse animations
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');

    // Hide modal after animation
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }, 300);
};

// Confirm logout action
function confirmLogout() {
    // Close modal
    closeLogoutModal();

    // Clear login data
    localStorage.removeItem('franqueado_logged_in');
    localStorage.removeItem('franqueado_email');
    localStorage.removeItem('franqueado_franchise_id');

    // Show notification
    showToast('✅ Sessão encerrada com sucesso!', 'success');

    // Redirect to login after short delay
    setTimeout(() => {
        window.location.href = 'franqueado-login.html';
    }, 800);
}


// --- CORE LOGIC ---
async function initApp() {
    try {
        // Render Header Info
        if (currentFranchise) {
            document.getElementById('gym-name-header').innerText = currentFranchise.name;
            document.getElementById('gym-owner-header').innerText = currentFranchise.owner || 'Gerente da Unidade';

            // Apply White Label branding
            applyBranding(currentFranchise);
        }

        // Initialize widget system safely
        try {
            if (typeof initWidgetSystem === 'function') {
                initWidgetSystem('widget-container', 'franchisee');
            }
        } catch (e) {
            console.error("Failed to init widgets:", e);
        }

        // Fill Settings Form (will be populated by widget update)
        // Trigger widget update after a delay to ensure DOM is ready
        setTimeout(() => {
            if (typeof WIDGET_REGISTRY !== 'undefined') {
                const settingsWidget = WIDGET_REGISTRY['franchisee-settings'];
                if (settingsWidget && settingsWidget.update) {
                    settingsWidget.update();
                }
            }
        }, 500);

        // Load Students & Teachers for this franchise
        await loadStudents();
        await loadTeachers();
        await loadMetrics();

        // Initial Stats
        updateStats();
        // Note: AI Analysis is now triggered by the widget itself when rendered to avoid double-calling

    } catch (err) {
        console.error("Critical error in initApp:", err);
        showToast("Erro ao inicializar sistema: " + err.message, "error");
    } finally {
        // FORCE SHOW CONTENT TO AVOID DARK SCREEN
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.classList.remove('hidden');
            // Ensure no modals are blocking
            const modals = document.querySelectorAll('[id$="-modal"]');
            modals.forEach(m => {
                m.classList.add('hidden');
                m.style.display = 'none';
            });
            const backdrops = document.querySelectorAll('[id$="-backdrop"]');
            backdrops.forEach(b => {
                b.classList.add('hidden');
                b.style.display = 'none';
            });
        }
    }
}

async function loadStudents() {
    try {
        // Fetch all students and filter client-side for now (simplest integration)
        // ideally: GET /api/v1/students?franchiseId=...
        const res = await fetch(`${API_URL}/students`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success) {
            const allStudents = json.data || [];
            // Filter strictly by franchise ID (handle populated object or direct ID string)
            myStudents = allStudents.filter(s => {
                const sFid = (s.franchiseId && s.franchiseId._id) ? s.franchiseId._id : s.franchiseId;
                return String(sFid) === String(currentFranchiseId);
            });
            renderStudents();
            updateStats();
        }
    } catch (e) {
        console.error("Error loading students", e);
        showToast("Erro ao carregar lista de alunos", "error");
    }
}

async function loadTeachers() {
    try {
        const res = await fetch(`${API_URL}/teachers?franchiseId=${currentFranchiseId}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success) {
            myTeachers = json.data || [];
            if (typeof renderTeachers === 'function') {
                renderTeachers();
            }
            updateStats();
        }
    } catch (e) {
        console.error("Error loading teachers", e);
        showToast("Erro ao carregar lista de professores", "error");
    }
}

async function loadMetrics() {
    try {
        const res = await fetch(`${API_URL}/metrics/${currentFranchiseId}?months=12`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success) {
            myMetrics = json.data || [];
            // Trigger refresh of performance widget if registered
            if (typeof WIDGET_REGISTRY !== 'undefined') {
                const perfWidget = WIDGET_REGISTRY['franchisee-performance'];
                if (perfWidget && typeof perfWidget.update === 'function') perfWidget.update();

                // Trigger refresh of main metrics panel to update growth stats
                const metricsWidget = WIDGET_REGISTRY['franchisee-metrics'];
                if (metricsWidget && typeof metricsWidget.update === 'function') metricsWidget.update();
            }
        }
    } catch (e) {
        console.error("Error loading metrics", e);
        showToast("Erro ao carregar métricas", "error");
    }
}

function updateStats() {
    // Calculate real metrics
    const totalRev = myStudents.reduce((sum, s) => {
        // Handle varying data types (string/number/array) from legacy data
        let val = 0;
        if (Array.isArray(s.amount)) val = s.amount[s.amount.length - 1]; // Get latest payment
        else val = parseFloat(s.amount) || 0;
        return sum + val;
    }, 0);

    const ticket = myStudents.length ? totalRev / myStudents.length : 0;

    // Safety check for currentFranchise
    if (!currentFranchise) {
        console.warn('⚠️ updateStats: currentFranchise not loaded yet.');
        return;
    }

    // Assuming 5% royalty if not set
    const royaltyPercent = currentFranchise.royaltyPercent || 5;
    const royalties = totalRev * (royaltyPercent / 100);

    // Update DOM
    const animateValue = (id, val, prefix = '') => {
        // Use formatCurrency for monetary values
        const isCurrency = prefix === 'R$ ';
        const formattedValue = isCurrency ? formatCurrency(val) : `${prefix}${val.toLocaleString('pt-BR')}`;

        // Update old dashboard element (if exists)
        const oldEl = document.getElementById(id);
        if (oldEl) oldEl.innerText = formattedValue;

        // Update widget element (if exists)
        const widgetEl = document.getElementById(`widget-${id}`);
        if (widgetEl) widgetEl.innerText = formattedValue;
    };

    animateValue('stat-students', myStudents.length);
    animateValue('stat-teachers', myTeachers.length);
    animateValue('stat-revenue', totalRev, 'R$ ');
    animateValue('stat-ticket', ticket, 'R$ ');
    animateValue('stat-royalties', royalties, 'R$ ');

    // Update label (both old and widget versions)
    const oldLabel = document.getElementById('label-royalties');
    const widgetLabel = document.getElementById('widget-label-royalties');
    const labelText = `Repasse Matriz (${royaltyPercent}%)`;
    if (oldLabel) oldLabel.innerText = labelText;
    if (widgetLabel) widgetLabel.innerText = labelText;
}

const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

// Update Gym Settings
window.updateGymSettings = async function () {
    const nameField = document.getElementById('edit-gym-name');
    const ownerField = document.getElementById('edit-gym-owner');
    const phoneField = document.getElementById('edit-gym-phone');
    const addressField = document.getElementById('edit-gym-address');
    const royaltyField = document.getElementById('edit-gym-royalty');
    const expensesField = document.getElementById('edit-gym-expenses');
    const btn = document.getElementById('btn-update-settings');

    if (!nameField || !ownerField || !phoneField || !addressField || !royaltyField) {
        showToast('Erro ao acessar campos do formulário', 'error');
        return;
    }

    const branding = {
        brandName: document.getElementById('edit-branding-name')?.value.trim() || '',
        logoUrl: document.getElementById('edit-branding-logo')?.value.trim() || '',
        primaryColor: document.getElementById('edit-branding-primary-color')?.value || '#FF6B00',
        secondaryColor: document.getElementById('edit-branding-secondary-color')?.value || '#000000',
        faviconUrl: document.getElementById('edit-branding-favicon')?.value.trim() || '',
        loginBackground: document.getElementById('edit-branding-bg')?.value.trim() || '',
        supportEmail: document.getElementById('edit-branding-email')?.value.trim() || '',
        supportPhone: document.getElementById('edit-branding-phone')?.value.trim() || ''
    };

    const updatedData = {
        name: nameField.value.trim(),
        owner: ownerField.value.trim(),
        phone: phoneField.value.trim(),
        address: addressField.value.trim(),
        royaltyPercent: parseFloat(royaltyField.value) || 0,
        expenses: expensesField ? parseFloat(expensesField.value) || 0 : 0,
        branding: branding
    };

    // Validation
    if (!updatedData.name || !updatedData.owner || !updatedData.phone || !updatedData.address) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }

    // Loading state
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        const response = await fetch(`${API_URL}/franchises/${currentFranchiseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) throw new Error('Falha ao atualizar dados');

        const result = await response.json();

        // Update local franchise object
        currentFranchise = { ...currentFranchise, ...updatedData };

        // Update header
        document.getElementById('gym-owner-header').innerText = updatedData.owner;

        // Update widget to reflect changes
        const settingsWidget = WIDGET_REGISTRY['franchisee-settings'];
        if (settingsWidget && settingsWidget.update) {
            settingsWidget.update();
        }

        // Apply new branding immediately
        applyBranding(currentFranchise);

        showToast('✅ Dados atualizados com sucesso!', 'success');
    } catch (error) {
        console.error('Error updating gym settings:', error);
        showToast('❌ Erro ao atualizar dados. Tente novamente.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

// --- PAGINATION STATE ---
let currentStudentPage = 1;
const STUDENTS_PER_PAGE = 20;

// Reset page when filtering
window.resetStudentPage = () => {
    currentStudentPage = 1;
};

// --- RENDERERS ---
window.renderStudents = () => {
    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;

    const beltFilterEl = document.getElementById('filter-belt');
    const feeFilterEl = document.getElementById('filter-fee');
    const degreeFilterEl = document.getElementById('filter-degree');
    const searchEl = document.getElementById('filter-search');

    const beltFilter = beltFilterEl ? beltFilterEl.value : 'Todas';
    const feeFilter = feeFilterEl ? feeFilterEl.value : 'Todos';
    const degreeFilter = degreeFilterEl ? degreeFilterEl.value : '';
    const search = searchEl ? searchEl.value.toLowerCase() : '';

    let filtered = myStudents.filter(s => {
        const myBelt = s.belt || 'Branca';
        const matchBelt = beltFilter === 'Todas' || myBelt === beltFilter;
        const matchSearch = (s.name || '').toLowerCase().includes(search);

        // Fee/Payment logic (Updated to match Matrix)
        let matchFee = true;
        if (feeFilter !== 'Todos') {
            const status = s.paymentStatus === 'Paga' ? 'Paga' : 'Atrasada';
            matchFee = status === feeFilter;
        }

        // Degree filter logic
        let matchDegree = true;
        if (degreeFilter && degreeFilter !== '') {
            const studentDegree = s.degree || 'Nenhum';
            matchDegree = studentDegree === degreeFilter;
        }

        return matchBelt && matchSearch && matchFee && matchDegree;
    });

    // Sorting
    filtered.sort((a, b) => {
        let valA = a[currentSort.key] || '';
        let valB = b[currentSort.key] || '';
        if (currentSort.key === 'monthlyFee') {
            valA = Array.isArray(a.amount) ? a.amount[a.amount.length - 1] : (parseFloat(a.amount) || 0);
            valB = Array.isArray(b.amount) ? b.amount[b.amount.length - 1] : (parseFloat(b.amount) || 0);
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase(); valB = valB.toLowerCase();
        }
        return currentSort.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    // Pagination
    const totalPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE);
    if (currentStudentPage > totalPages && totalPages > 0) currentStudentPage = totalPages;
    if (currentStudentPage < 1) currentStudentPage = 1;

    const startIndex = (currentStudentPage - 1) * STUDENTS_PER_PAGE;
    const endIndex = startIndex + STUDENTS_PER_PAGE;
    const paginatedStudents = filtered.slice(startIndex, endIndex);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400 italic">Nenhum guerreiro encontrado com estes filtros.</td></tr>`;
        renderStudentsPagination(0, 0);
        return;
    }

    tbody.innerHTML = paginatedStudents.map(s => {
        const belt = s.belt || 'Branca';
        const style = beltColors[belt] || beltColors['Branca'];
        const amount = Array.isArray(s.amount) ? s.amount[s.amount.length - 1] : (parseFloat(s.amount) || 0);
        const degree = (s.degree && s.degree !== 'Nenhum') ? ` • ${s.degree}` : '';

        // Payment Status Logic
        const status = s.paymentStatus === 'Paga' ? 'Paga' : 'Atrasada';
        const statusColors = {
            'Paga': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Atrasada': 'bg-red-100 text-red-700 border-red-200'
        };
        const statusStyle = statusColors[status];

        return `
            <tr class="table-row border-b border-slate-50 transition-colors group hover:bg-slate-50/50">
                <td class="py-4 px-2">
                    <div class="flex flex-col items-start gap-1">
                        <span class="font-bold text-slate-800">${s.name}</span>
                        <span class="inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border whitespace-nowrap" 
                              style="background: ${style.bg}; color: ${style.text}; border-color: ${style.border}; ${style.extra || ''}">
                            ${belt}${degree}
                        </span>
                    </div>
                </td>
                <td class="py-4 px-2">
                    <div class="text-[11px] font-bold text-slate-700">${s.phone || 'Sem contato'}</div>
                    <div class="text-[10px] text-slate-400">
                        ${s.gender || '-'} • 
                        ${s.birthDate ? calculateAge(s.birthDate) + ' anos' : '-'}
                    </div>
                </td>
                <td class="py-4 px-2">
                    <div class="flex flex-col items-start gap-1">
                        <div class="font-bold text-slate-700 bg-slate-50 inline-block px-2 py-1 rounded-lg border border-slate-100 text-xs">
                            ${formatCurrency(amount)}
                        </div>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusStyle}">
                            ${status}
                        </span>
                    </div>
                </td>
                <td class="py-4 px-2 text-slate-500 max-w-[150px] truncate" title="${s.address || ''}">
                    ${s.address || '-'}
                </td>
                <td class="py-4 px-2 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="editStudent('${s._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm flex items-center justify-center"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="generateTrainingPlan('${s._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm flex items-center justify-center" title="Mentor IA: Plano de Treino"><i class="fa-solid fa-dumbbell"></i></button>
                        <button onclick="deleteStudent('${s._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm flex items-center justify-center"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Render pagination controls
    renderStudentsPagination(filtered.length, totalPages);
};

// Pagination controls renderer
window.renderStudentsPagination = (totalStudents, totalPages) => {
    const paginationContainer = document.getElementById('students-pagination');
    if (!paginationContainer) return;

    if (totalStudents === 0) {
        paginationContainer.innerHTML = '';
        return;
    }

    const startIndex = (currentStudentPage - 1) * STUDENTS_PER_PAGE + 1;
    const endIndex = Math.min(currentStudentPage * STUDENTS_PER_PAGE, totalStudents);

    let paginationHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
            <div class="text-xs text-slate-500">
                Mostrando <span class="font-bold text-slate-700">${startIndex}</span> a <span class="font-bold text-slate-700">${endIndex}</span> de <span class="font-bold text-slate-700">${totalStudents}</span> alunos
            </div>
            <div class="flex items-center gap-2">
    `;

    // Previous button
    paginationHTML += `
        <button onclick="changeStudentPage(${currentStudentPage - 1})" 
                ${currentStudentPage === 1 ? 'disabled' : ''}
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentStudentPage === 1 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500'}">
            <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentStudentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHTML += `
            <button onclick="changeStudentPage(1)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500 transition-all">1</button>
        `;
        if (startPage > 2) {
            paginationHTML += `<span class="text-slate-400 px-2">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changeStudentPage(${i})" 
                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${i === currentStudentPage ? 'orange-gradient text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500'}">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="text-slate-400 px-2">...</span>`;
        }
        paginationHTML += `
            <button onclick="changeStudentPage(${totalPages})" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500 transition-all">${totalPages}</button>
        `;
    }

    // Next button
    paginationHTML += `
        <button onclick="changeStudentPage(${currentStudentPage + 1})" 
                ${currentStudentPage === totalPages ? 'disabled' : ''}
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentStudentPage === totalPages ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500'}">
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;

    paginationHTML += `
            </div>
        </div>
    `;

    paginationContainer.innerHTML = paginationHTML;
};

// Change page function
window.changeStudentPage = (page) => {
    currentStudentPage = page;
    renderStudents();
};


window.renderTeachers = () => {
    const tbody = document.getElementById('teachers-table-body');
    if (!tbody) return;

    const beltFilterEl = document.getElementById('filter-teacher-belt');
    const searchEl = document.getElementById('filter-teacher-search');
    const degreeFilterEl = document.getElementById('filter-teacher-degree');

    const beltFilter = beltFilterEl ? beltFilterEl.value : 'Todas';
    const search = searchEl ? searchEl.value.toLowerCase() : '';
    const degreeFilter = degreeFilterEl ? degreeFilterEl.value : '';

    let filtered = myTeachers.filter(t => {
        const myBelt = t.belt || 'Preta';
        const matchBelt = beltFilter === 'Todas' || myBelt === beltFilter;
        const matchSearch = (t.name || '').toLowerCase().includes(search);
        const matchDegree = (!degreeFilter || degreeFilter === 'Todos os Graus') || t.degree === degreeFilter;
        return matchBelt && matchSearch && matchDegree;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-slate-400 italic">Nenhum professor encontrado com estes filtros.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(t => {
        const belt = t.belt || 'Preta';
        const style = beltColors[belt] || beltColors['Preta'];
        const degreeText = (t.degree && t.degree !== 'Nenhum') ? ` • ${t.degree}` : '';

        return `
            <tr class="table-row border-b border-slate-50 transition-colors group hover:bg-slate-50/50">
                <td class="py-4 px-2">
                    <div class="flex flex-col items-start gap-1">
                        <span class="font-bold text-slate-800">${(t.name || '').replace(/\s*\((Coral|Vermelha|Vermelho)\)/gi, '')}</span>
                        <span class="inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border whitespace-nowrap" 
                              style="background: ${style.bg}; color: ${style.text}; border-color: ${style.border}; ${style.extra || ''}">
                            ${belt}${degreeText}
                        </span>
                    </div>
                </td>
                <td class="py-4 px-2 text-slate-500 text-[11px]">
                    ${t.gender || '--'}
                </td>
                <td class="py-4 px-2 text-slate-500 text-[11px]">
                    ${t.phone || '--'}
                </td>
                <td class="py-4 px-2 text-slate-500 text-[11px] max-w-[150px] truncate" title="${t.address || ''}">
                    ${t.address || '--'}
                </td>
                <td class="py-4 px-2 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="openTeacherModal('${t._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm flex items-center justify-center"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteTeacher('${t._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm flex items-center justify-center"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

window.setSort = (key) => {
    if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.direction = 'asc';
    }
    renderStudents();
};

// --- CRUD ACTIONS (REAL API) ---

// 1. OPEN MODAL - FETCH FRESH DATA FROM API
window.openStudentModal = async (id = null) => {
    let student = null;

    // If editing existing student, fetch fresh data from API
    if (id) {
        try {
            const response = await fetch(`${API_URL}/students/${id}`);
            const data = await response.json();
            student = data.data || data;
            console.log('✅ Fetched fresh student data from API:', student);
        } catch (error) {
            console.error('❌ Error fetching student:', error);
            // Fallback to cached data
            student = myStudents.find(s => s._id === id);
        }
    }

    const modal = document.getElementById('modal-panel');
    const modalContent = document.getElementById('modal-content');

    // Default values
    let name = '', phone = '', email = '', amount = 150, belt = 'Branca', gender = 'Masculino', degree = 'Nenhum', birthDate = '';
    if (student) {
        name = student.name;
        phone = student.phone || '';
        email = student.email || '';
        gender = student.gender || 'Masculino';
        belt = student.belt || 'Branca';
        degree = student.degree || 'Nenhum';
        const rawAmount = Array.isArray(student.amount) ? student.amount[student.amount.length - 1] : student.amount;
        amount = (parseFloat(rawAmount) || 0).toFixed(2);
        birthDate = student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '';
    }

    // DEBUG: Log email value
    console.log('📧 Student Email Debug:', {
        studentId: student?._id,
        studentName: student?.name,
        emailValue: email,
        emailFromStudent: student?.email,
        studentHasEmail: !!student?.email,
        studentObject: student
    });

    console.log(`🔍 Email value that will be used in template: "${email}"`);

    // Prepare History HTML
    let historyHTML = '';
    if (student && student.graduationHistory && student.graduationHistory.length > 0) {
        historyHTML = `
            <div class="mt-6 border-t border-slate-100 pt-6">
                <h3 class="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left text-orange-500"></i> Histórico de Graduação
                </h3>
                <div class="overflow-x-auto bg-slate-50 rounded-xl border border-slate-100 p-1">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-white border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th class="px-3 py-2">Data</th>
                                <th class="px-3 py-2">Faixa</th>
                                <th class="px-3 py-2">Grau</th>
                                <th class="px-3 py-2">Mestre</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${student.graduationHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).map(h => `
                                <tr>
                                    <td class="px-3 py-2 text-slate-600 font-medium">${new Date(h.date).toLocaleDateString()}</td>
                                    <td class="px-3 py-2 font-bold text-slate-800">${h.belt}</td>
                                    <td class="px-3 py-2 text-slate-500">${h.degree}</td>
                                    <td class="px-3 py-2 text-slate-500 text-[10px]">${h.promotedBy?.name || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (student) {
        historyHTML = `
            <div class="mt-6 border-t border-slate-100 pt-6">
                <h3 class="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left text-orange-500"></i> Histórico de Graduação
                </h3>
                <p class="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center border border-slate-100">Nenhum registro de graduação encontrado.</p>
            </div>
        `;
    }

    // HTML for Form
    modalContent.innerHTML = `
        <div class="text-left">
            <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i class="fa-solid ${student ? 'fa-pen-to-square' : 'fa-user-plus'} text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-slate-800">${student ? 'Editar Guerreiro' : 'Matrícula de Aluno'}</h2>
                    <p class="text-xs text-slate-500">${student ? 'Atualize os dados do atleta' : currentFranchise?.name || 'Nova Matrícula'}</p>
                </div>
            </div>
            
            <input type="hidden" id="edit-id" value="${student ? student._id : ''}">

            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nome do Atleta *</label>
                        <input type="text" id="new-name" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${name}" placeholder="Ex: Carlos Silva">
                    </div>
                    
                     <div>
                         <label class="block text-xs font-bold text-slate-700 mb-1">Gênero</label>
                        <select id="new-gender" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white transition-all">
                            <option ${gender === 'Masculino' ? 'selected' : ''}>Masculino</option>
                            <option ${gender === 'Feminino' ? 'selected' : ''}>Feminino</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
                        <input type="date" id="new-birthDate" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${birthDate}">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                        <input type="text" id="new-phone" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${phone}" placeholder="(00) 00000-0000">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                        <input type="email" id="new-email" required class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${email || ''}" placeholder="exemplo@email.com">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Faixa</label>
                        <select id="new-belt" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white transition-all">
                            ${Object.keys(beltColors).map(b => `<option ${belt === b ? 'selected' : ''}>${b}</option>`).join('')}
                        </select>
                    </div>

                     <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Grau</label>
                        <select id="new-degree" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white transition-all">
                            <option value="Nenhum" ${degree === 'Nenhum' ? 'selected' : ''}>Nenhum</option>
                            <option value="1º Grau" ${degree === '1º Grau' ? 'selected' : ''}>1º Grau</option>
                            <option value="2º Grau" ${degree === '2º Grau' ? 'selected' : ''}>2º Grau</option>
                            <option value="3º Grau" ${degree === '3º Grau' ? 'selected' : ''}>3º Grau</option>
                            <option value="4º Grau" ${degree === '4º Grau' ? 'selected' : ''}>4º Grau</option>
                            <option value="5º Grau" ${degree === '5º Grau' ? 'selected' : ''}>5º Grau</option>
                            <option value="6º Grau" ${degree === '6º Grau' ? 'selected' : ''}>6º Grau</option>
                            <option value="7º Grau" ${degree === '7º Grau' ? 'selected' : ''}>7º Grau</option>
                            <option value="8º Grau" ${degree === '8º Grau' ? 'selected' : ''}>8º Grau</option>
                            <option value="9º Grau" ${degree === '9º Grau' ? 'selected' : ''}>9º Grau</option>
                            <option value="10º Grau" ${degree === '10º Grau' ? 'selected' : ''}>10º Grau</option>
                        </select>
                    </div>

                    <!-- FINANCIALS -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Valor Mensalidade (R$)</label>
                        <input type="number" id="new-fee" step="0.01" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${amount}">
                    </div>

                    <!-- NEW: DATE FIELD -->
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Data de Inscrição</label>
                        <input type="date" id="new-date" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" 
                            value="${student && student.registrationDate ? new Date(student.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Status de Pagamento</label>
                        <select id="new-payment-status" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white transition-all text-slate-600">
                            <option value="Paga" ${student?.paymentStatus === 'Paga' ? 'selected' : ''}>Em dia</option>
                            <option value="Atrasada" ${student?.paymentStatus === 'Atrasada' ? 'selected' : ''}>Atrasada</option>
                        </select>
                    </div>

                    <!-- ADDRESS -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Endereço Completo</label>
                        <input type="text" id="new-address" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${student?.address || ''}" placeholder="Rua, Número, Bairro, Cidade - UF">
                    </div>
                </div>
            </div>

            ${historyHTML}
            
            <div class="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                <button type="button" onclick="closeModal()" class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                    Cancelar
                </button>
                <button type="button" onclick="saveStudent()" class="flex-1 px-6 py-3 orange-gradient text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid ${student ? 'fa-floppy-disk' : 'fa-user-plus'}"></i> ${student ? 'Salvar' : 'Matricular'}
                </button>
            </div>
        </div>
    `;

    const modalContainer = document.getElementById('ui-modal');
    modalContainer.classList.remove('hidden');
    modalContainer.style.display = 'flex';
    setTimeout(() => {
        modal.classList.remove('scale-95', 'opacity-0');
        modal.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.editStudent = (id) => window.openStudentModal(id);

// 2. SAVE (CREATE / UPDATE)
window.saveStudent = async () => {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('new-name').value;
    const amount = parseFloat(document.getElementById('new-fee').value);

    if (!name) return showToast('Nome é obrigatório', 'error');

    const payload = {
        name,
        gender: document.getElementById('new-gender').value,
        birthDate: document.getElementById('new-birthDate').value,
        phone: document.getElementById('new-phone').value,
        email: document.getElementById('new-email').value,
        belt: document.getElementById('new-belt').value,
        degree: document.getElementById('new-degree').value,
        amount: amount, // Schema expects Number, not Array
        franchiseId: currentFranchiseId,
        paymentStatus: document.getElementById('new-payment-status').value,
        registrationDate: document.getElementById('new-date').value, // Capture Date
        address: document.getElementById('new-address').value
    };

    const btn = document.querySelector('#modal-content button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Salvando...';
    btn.disabled = true;

    try {
        let url = `${API_URL}/students`;
        let method = 'POST';

        if (id) {
            url += `/${id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (json.success) {
            showToast(id ? 'Dados atualizados com sucesso!' : 'Novo guerreiro matriculado!');
            closeModal();
            await loadStudents(); // Refresh list to sync with server
            updateStats();
        } else {
            throw new Error(json.error || 'Erro ao salvar');
        }

    } catch (e) {
        showToast('Erro ao salvar: ' + e.message, 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// --- TEACHER ACTIONS ---
window.openTeacherModal = async (id = null) => {
    let teacher = null;

    // If editing existing teacher, fetch fresh data from API
    if (id) {
        try {
            const response = await fetch(`${API_URL}/teachers/${id}`);
            const data = await response.json();

            // DEBUG: Log raw API response
            console.log('🔍 RAW API Response:', data);
            console.log('🔍 data.data exists?', !!data.data);
            console.log('🔍 data.email exists?', !!data.email);
            console.log('🔍 data.data?.email:', data.data?.email);
            console.log('🔍 data.email:', data.email);

            teacher = data.data || data;
            console.log('✅ Fetched fresh teacher data from API:', teacher);
            console.log('✅ Teacher has email?', !!teacher.email);
            console.log('✅ Teacher email value:', teacher.email);
        } catch (error) {
            console.error('❌ Error fetching teacher:', error);
            // Fallback to cached data
            teacher = myTeachers.find(t => t._id === id);
        }
    }

    const modal = document.getElementById('modal-panel');
    const modalContent = document.getElementById('modal-content');

    // Default values
    let name = '', belt = 'Preta', degree = 'Nenhum', birthDate = '', hireDate = new Date().toISOString().split('T')[0];
    let gender = 'Masculino', phone = '', email = '', address = '';
    if (teacher) {
        name = (teacher.name || '').replace(/\s*\((Coral|Vermelha|Vermelho)\)/gi, '');
        belt = teacher.belt || 'Preta';
        degree = teacher.degree || 'Nenhum';
        birthDate = teacher.birthDate ? new Date(teacher.birthDate).toISOString().split('T')[0] : '';
        hireDate = teacher.hireDate ? new Date(teacher.hireDate).toISOString().split('T')[0] : '';
        gender = teacher.gender || 'Masculino';
        phone = teacher.phone || '';
        email = teacher.email || '';
        address = teacher.address || '';
    }

    // DEBUG: Log email value
    console.log('📧 Teacher Email Debug:', {
        teacherId: teacher?._id,
        teacherName: teacher?.name,
        emailValue: email,
        emailFromTeacher: teacher?.email,
        teacherHasEmail: !!teacher?.email,
        teacherObject: teacher
    });

    console.log(`🔍 Teacher Email value that will be used in template: "${email}"`);

    modalContent.innerHTML = `
        <div class="text-left">
            <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i class="fa-solid fa-graduation-cap text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-slate-800">${teacher ? 'Editar Professor' : 'Novo Professor'}</h2>
                    <p class="text-xs text-slate-500">${teacher ? 'Atualize os dados do docente' : 'Cadastre um novo instrutor na unidade'}</p>
                </div>
            </div>
            
            <input type="hidden" id="teacher-edit-id" value="${teacher ? teacher._id : ''}">

            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-1">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                        <input type="text" id="teacher-name" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${name}" placeholder="Ex: Mestre Carlos">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Gênero</label>
                        <select id="teacher-gender" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white transition-all">
                            <option value="Masculino" ${gender === 'Masculino' ? 'selected' : ''}>Masculino</option>
                            <option value="Feminino" ${gender === 'Feminino' ? 'selected' : ''}>Feminino</option>
                            <option value="Outro" ${gender === 'Outro' ? 'selected' : ''}>Outro</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Faixa</label>
                        <select id="teacher-belt" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white transition-all">
                            <option value="Roxa" ${belt === 'Roxa' ? 'selected' : ''}>Roxa</option>
                            <option value="Marrom" ${belt === 'Marrom' ? 'selected' : ''}>Marrom</option>
                            <option value="Preta" ${belt === 'Preta' ? 'selected' : ''}>Preta</option>
                            <option value="Coral" ${belt === 'Coral' ? 'selected' : ''}>Coral</option>
                            <option value="Vermelha" ${belt === 'Vermelha' ? 'selected' : ''}>Vermelha</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Grau</label>
                        <select id="teacher-degree" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white transition-all">
                            <option value="Nenhum" ${degree === 'Nenhum' ? 'selected' : ''}>Nenhum</option>
                            <option value="1º Grau" ${degree === '1º Grau' ? 'selected' : ''}>1º Grau</option>
                            <option value="2º Grau" ${degree === '2º Grau' ? 'selected' : ''}>2º Grau</option>
                            <option value="3º Grau" ${degree === '3º Grau' ? 'selected' : ''}>3º Grau</option>
                            <option value="4º Grau" ${degree === '4º Grau' ? 'selected' : ''}>4º Grau</option>
                            <option value="5º Grau" ${degree === '5º Grau' ? 'selected' : ''}>5º Grau</option>
                            <option value="6º Grau" ${degree === '6º Grau' ? 'selected' : ''}>6º Grau</option>
                            <option value="7º Grau" ${degree === '7º Grau' ? 'selected' : ''}>7º Grau</option>
                            <option value="8º Grau" ${degree === '8º Grau' ? 'selected' : ''}>8º Grau</option>
                            <option value="9º Grau" ${degree === '9º Grau' ? 'selected' : ''}>9º Grau</option>
                            <option value="10º Grau" ${degree === '10º Grau' ? 'selected' : ''}>10º Grau</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
                        <input type="date" id="teacher-birthDate" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${birthDate}">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Data de Entrada</label>
                        <input type="date" id="teacher-hireDate" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${hireDate}">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                        <input type="tel" id="teacher-phone" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${phone}" placeholder="(00) 0 0000-0000">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                        <input type="email" id="teacher-email" required class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${email || ''}" placeholder="exemplo@email.com">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Endereço Completo</label>
                        <input type="text" id="teacher-address" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" value="${address}" placeholder="Rua, Número, Bairro, Cidade - UF">
                    </div>
                </div>
            </div>
            
            <div class="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                <button type="button" onclick="closeModal()" class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                    Cancelar
                </button>
                <button type="button" onclick="saveTeacher()" class="flex-1 px-6 py-3 orange-gradient text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-floppy-disk"></i> Salvar
                </button>
            </div>
        </div>
    `;

    const modalContainer = document.getElementById('ui-modal');
    modalContainer.classList.remove('hidden');
    modalContainer.style.display = 'flex';
    setTimeout(() => {
        modal.classList.remove('scale-95', 'opacity-0');
        modal.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.saveTeacher = async () => {
    const id = document.getElementById('teacher-edit-id').value;
    const name = document.getElementById('teacher-name').value;

    if (!name) return showToast('Nome é obrigatório', 'error');

    const payload = {
        name,
        belt: document.getElementById('teacher-belt').value,
        degree: document.getElementById('teacher-degree').value,
        birthDate: document.getElementById('teacher-birthDate').value,
        hireDate: document.getElementById('teacher-hireDate').value,
        gender: document.getElementById('teacher-gender').value,
        phone: document.getElementById('teacher-phone').value,
        email: document.getElementById('teacher-email').value,
        address: document.getElementById('teacher-address').value,
        franchiseId: currentFranchiseId
    };

    const btn = document.querySelector('#modal-content button:last-child');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Salvando...';
    btn.disabled = true;

    try {
        let url = `${API_URL}/teachers`;
        let method = 'POST';

        if (id) {
            url += `/${id}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (json.success) {
            showToast(id ? 'Professor atualizado!' : 'Novo professor cadastrado!');
            closeModal();
            await loadTeachers();
        } else {
            throw new Error(json.error || 'Erro ao salvar');
        }
    } catch (e) {
        showToast('Erro ao salvar: ' + e.message, 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.deleteTeacher = async (id) => {
    const confirmed = await window.confirmAction('Tem certeza que deseja remover este professor? Esta ação é irreversível.');
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_URL}/teachers/${id}`, { method: 'DELETE' });
        const json = await res.json();

        if (json.success) {
            showToast('Professor removido.');
            await loadTeachers();
        } else {
            throw new Error('Erro ao deletar');
        }
    } catch (e) {
        showToast('Erro ao remover professor', 'error');
    }
};

// 3. DELETE (Standardized)
window.deleteStudent = async (id) => {
    const confirmed = await window.confirmAction('Tem certeza que deseja remover este aluno? Esta ação é irreversível e o removerá das estatísticas.');
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
        const json = await res.json();

        if (json.success) {
            showToast('Aluno removido do sistema.');
            await loadStudents();
            updateStats();
        } else {
            throw new Error('Erro ao deletar');
        }
    } catch (e) {
        showToast('Erro ao remover aluno', 'error');
    }
};

// --- HELPER: CUSTOM CONFIRM MODAL ---
window.showConfirmModal = (title, msg, onConfirm) => {
    const modal = document.getElementById('ui-confirm-modal');
    const panel = document.getElementById('confirm-panel');
    const backdrop = document.getElementById('confirm-backdrop');

    // Set content
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerText = msg;

    // Set Action
    const btnYes = document.getElementById('btn-confirm-yes');
    // Remove old listeners to prevent stacking
    const newBtn = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtn, btnYes);

    newBtn.addEventListener('click', () => {
        // Show loading state on button
        const originalText = newBtn.innerHTML;
        newBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Processando...';
        newBtn.disabled = true;

        // Ejecuta la callback
        onConfirm().finally(() => {
            // Reset is handled by close or reload, but just in case
            newBtn.innerHTML = originalText;
            newBtn.disabled = false;
        });
    });

    // Show
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    // Small delay for transition
    setTimeout(() => {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
    }, 10);
};


// --- UTILS & AI ---
window.closeModal = () => {
    const modal = document.getElementById('modal-panel');
    const container = document.getElementById('ui-modal');
    if (!modal) {
        container.classList.add('hidden');
        container.style.display = 'none';
        return;
    }
    modal.classList.remove('scale-100', 'opacity-100');
    modal.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        container.classList.add('hidden');
        container.style.display = 'none';
    }, 300);
};

window.openModal = (html) => {
    const modal = document.getElementById('ui-modal');
    const panel = document.getElementById('modal-panel');
    document.getElementById('modal-content').innerHTML = html;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    setTimeout(() => {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.confirmAction = (message) => {
    return new Promise((resolve) => {
        const html = `
            <div class="text-center p-6">
                 <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                    <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
                </div>
                <h3 class="text-lg font-black text-slate-800 mb-2">Confirmação</h3>
                <p class="text-slate-500 mb-6 font-medium">${message}</p>
                <div class="flex gap-3 justify-center w-full">
                    <button id="btn-cancel-confirm" class="flex-1 px-5 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                        Cancelar
                    </button>
                    <button id="btn-confirm-action" class="flex-1 px-5 py-3 rounded-xl font-bold text-white orange-gradient hover:scale-[1.02] shadow-lg shadow-orange-200 transition-all">
                        Confirmar
                    </button>
                </div>
            </div>
        `;

        openModal(html);

        // Wait for modal to render
        setTimeout(() => {
            document.getElementById('btn-cancel-confirm').onclick = () => {
                closeModal();
                resolve(false);
            };

            document.getElementById('btn-confirm-action').onclick = () => {
                closeModal();
                resolve(true);
            };
        }, 50);
    });
};
window.showNotification = (msg, type = 'success') => window.showToast(msg, type);

window.showToast = (msg, type = 'success') => {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;

    // Reset classes
    const iconDiv = t.querySelector('div');
    iconDiv.className = 'w-6 h-6 rounded-full flex items-center justify-center text-white ' + (type === 'error' ? 'bg-red-500' : 'bg-orange-500');

    t.classList.remove('translate-x-32', 'opacity-0');
    setTimeout(() => t.classList.add('translate-x-32', 'opacity-0'), 3000);
};

// AI Analysis Logic (Client-side simulation based on REAL data)
// AI Analysis Logic (Advanced Rule-Based Engine)
// --- AI INTEGRATION (SECURE BACKEND PROXY) ---
async function callGemini(prompt, systemInstruction = null, retries = 3) {
    const delays = [1000, 2000, 4000]; 

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            console.log(`📡 Calling AI Service (Tentativa ${attempt + 1}/${retries}): ${API_URL}/ai/generate`);

            const requestBody = { prompt: prompt };
            if (systemInstruction) requestBody.systemInstruction = systemInstruction;

            const response = await fetch(`${API_URL}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(30000) 
            });

            if (!response.ok) {
                // Should we retry?
                if (response.status === 404) {
                    console.warn("⚠️ AI Service endpoint not found (404). Disabling AI.");
                    return null; 
                }
                if (response.status === 401 || response.status === 403) {
                    console.warn("⚠️ AI Service unauthorized. Check API key.");
                    return null;
                }

                const errorText = await response.text();
                let errorMessage = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorText;
                } catch (e) {}

                if ((errorMessage.includes('overloaded') || response.status === 503 || response.status === 429) && attempt < retries - 1) {
                    console.warn(`⚠️ Modelo sobrecarregado. Tentando novamente em ${delays[attempt]}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delays[attempt]));
                    continue; 
                }

                throw new Error(`Server returned ${response.status}: ${errorMessage}`);
            }

            const json = await response.json();

            if (!json.success || !json.data) {
                const errorMsg = json.error || 'Falha na comunicação com IA';
                if ((errorMsg.includes('overloaded') || errorMsg.includes('quota')) && attempt < retries - 1) {
                    console.warn(`⚠️ Erro de cota/sobrecarga. Tentando novamente em ${delays[attempt]}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delays[attempt]));
                    continue;
                }
                throw new Error(errorMsg);
            }

            let cleanedData = json.data;
            if (typeof cleanedData === 'string') {
                cleanedData = cleanedData
                    .replace(/```html\n?/gi, '')
                    .replace(/```json\n?/gi, '')
                    .replace(/```\n?/g, '')
                    .trim();
            }

            console.log(`✅ AI Service respondeu com sucesso na tentativa ${attempt + 1}`);
            return cleanedData;

        } catch (e) {
            if (attempt === retries - 1) {
                console.error(`❌ AI Service Error após ${retries} tentativas:`, e.message);
                return null;
            }
            console.warn(`⚠️ Erro na tentativa ${attempt + 1}: ${e.message}. Tentando novamente...`);
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        }
    }
}

// AI Analysis Logic (Powered by Google Gemini)
window.generateTrainingPlan = async (studentId) => {
    const student = myStudents.find(s => s._id === studentId);
    if (!student) return;

    // Use the existing modal structure for displaying the plan
    const modalContainer = document.getElementById('ui-modal');
    modalContainer.classList.remove('hidden');
    modalContainer.style.display = 'flex';
    const modal = document.getElementById('modal-panel');
    const modalContent = document.getElementById('modal-content');

    // Show loading state
    modal.classList.remove('scale-95', 'opacity-0');
    modal.classList.add('scale-100', 'opacity-100');

    modalContent.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <i class="fa-solid fa-dumbbell text-2xl text-blue-500"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">Mentor de Progressão IA</h3>
            <p class="text-slate-500">Criando plano personalizado para <span class="font-bold text-slate-700">${student.name}</span>...</p>
            <p class="text-xs text-slate-400 mt-2">Analisando histórico, faixa e tempo de treino.</p>
        </div>
    `;

    // Construct Prompt
    const prompt = `
        Atue como o Head Coach da Arena Jiu-Jitsu. Crie um Plano de Treino Técnico e Personalizado para o aluno abaixo.
        
        PERFIL DO ALUNO:
        - Nome: ${student.name}
        - Faixa: ${student.belt}
        - Grau: ${student.degree}
        - Tempo de Casa (Estimado): Baseado na faixa.
        
        OBJETIVO:
        Focar na retenção e evolução técnica para o próximo nível.
        
        INSTRUÇÕES DE SAÍDA:
        Gere uma resposta em HTML simples (use <h3> para títulos, <ul> para listas e <b> para ênfase).
        Estruture o plano em:
        1. Foco Técnico do Mês (1-2 principais posições/conceitos)
        2. Desafio de Sparring (Uma meta específica para os treinos de luta)
        3. Mindset (Uma frase ou conceito mental para trabalhar)
        
        Seja motivador, técnico mas acessível.
    `;

    const planHTML = await callGemini(prompt);

    if (planHTML) {
        modalContent.innerHTML = `
            <div class="text-left">
                <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <i class="fa-solid fa-dumbbell text-xl"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">Plano de Evolução Técnica</h2>
                        <p class="text-xs text-slate-500">Mentor IA • ${student.name} • ${student.belt}</p>
                    </div>
                </div>
                
                <div class="prose prose-sm max-w-none text-slate-600 space-y-4 ai-content bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    ${planHTML}
                </div>

                <div class="mt-6 flex justify-end">
                    <button onclick="closeModal()" class="px-6 py-2 orange-gradient text-white rounded-xl font-bold text-sm transition-all shadow-md hover:scale-105">
                        Entendido
                    </button>
                </div>
            </div>
        `;
    } else {
        modalContent.innerHTML = `
            <div class="text-center py-12">
                <p class="text-red-500 mb-4">Não foi possível conectar ao Mentor IA.</p>
                <button onclick="closeModal()" class="px-4 py-2 bg-slate-100 rounded-lg text-slate-600 font-bold text-xs">Fechar</button>
            </div>
        `;
    }
};

window.runAiAnalysis = async (manual = false) => {
    // Prevent concurrent runs
    if (window.isAiAnalysisRunning && !manual) {
        console.debug("⚠️ AI Analysis already running, skipping...");
        return;
    }
    window.isAiAnalysisRunning = true;

    try {
        const container = document.getElementById('ai-insight-content');
        if (!container) {
            console.warn('AI Container not found - skipping analysis');
            return;
        }

    // Loading State
    if (manual) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-12 text-slate-400 italic text-center">
                <i class="fa-solid fa-bolt animate-pulse mb-3 text-orange-500 text-2xl"></i>
                <span class="animate-pulse font-medium block">Consultando Gemini 2.0 Flash...</span>
                <span class="text-[10px] mt-2 block opacity-70">Enviando telemetria criptografada para análise neural.</span>
            </div>
        `;
    }

    // 1. Prepare Data Context for AI
    const count = myStudents.length;
    const revenue = myStudents.reduce((acc, s) => {
        const val = Array.isArray(s.amount) ? s.amount[s.amount.length - 1] : (parseFloat(s.amount) || 0);
        return acc + val;
    }, 0);
    const ticket = count ? revenue / count : 0;

    const beltsCount = {};
    myStudents.forEach(s => { beltsCount[s.belt] = (beltsCount[s.belt] || 0) + 1; });

    const overdue = myStudents.filter(s => s.paymentStatus === 'Atrasada').length;

    // 2. Build Prompt
    const prompt = `
        Atue como um Consultor Executivo Sênior de Franquias de Jiu-Jitsu (Arena Hub). Analise profundamente os dados desta unidade e gere insights estratégicos, detalhados e acionáveis.

        DADOS DA UNIDADE:
        - Alunos Ativos: ${count}
        - Faturamento Mensal: R$ ${revenue.toFixed(2)}
        - Ticket Médio: R$ ${ticket.toFixed(2)} (Ideal: R$ 200+)
        - Distribuição de Faixas: ${JSON.stringify(beltsCount)}
        - Inadimplência: ${overdue} alunos
        
        INSTRUÇÕES PARA SAÍDA:
        Gere uma análise rica em formatação HTML simples (use <b> para destaques, listas <ul><li> para pontos chave).
        Não seja vago. Dê sugestões numéricas e táticas.
        
        ⚠️ IMPORTANTE - FORMATAÇÃO JSON ESTRITA:
        1. A resposta deve ser EXCLUSIVAMENTE um objeto JSON válido (RFC 8259) e NADA MAIS
        2. NÃO use markdown code blocks (não escreva \`\`\`json ou \`\`\`)
        3. NÃO inclua texto introdutório ou conclusivo
        4. Comece imediatamente com { e termine com }
        5. Para quebras de linha nos textos, use SEMPRE \\n (barra invertida + n), NUNCA use quebras de linha literais
        6. Para aspas dentro dos textos, use \\" (barra invertida + aspas duplas)
        7. Evite usar caracteres de controle (tab, form feed, backspace) - use apenas espaços e \\n
        8. Certifique-se de que TODAS as strings estejam entre aspas duplas
        9. Não termine nenhuma linha com vírgula antes de fechar objetos/arrays

        SAÍDA ESPERADA (APENAS JSON VÁLIDO):
    {
        "cfo": "Texto da análise (FORMATO STRING SIMPLES, NUNCA OBJETO)",
        "coo": "Texto da análise (FORMATO STRING SIMPLES, NUNCA OBJETO)",
        "cmo": "Texto da análise (FORMATO STRING SIMPLES, NUNCA OBJETO)"
    }
    `;

    // 3. Call AI
    const resultText = await callGemini(prompt);

    let aiResponse = { cfo: "Análise indisponível no momento.", coo: "Análise indisponível no momento.", cmo: "Análise indisponível no momento." };

    if (resultText) {
        try {
            // 1. Extração robusta: localiza o primeiro { e o último }
            const startIdx = resultText.indexOf('{');
            const endIdx = resultText.lastIndexOf('}');

            if (startIdx !== -1 && endIdx !== -1) {
                let cleanJson = resultText.substring(startIdx, endIdx + 1);

                // 2. Múltiplas estratégias de sanitização para caracteres de controle
                try {
                    aiResponse = JSON.parse(cleanJson);
                } catch (firstError) {
                    console.warn("First parse attempt failed, trying sanitization...");

                    // Estratégia 2: Escapar caracteres problemáticos dentro de strings JSON
                    let sanitizedJson = cleanJson
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\t/g, '\\t')
                        .replace(/\f/g, '\\f')
                        .replace(/\b/g, '\\b');

                    try {
                        aiResponse = JSON.parse(sanitizedJson);
                    } catch (secondError) {
                        console.warn("Second parse attempt failed, trying aggressive cleanup...");
                        sanitizedJson = cleanJson.replace(/[\x00-\x1F\x7F]/g, " ");

                        try {
                            aiResponse = JSON.parse(sanitizedJson);
                        } catch (thirdError) {
                            console.warn("Third parse attempt failed, trying character-by-character sanitization...");
                            sanitizedJson = cleanJson.split('').map(char => {
                                const code = char.charCodeAt(0);
                                if (code >= 32 || code === 9 || code === 10 || code === 13) return char;
                                return ' ';
                            }).join('');
                            aiResponse = JSON.parse(sanitizedJson);
                        }
                    }
                }

                // --- NORMALIZAÇÃO EXAUSTIVA (Evita [object Object] e Garante Texto Limpo) ---
                ['cfo', 'coo', 'cmo'].forEach(key => {
                    let content = aiResponse[key];

                    if (content && typeof content === 'object') {
                        // Tenta campos comuns (incluindo variações com acento que a IA 2.0 costuma gerar)
                        content = content.text || content.analise || content.análise ||
                            content.analysis || content.insight || content.conteudo ||
                            content.conteúdo || content.content || JSON.stringify(content);
                    }

                    if (typeof content === 'string') {
                        // 1. Decodifica se houver stringificação dupla (comum quando a IA manda string dentro de JSON)
                        if (content.startsWith('"') && content.endsWith('"')) {
                            try { content = JSON.parse(content); } catch (e) { }
                        }

                        // 2. Converte quebras de linha literais (\\n ou \n) para tags <br>
                        aiResponse[key] = content
                            .replace(/\\n/g, '<br>')
                            .replace(/\n/g, '<br>')
                            .replace(/\r/g, '')
                            .trim();

                        // 3. Remove aspas extras remanescentes do início/fim se houver erro de parsing
                        if (aiResponse[key].startsWith('"')) aiResponse[key] = aiResponse[key].substring(1);
                        if (aiResponse[key].endsWith('"')) aiResponse[key] = aiResponse[key].substring(0, aiResponse[key].length - 1);
                    } else {
                        aiResponse[key] = content || "Informação não processada.";
                    }
                });
            } else {
                throw new Error("Formato JSON não identificado na resposta.");
            }
        } catch (e) {
            console.error("Failed to parse AI JSON after all attempts. Raw text:", resultText);
            console.error("Parse error:", e.message);
            aiResponse.cfo = "Erro na interpretação neural da resposta. Tente novamente.";
            aiResponse.coo = "Resposta recebida mas inválida.";
            aiResponse.cmo = "Detalhes: " + e.message;
        }
    }

    // 4. Render
    const html = `
        <div class="space-y-4 animate-in slide-in-from-bottom-2 duration-700">
            <div class="insight-section border-l-4 border-emerald-500 bg-emerald-50/50 p-3 rounded-r-xl shadow-sm">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-chart-line text-emerald-600"></i>
                    <strong class="text-emerald-800 text-[10px] uppercase tracking-wider">CFO (Finanças)</strong>
                </div>
                <p class="text-slate-600 text-[11px] leading-relaxed text-justify">${aiResponse.cfo}</p>
            </div>

            <div class="insight-section border-l-4 border-blue-500 bg-blue-50/50 p-3 rounded-r-xl shadow-sm">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-users-gear text-blue-600"></i>
                    <strong class="text-blue-800 text-[10px] uppercase tracking-wider">COO (Operações)</strong>
                </div>
                <p class="text-slate-600 text-[11px] leading-relaxed text-justify">${aiResponse.coo}</p>
            </div>

            <div class="insight-section border-l-4 border-purple-500 bg-purple-50/50 p-3 rounded-r-xl shadow-sm">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-bullhorn text-purple-600"></i>
                    <strong class="text-purple-800 text-[10px] uppercase tracking-wider">CMO (Marketing)</strong>
                </div>
                <p class="text-slate-600 text-[11px] leading-relaxed text-justify">${aiResponse.cmo}</p>
            </div>
            
            <div class="flex justify-between items-center text-[9px] text-slate-400 mt-4 border-t border-slate-100 pt-2 opacity-60">
                <span>Análise via Gemini 2.0 Flash</span>
                <span>${new Date().toLocaleTimeString()}</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
    } finally {
        window.isAiAnalysisRunning = false;
    }
};

// --- SENSEI CHAT (REAL GEMINI) ---
window.askSensei = async () => {
    const input = document.getElementById('chat-input');
    const msg = input.value;
    if (!msg) return;

    const chat = document.getElementById('chat-messages');
    chat.innerHTML += `< div class="bg-orange-500 text-white p-3 rounded-2xl ml-auto max-w-[85%] text-right mb-2 shadow-sm text-sm" > ${msg}</div > `;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    // Loading Bubble
    const loadId = 'loading-' + Date.now();
    chat.innerHTML += `
        < div id = "${loadId}" class="bg-white p-3 rounded-2xl border shadow-sm max-w-[85%] text-slate-500 mb-2 flex gap-2 items-center w-fit text-xs" >
            <i class="fa-solid fa-circle-notch animate-spin text-orange-500"></i>
            <span>Consultando Mestre...</span>
        </div >
        `;
    chat.scrollTop = chat.scrollHeight;

    // Context from app
    const context = `
    Contexto: Você é o 'Sensei Virtual' da Arena Hub. 
        Dados da academia do usuário:
        - Nome: ${currentFranchise ? currentFranchise.name : 'Unidade'}
    - Total Alunos: ${myStudents.length}
        Responda de forma curta, sábia(estilo mestre de artes marciais) e prática.
        Pergunta do franqueado: "${msg}"
        `;

    const reply = await callGemini(context);

    // Remove loading
    const loadEl = document.getElementById(loadId);
    if (loadEl) loadEl.remove();

    if (reply) {
        chat.innerHTML += `< div class= "bg-white p-3 rounded-2xl border shadow-sm max-w-[85%] text-slate-700 mb-2 text-sm leading-relaxed" > ${reply}</div > `;
    } else {
        chat.innerHTML += `< div class="bg-red-50 p-3 rounded-2xl border border-red-100 max-w-[85%] text-red-500 mb-2 text-sm" > O Mestre está meditando(Erro na API).</div > `;
    }
    chat.scrollTop = chat.scrollHeight;
};

window.listenToAudit = () => {
    const text = document.getElementById('ai-insight-content').innerText;
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    speechSynthesis.speak(u);
};

// --- WHITE LABEL / BRANDING ---
function applyBranding(unit) {
    if (!unit) return;
    const b = unit.branding || {};

    const primaryColor = b.primaryColor || '#FF6B00';
    const secondaryColor = b.secondaryColor || '#000000';
    const brandName = b.brandName || unit.name;

    // Set Global CSS Variable for Sensei & Systems
    document.documentElement.style.setProperty('--brand-primary', primaryColor);

    // 1. CSS Variables / Dynamic Styles
    const styleEl = document.getElementById('branding-styles');
    if (styleEl) {
        styleEl.innerHTML = `
            :root {
                --brand-primary: ${primaryColor};
                --brand-secondary: ${secondaryColor};
            }
            .orange-gradient {
                background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%) !important;
            }
            .text-brand-500 { color: ${primaryColor} !important; }
            .bg-brand-500 { background-color: ${primaryColor} !important; }
            .border-brand-500 { border-color: ${primaryColor} !important; }
            .hover\\:text-brand-500:hover { color: ${primaryColor} !important; }
            .hover\\:bg-brand-500:hover { background-color: ${primaryColor} !important; }
            .text-orange-500 { color: ${primaryColor} !important; }
            .text-orange-600 { color: ${primaryColor} !important; }
            .bg-orange-500 { background-color: ${primaryColor} !important; }
            .bg-orange-50 { background-color: ${primaryColor}10 !important; }
            .border-orange-500 { border-color: ${primaryColor} !important; }
            .border-orange-200 { border-color: ${primaryColor}50 !important; }
            .hover\\:border-orange-500:hover { border-color: ${primaryColor} !important; }
            .hover\\:border-orange-200:hover { border-color: ${primaryColor}50 !important; }
            .hover\\:bg-orange-50:hover { background-color: ${primaryColor}10 !important; }
            .hover\\:bg-orange-500:hover { background-color: ${primaryColor} !important; }
            .shadow-orange-200 { shadow-color: ${primaryColor}50 !important; }
            
            /* Sidebar & Menu Branding */
            .sidebar-item-active {
                background-color: ${primaryColor}15 !important;
                color: ${primaryColor} !important;
                border-left: 4px solid ${primaryColor} !important;
            }
            .sidebar-item-active i {
                color: ${primaryColor} !important;
            }
            .hover\\:text-orange-600:hover { color: ${primaryColor} !important; }
            
            /* Specific Widget Overrides */
            .btn-primary { background: ${primaryColor} !important; }
            .input-field:focus { border-color: ${primaryColor} !important; }
        `;
    }

    // 2. Logo, Brand Title & Login Support
    const portalLogoImg = document.getElementById('portal-logo-img');
    const portalBrandTitle = document.getElementById('portal-brand-title');
    const loginLogoImg = document.getElementById('login-logo-img');
    const loginLogoIcon = document.getElementById('login-logo-icon');
    const loginBtn = document.getElementById('btn-login-action');

    // Portal Logo
    if (b.logoUrl && portalLogoImg) {
        portalLogoImg.src = b.logoUrl;
        portalLogoImg.classList.remove('hidden');
    }

    // Login Logo
    if (b.logoUrl && loginLogoImg) {
        loginLogoImg.src = b.logoUrl;
        loginLogoImg.classList.remove('hidden');
        if (loginLogoIcon) loginLogoIcon.classList.add('hidden');
    } else if (loginLogoIcon) {
        loginLogoIcon.classList.remove('hidden');
        if (loginLogoImg) loginLogoImg.classList.add('hidden');
    }

    // Login Button Color
    if (loginBtn) {
        loginBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`;
    }

    if (portalBrandTitle) {
        // Try to break name in two colors if it has spaces
        const parts = brandName.split(' ');
        if (parts.length > 1) {
            portalBrandTitle.innerHTML = `<span class="text-brand-500">${parts.slice(0, -1).join(' ')}</span> <span class="text-black">${parts.slice(-1)}</span>`;
        } else {
            portalBrandTitle.innerHTML = `<span class="text-brand-500">${brandName}</span>`;
        }
    }

    // 3. Favicon & Document Title
    if (b.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = b.faviconUrl;
    }
    document.title = `${brandName} | Painel do Franqueado`;

    // 4. Login Background
    const loginScreen = document.getElementById('login-screen') || document.body;
    if (b.loginBackground) {
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
