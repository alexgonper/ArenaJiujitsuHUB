// Arena Matrix - Frontend com Backend Integrado
// Versão com formulário funcional para adicionar unidades

// ===== CONFIGURATION - FORCE RENDER URL FALLBACK for mobile cache issues
const RENDER_API_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';
var API_BASE_URL = window.API_URL;

// If window.API_URL is missing, use a sensible default based on current environment
if (!API_BASE_URL) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        API_BASE_URL = 'http://localhost:5000/api/v1';
    } else {
        API_BASE_URL = RENDER_API_URL;
    }
}
// Note: We removed the force-overwrite for 'localhost' to allow local development


// ===== UTILITY FUNCTIONS =====
// Format currency values with R$ prefix and 2 decimal places
function formatCurrency(value) {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ===== AUTHENTICATION =====
// Check if user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('matriz_logged_in');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        // Redirect to login page
        window.location.href = 'matriz-login.html';
        return false;
    }
    return true;
}

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
    localStorage.removeItem('matriz_logged_in');
    localStorage.removeItem('matriz_email');

    // Show notification
    showNotification('✅ Sessão encerrada com sucesso!', 'success');

    // Redirect to login after short delay
    setTimeout(() => {
        window.location.href = 'matriz-login.html';
    }, 800);
}


// Check authentication on page load
if (!checkAuth()) {
    // Stop script execution if not authenticated
    throw new Error('Not authenticated');
}


// ===== GLOBAL STATE =====
var franchises = [];
var directives = [];
var students = [];
var teachers = [];
var metrics = []; // Ensure metrics global exists for widgets
var historicalMetrics = [];
var selectedFranchiseId = null;
var map = null;
var markers = [];
var mainChartObj = null;
var unitChartObj = null;
var currentSort = { key: 'name', direction: 'asc' };

// ===== API HELPER =====
async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== GEOCODING HELPER =====
async function geocodeAddress(address) {
    try {
        // Using Nominatim (OpenStreetMap) - Free geocoding API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'ArenaJiuJitsuHub/1.0'
                }
            }
        );

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }

        // Fallback to default coordinates if not found
        console.warn('Geocoding failed for:', address);
        return { lat: -25.4284, lng: -49.2733 }; // Curitiba default
    } catch (error) {
        console.error('Geocoding error:', error);
        return { lat: -25.4284, lng: -49.2733 }; // Curitiba default
    }
}

// ===== LOAD DATA FROM BACKEND =====
async function loadFranchisesFromBackend() {
    try {
        const response = await apiRequest('/franchises');
        franchises = response.data.map(f => ({
            ...f,
            id: f._id,
            lat: f.location?.coordinates[1],
            lng: f.location?.coordinates[0]
        }));
        console.log('✅ Loaded from backend:', franchises.length, 'franchises');
        return true;
    } catch (error) {
        console.error('❌ Failed to load from backend:', error);
        return false;
    }
}

async function loadDirectivesFromBackend() {
    try {
        const response = await apiRequest('/directives');
        directives = response.data;
        renderDirectives();
        return true;
    } catch (error) {
        console.error('Failed to load directives:', error);
        return false;
    }
}

// ===== UI FUNCTIONS =====
window.toggleMobileMenu = () => {
    const sidebar = document.getElementById('mobile-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.toggle('sidebar-open');
    backdrop.classList.toggle('hidden');
};

window.changeSection = (id) => {
    document.querySelectorAll('[id^="section-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById(`section-${id}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('sidebar-item-active');
        btn.classList.add('text-slate-500', 'hover:bg-slate-50');
    });

    const btn = document.getElementById(`btn-${id}`);
    if (btn) {
        btn.classList.add('sidebar-item-active');
        btn.classList.remove('text-slate-500', 'hover:bg-slate-50');
    }

    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('mobile-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar.classList.contains('sidebar-open')) {
            sidebar.classList.remove('sidebar-open');
            backdrop.classList.add('hidden');
        }
    }

    const titles = {
        'overview': 'Painel de Controle',
        'network': 'Rede de Academias',
        'communication': 'Matrix Hub',
        'unit-detail': 'Detalhes da Unidade'
    };

    const subtitles = {
        'overview': 'Visão Geral da Unidade',
        'network': 'Gestão Global de Unidades',
        'communication': 'Comunicação Oficial Matrix',
        'unit-detail': 'Gestão Específica de Unidade'
    };

    const titleEl = document.getElementById('page-title') || document.getElementById('section-title');
    if (titleEl) titleEl.textContent = titles[id] || 'Arena Jiu-Jitsu Hub';
    
    const subEl = document.getElementById('page-subtitle') || document.getElementById('section-subtitle');
    if (subEl && subtitles[id]) {
        subEl.textContent = subtitles[id];
    }
};

window.openModal = (html) => {
    document.getElementById('modal-content').innerHTML = html;
    const modal = document.getElementById('ui-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
};

window.closeModal = () => {
    const modal = document.getElementById('ui-modal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
};

// ===== CUSTOM CONFIRM MODAL (System Standard) =====
window.showConfirmModal = function(title, message, onConfirm) {
    const modal = document.getElementById('ui-confirm-modal');
    const backdrop = document.getElementById('confirm-backdrop');
    const panel = document.getElementById('confirm-panel');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-msg');
    
    // Safety check if elements exist
    if (!modal || !panel || !titleEl || !msgEl) {
        console.error('Confirm modal elements not found');
        if (confirm(message)) {
            if (onConfirm) onConfirm();
        }
        return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    
    // Setup confirm button
    const btnYes = document.getElementById('btn-confirm-yes');
    btnYes.onclick = function() {
        if (onConfirm) onConfirm();
        window.closeConfirmModal();
    };

    // Show modal
    modal.style.display = 'block';
    modal.classList.remove('hidden');
    
    // Animate in
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.closeConfirmModal = function() {
    const modal = document.getElementById('ui-confirm-modal');
    const backdrop = document.getElementById('confirm-backdrop');
    const panel = document.getElementById('confirm-panel');

    if (!modal || !panel || !backdrop) return;

    // Animate out
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }, 300);
};

window.confirmAction = (message) => {
    return new Promise((resolve) => {
        const html = `
            <div class="text-center p-4">
                <div class="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-amber-500 text-3xl transition-all duration-500">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-2xl font-black text-[#0F172A] mb-3 tracking-tight">Confirmação</h3>
                <p class="text-sm text-slate-400 mb-10 font-medium leading-relaxed px-4">${message}</p>
                <div class="flex flex-col gap-3 w-full">
                    <button id="btn-confirm-action" class="w-full bg-[#0F172A] text-white font-bold py-5 rounded-[24px] hover:bg-slate-800 active:scale-[0.98] transition-all uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-slate-200">
                        Confirmar
                    </button>
                    <button id="btn-cancel-confirm" class="w-full py-4 bg-transparent text-slate-400 rounded-xl font-bold uppercase tracking-[0.1em] text-[10px] active:scale-[0.95] transition-all">
                        Agora não
                    </button>
                </div>
            </div>
        `;

        openModal(html);

        document.getElementById('btn-cancel-confirm').onclick = () => {
            closeModal();
            resolve(false);
        };

        document.getElementById('btn-confirm-action').onclick = () => {
            closeModal();
            resolve(true);
        };
    });
};

window.toggleSensei = () => {
    document.getElementById('sensei-window').classList.toggle('hidden');
};

window.askSensei = () => {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const chat = document.getElementById('chat-messages');
    
    // User Message
    chat.innerHTML += `
        <div class="bg-orange-600 text-white p-3 rounded-2xl rounded-tr-sm ml-8 shadow-md">
            ${msg}
        </div>
    `;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    // Fake AI Response with "Thinking" state
    const thinkingId = 'thinking-' + Date.now();
    setTimeout(() => {
        chat.innerHTML += `
            <div id="${thinkingId}" class="bg-slate-200 text-slate-500 p-3 rounded-2xl rounded-tl-sm mr-8 shadow-sm flex items-center gap-2">
                <i class="fa-solid fa-circle-notch fa-spin text-xs"></i> Analisando dados da rede...
            </div>
        `;
        chat.scrollTop = chat.scrollHeight;

        // Actual Response after delay
        setTimeout(() => {
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();

            // Simple mocked logic based on keywords
            let response = "Interessante! Posso analisar isso com mais detalhes se você conectar minha API completa. Por enquanto, os dados mostram que a rede está crescendo!";
            
            const lowerMsg = msg.toLowerCase();
            if (lowerMsg.includes('aluno') || lowerMsg.includes('crescimento')) {
                const totalStudents = franchises.reduce((sum, f) => sum + (f.students || 0), 0);
                response = `Atualmente temos <strong>${totalStudents} alunos</strong> ativos em toda a rede. A unidade de Florianópolis teve o maior crescimento este mês (12%). Recomendamos replicar as campanhas de marketing deles.`;
            } else if (lowerMsg.includes('faturamento') || lowerMsg.includes('receita') || lowerMsg.includes('dinheiro')) {
                const totalRevenue = franchises.reduce((sum, f) => sum + (f.revenue || 0), 0);
                response = `O faturamento estimado da rede é de <strong>${formatCurrency(totalRevenue)}</strong>. A margem média de lucro das franquias está em 22%, o que é considerado saudável para o setor.`;
            } else if (lowerMsg.includes('inadimplência') || lowerMsg.includes('pagamento')) {
                response = `A taxa de inadimplência global está em <strong>4.2%</strong>, uma queda de 0.5% em relação ao mês anterior. O sistema de cobrança automática via WhatsApp tem sido efetivo.`;
            } else if (lowerMsg.includes('professor') || lowerMsg.includes('instrutor')) {
                 const totalTeachers = franchises.reduce((sum, f) => sum + (f.teachers || 0), 0);
                 response = `Contamos com <strong>${totalTeachers} professores</strong> registrados. 15% deles são faixas-preta. Há uma demanda por novos instrutores na região Sul.`;
            }

            chat.innerHTML += `
                <div class="bg-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-sm mr-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <i class="fa-solid fa-robot mr-1 text-orange-500"></i> ${response}
                </div>
            `;
            chat.scrollTop = chat.scrollHeight;
        }, 1500);
    }, 500);
};

// ===== NEW UNIT FORM =====
window.openUnitForm = () => {
    const formHtml = `
        <div class="text-left">
            <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i class="fa-solid fa-plus text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold">Adicionar Nova Unidade</h2>
                    <p class="text-xs text-slate-500">Preencha os dados da nova academia</p>
                </div>
            </div>
            
            <form id="franchise-form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nome da Academia *</label>
                        <input type="text" name="name" required 
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="Ex: Arena Florianópolis">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Proprietário *</label>
                        <input type="text" name="owner" required 
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="Ex: Prof. João Silva">
                    </div>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Endereço Completo *</label>
                    <input type="text" name="address" required 
                        class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                        placeholder="Ex: Rua das Flores, 123 - Centro, Cidade - UF">
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                        <input type="tel" name="phone" 
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="Ex: 48 99999-9999">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Email</label>
                        <input type="email" name="email" 
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="Ex: contato@arena.com">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Repasse / Royalties (%)</label>
                        <input type="number" name="royaltyPercent" min="0" max="100" step="0.1" value="10"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="Ex: 10">
                        <p class="text-[9px] text-slate-400 mt-1">Percentual do faturamento repassado à matriz.</p>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Despesas Mensais (R$)</label>
                        <input type="number" name="expenses" min="0" step="0.01" value="0"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="Ex: 5000.00">
                        <p class="text-[9px] text-slate-400 mt-1">Custo fixo/variável estimado da unidade.</p>
                    </div>
                </div>
                

                
                <div class="border-t border-slate-100 pt-4 mt-2">
                    <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-palette text-orange-500"></i> Identidade Visual (White Label)
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Nome da Marca</label>
                            <input type="text" name="branding_brandName" 
                                class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                placeholder="Ex: Arena Pro Florianópolis">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">URL do Logo</label>
                            <input type="url" name="branding_logoUrl" 
                                class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                placeholder="https://exemplo.com/logo.png">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Cor Primária</label>
                            <div class="flex gap-2">
                                <input type="color" name="branding_primaryColor" value="#FF6B00"
                                    class="h-9 w-12 border border-slate-200 rounded-lg cursor-pointer">
                                <input type="text" value="#FF6B00" oninput="this.previousElementSibling.value = this.value"
                                    class="flex-1 px-3 py-1 border border-slate-200 rounded-xl text-xs outline-none uppercase">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Cor Secundária</label>
                            <div class="flex gap-2">
                                <input type="color" name="branding_secondaryColor" value="#000000"
                                    class="h-9 w-12 border border-slate-200 rounded-lg cursor-pointer">
                                <input type="text" value="#000000" oninput="this.previousElementSibling.value = this.value"
                                    class="flex-1 px-3 py-1 border border-slate-200 rounded-xl text-xs outline-none uppercase">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">URL do Favicon</label>
                            <input type="url" name="branding_faviconUrl" 
                                class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                placeholder="https://exemplo.com/favicon.ico">
                        </div>
                    </div>
                </div>

                <div class="flex gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onclick="closeModal()" 
                        class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                        Cancelar
                    </button>
                    <button type="submit" 
                        class="flex-1 px-6 py-3 orange-gradient text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition">
                        <i class="fa-solid fa-plus mr-2"></i> Criar Academia
                    </button>
                </div>
            </form>
        </div>
    `;

    openModal(formHtml);

    // Handle form submission
    document.getElementById('franchise-form').addEventListener('submit', handleCreateFranchise);
};

async function handleCreateFranchise(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {};

    const branding = {};
    formData.forEach((value, key) => {
        if (value !== '') {
            if (key.startsWith('branding_')) {
                branding[key.replace('branding_', '')] = value;
            } else {
                data[key] = value;
                if (key === 'royaltyPercent' || key === 'expenses') {
                    data[key] = parseFloat(value);
                }
            }
        }
    });

    if (Object.keys(branding).length > 0) {
        data.branding = branding;
    }

    // Show loading
    const submitBtn = e.target.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Geocodificando...';
    submitBtn.disabled = true;

    try {
        // Geocode address automatically
        if (data.address) {
            const coords = await geocodeAddress(data.address);
            data.lat = coords.lat;
            data.lng = coords.lng;
        }

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Salvando...';

        const response = await apiRequest('/franchises', 'POST', data);

        // Add to local array
        const newFranchise = {
            ...response.data,
            id: response.data._id,
            lat: response.data.location?.coordinates[1] || data.lat,
            lng: response.data.location?.coordinates[0] || data.lng
        };
        franchises.push(newFranchise);

        // Update UI
        renderNetwork();
        updateStats();
        renderTopUnits();
        updateMapMarkers();

        // Close modal and show success
        closeModal();

        // Show success message
        showNotification('✅ Academia criada com sucesso!', 'success');

    } catch (error) {
        // Show error
        showNotification('❌ Erro ao criar academia: ' + error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ===== EDIT FRANCHISE =====
window.openEditForm = (id) => {
    const franchise = franchises.find(f => f.id === id);
    if (!franchise) return;

    const formHtml = `
        <div class="text-left">
            <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i class="fa-solid fa-pen-to-square text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold">Editar Academia</h2>
                    <p class="text-xs text-slate-500">Atualize os dados da academia</p>
                </div>
            </div>
            
            <form id="edit-franchise-form" class="space-y-4">
                <input type="hidden" name="id" value="${franchise.id}">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nome da Academia *</label>
                        <input type="text" name="name" required value="${franchise.name}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Proprietário *</label>
                        <input type="text" name="owner" required value="${franchise.owner}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                    </div>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Endereço Completo *</label>
                    <input type="text" name="address" required value="${franchise.address}"
                        class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                        <input type="tel" name="phone" value="${franchise.phone || ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Email</label>
                        <input type="email" name="email" value="${franchise.email || ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Repasse / Royalties (%)</label>
                        <input type="number" name="royaltyPercent" min="0" max="100" step="0.1" value="${franchise.royaltyPercent || 10}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Despesas Mensais (R$)</label>
                        <input type="number" name="expenses" min="0" step="0.01" value="${franchise.expenses || 0}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                    </div>
                </div>
                
                <div class="border-t border-slate-100 pt-4 mt-2">
                    <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-palette text-orange-500"></i> Identidade Visual (White Label)
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Nome da Marca</label>
                            <input type="text" name="branding_brandName" value="${franchise.branding?.brandName || ''}"
                                class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                placeholder="Ex: Arena Pro Florianópolis">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">URL do Logo</label>
                            <input type="url" name="branding_logoUrl" value="${franchise.branding?.logoUrl || ''}"
                                class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                placeholder="https://exemplo.com/logo.png">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Cor Primária</label>
                            <div class="flex gap-2">
                                <input type="color" name="branding_primaryColor" value="${franchise.branding?.primaryColor || '#FF6B00'}"
                                    class="h-9 w-12 border border-slate-200 rounded-lg cursor-pointer">
                                <input type="text" value="${franchise.branding?.primaryColor || '#FF6B00'}" oninput="this.previousElementSibling.value = this.value"
                                    class="flex-1 px-3 py-1 border border-slate-200 rounded-xl text-xs outline-none uppercase">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Cor Secundária</label>
                            <div class="flex gap-2">
                                <input type="color" name="branding_secondaryColor" value="${franchise.branding?.secondaryColor || '#000000'}"
                                    class="h-9 w-12 border border-slate-200 rounded-lg cursor-pointer">
                                <input type="text" value="${franchise.branding?.secondaryColor || '#000000'}" oninput="this.previousElementSibling.value = this.value"
                                    class="flex-1 px-3 py-1 border border-slate-200 rounded-xl text-xs outline-none uppercase">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">URL do Favicon</label>
                            <input type="url" name="branding_faviconUrl" value="${franchise.branding?.faviconUrl || ''}"
                                class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                placeholder="https://exemplo.com/favicon.ico">
                        </div>
                    </div>
                </div>

                <div class="flex gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onclick="closeModal()" 
                        class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                        Cancelar
                    </button>
                    <button type="submit" 
                        class="flex-1 px-6 py-3 orange-gradient text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition">
                        <i class="fa-solid fa-save mr-2"></i> Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    `;

    openModal(formHtml);

    // Handle form submission
    document.getElementById('edit-franchise-form').addEventListener('submit', handleUpdateFranchise);
};

async function handleUpdateFranchise(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const id = formData.get('id');
    const data = {};

    const branding = {};
    formData.forEach((value, key) => {
        if (key !== 'id' && value !== '') {
            if (key.startsWith('branding_')) {
                branding[key.replace('branding_', '')] = value;
            } else {
                data[key] = value;
                if (key === 'royaltyPercent' || key === 'expenses') {
                    data[key] = parseFloat(value);
                }
            }
        }
    });

    if (Object.keys(branding).length > 0) {
        data.branding = branding;
    }

    // Show loading
    const submitBtn = e.target.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Geocodificando...';
    submitBtn.disabled = true;

    try {
        // Geocode if address was changed
        const oldFranchise = franchises.find(f => f.id === id);
        if (data.address && data.address !== oldFranchise?.address) {
            const coords = await geocodeAddress(data.address);
            data.lat = coords.lat;
            data.lng = coords.lng;
        }

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Salvando...';

        const response = await apiRequest(`/franchises/${id}`, 'PUT', data);

        // Update local array
        const index = franchises.findIndex(f => f.id === id);
        if (index !== -1) {
            franchises[index] = {
                ...franchises[index], // Keep existing fields
                ...response.data,     // Overwrite with backend response
                ...data,              // Ensure form data persists locally immediately (esp. royalties)
                id: response.data._id || franchises[index].id,
                lat: response.data.location?.coordinates[1] || data.lat || franchises[index].lat,
                lng: response.data.location?.coordinates[0] || data.lng || franchises[index].lng
            };

            // Explicitly ensure type correctness for local state
            if (data.royaltyPercent) {
                franchises[index].royaltyPercent = parseFloat(data.royaltyPercent);
            }
        }

        // Update UI
        renderNetwork();
        updateStats();
        renderTopUnits();
        updateMapMarkers();

        // Close modal
        closeModal();

        // Show success
        showNotification('✅ Academia atualizada com sucesso!', 'success');

    } catch (error) {
        showNotification('❌ Erro ao atualizar: ' + error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ===== SAVE UNIT SETTINGS FROM WIDGET (MATRIX) =====
window.saveUnitSettingsMatrix = async () => {
    if (!selectedFranchiseId) return;

    const name = document.getElementById('unit-edit-name')?.value;
    const owner = document.getElementById('unit-edit-owner')?.value;
    const phone = document.getElementById('unit-edit-phone')?.value;
    const address = document.getElementById('unit-edit-address')?.value;
    const royaltyPercent = parseFloat(document.getElementById('unit-edit-royalty')?.value || 0);
    const expenses = parseFloat(document.getElementById('unit-edit-expenses')?.value || 0);

    // Collect Branding fields
    const branding = {
        brandName: document.getElementById('unit-edit-branding-name')?.value,
        logoUrl: document.getElementById('unit-edit-branding-logo')?.value,
        faviconUrl: document.getElementById('unit-edit-branding-favicon')?.value,
        primaryColor: document.getElementById('unit-edit-branding-primary-color')?.value,
        secondaryColor: document.getElementById('unit-edit-branding-secondary-color')?.value,
        loginBgUrl: document.getElementById('unit-edit-branding-bg')?.value,
        supportEmail: document.getElementById('unit-edit-branding-email')?.value,
        supportPhone: document.getElementById('unit-edit-branding-phone')?.value
    };

    const btn = document.getElementById('btn-save-unit-settings');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Salvando...';
    btn.disabled = true;

    try {
        const data = { name, owner, phone, address, royaltyPercent, expenses, branding };

        // Geocode if address was changed
        const currentFranchise = franchises.find(f => f.id === selectedFranchiseId || f._id === selectedFranchiseId);
        if (address && address !== currentFranchise?.address) {
            const coords = await geocodeAddress(address);
            data.lat = coords.lat;
            data.lng = coords.lng;
        }

        const response = await apiRequest(`/franchises/${selectedFranchiseId}`, 'PUT', data);

        // Update local array
        const index = franchises.findIndex(f => f.id === selectedFranchiseId || f._id === selectedFranchiseId);
        if (index !== -1) {
            franchises[index] = {
                ...franchises[index],
                ...response.data,
                ...data,
                id: response.data._id || franchises[index].id,
                lat: response.data.location?.coordinates[1] || data.lat || franchises[index].lat,
                lng: response.data.location?.coordinates[0] || data.lng || franchises[index].lng
            };
        }

        // Update UI
        updateStats();
        // Refresh detail title if needed
        const detailTitle = document.getElementById('detail-title');
        if (detailTitle) detailTitle.textContent = name;

        showNotification('✅ Configurações da unidade salvas!', 'success');
    } catch (error) {
        console.error('Error saving unit settings:', error);
        showNotification('❌ Erro ao salvar: ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};

// ===== DELETE FRANCHISE =====
window.deleteFranchise = async (id) => {
    const franchise = franchises.find(f => f.id === id);
    if (!franchise) return;

    // Confirmation dialog
    if (!await confirmAction(`Tem certeza que deseja excluir "${franchise.name}"? Esta ação não pode ser desfeita.`)) return;

    try {
        await apiRequest(`/franchises/${id}`, 'DELETE');

        // Remove from local array
        franchises = franchises.filter(f => f.id !== id);

        // Update UI
        renderNetwork();
        updateStats();
        renderTopUnits();
        updateMapMarkers();

        // Show success
        showNotification('✅ Academia removida com sucesso!', 'success');

    } catch (error) {
        showNotification('❌ Erro ao excluir: ' + error.message, 'error');
    }
};

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-[9999] px-6 py-4 rounded-xl shadow-2xl text-white font-bold text-sm animate-in slide-in-from-top duration-300 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== STATS AND DASHBOARD =====
function refreshFranchiseStats() {
    if (!franchises || !students) return;

    franchises.forEach(f => {
        // Recalculate students count
        const unitStudents = students.filter(s => {
            const sFid = (s.franchiseId && s.franchiseId._id) ? s.franchiseId._id : s.franchiseId;
            return String(sFid) === String(f.id || f._id);
        });
        f.students = unitStudents.length;

        // Recalculate revenue
        f.revenue = unitStudents.reduce((sum, s) => {
            let val = 0;
            if (Array.isArray(s.amount)) val = s.amount[s.amount.length - 1];
            else val = parseFloat(s.amount) || 0;
            return sum + val;
        }, 0);

        // Recalculate teachers
        if (teachers) {
            const unitTeachers = teachers.filter(t => {
                const tFid = (t.franchiseId && t.franchiseId._id) ? t.franchiseId._id : t.franchiseId;
                return String(tFid) === String(f.id || f._id);
            });
            f.teachers = unitTeachers.length;
        }
    });
}


function updateStats() {
    refreshFranchiseStats(); // 🔄 Recalculate everything from source of truth

    const totalStudents = franchises.reduce((sum, f) => sum + (f.students || 0), 0);
    const totalRevenue = franchises.reduce((sum, f) => sum + (f.revenue || 0), 0);
    const totalUnits = franchises.length;
    const intlUnits = franchises.filter(f =>
        !f.address.toLowerCase().includes('- sc') &&
        !f.address.toLowerCase().includes('- pr')
    ).length;

    // Calculate total royalties
    const totalRoyalties = franchises.reduce((sum, f) => {
        const rev = f.revenue || 0;
        const pct = f.royaltyPercent || 5;
        return sum + (rev * (pct / 100));
    }, 0);

    // Update old dashboard elements (legacy/static)
    const oldStudents = document.getElementById('stat-total-students');
    const oldRevenue = document.getElementById('stat-total-revenue');
    const oldUnits = document.getElementById('stat-unit-count');
    const oldIntl = document.getElementById('intl-count-badge');

    if (oldStudents) oldStudents.textContent = totalStudents.toLocaleString();
    if (oldRevenue) oldRevenue.textContent = formatCurrency(totalRevenue);
    if (oldUnits) oldUnits.textContent = totalUnits;
    if (oldIntl) oldIntl.textContent = `${intlUnits}`;

    // Force update ALL registered widgets to reflect the new state
    if (typeof window.forceUpdateAllWidgets === 'function') {
        window.forceUpdateAllWidgets();
    }
}

function renderTopUnits() {
    const listElement = document.getElementById('top-units-list');
    if (!listElement) return; // Element doesn't exist (replaced by widget system)

    const sorted = [...franchises].sort((a, b) => (b.students || 0) - (a.students || 0)).slice(0, 5);
    const html = sorted.map((f, i) => `
        <div class="flex items-center gap-4 text-[10px]">
            <div class="w-6 h-6 rounded-full bg-slate-50 border flex items-center justify-center font-black text-slate-600">${i + 1}</div>
            <p class="flex-1 font-bold text-slate-800">${f.name}</p>
            <p class="font-black text-orange-600">${f.students}</p>
        </div>
    `).join('');

    listElement.innerHTML = html;
}

// ===== CHARTS =====
function initMainChart(type = 'financial') {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    if (mainChartObj) {
        mainChartObj.destroy();
    }

    const data = type === 'financial'
        ? [25000, 28000, 26000, 31000, 33000, 36500]
        : [250, 280, 260, 310, 330, 365];

    mainChartObj = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                data: data,
                borderColor: '#FF6B00',
                backgroundColor: 'rgba(255, 107, 0, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#FF6B00',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#FF6B00',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    display: false,
                    beginAtZero: true
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });

    document.querySelectorAll('[id^="btn-chart-"]').forEach(btn => {
        btn.classList.remove('bg-white', 'shadow', 'text-orange-600');
        btn.classList.add('text-slate-500');
    });
    const activeBtn = document.getElementById(`btn-chart-${type}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-white', 'shadow', 'text-orange-600');
        activeBtn.classList.remove('text-slate-500');
    }
}

window.toggleMainChart = (type) => {
    initMainChart(type);
};

function initUnitChart(franchise) {
    const ctx = document.getElementById('unitDetailChart');
    if (!ctx) return;

    if (unitChartObj) {
        unitChartObj.destroy();
    }

    const months = ['M-4', 'M-3', 'M-2', 'M-1', 'Hoje'];
    const baseStudents = franchise.students || 50;
    const data = [
        Math.floor(baseStudents * 0.7),
        Math.floor(baseStudents * 0.8),
        Math.floor(baseStudents * 0.85),
        Math.floor(baseStudents * 0.93),
        baseStudents
    ];

    unitChartObj = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                data: data,
                backgroundColor: '#FF6B00',
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            scales: {
                y: {
                    display: false,
                    beginAtZero: true
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } }
                }
            }
        }
    });
}

// ===== NETWORK VIEW =====
function renderNetwork() {
    const grid = document.getElementById('units-list-view');
    if (!grid) return;

    const searchTerm = document.getElementById('gym-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('gym-filter-status')?.value || '';
    const sortValue = document.getElementById('gym-sort')?.value || 'name_asc';

    // Helper for health status (reused in filtering and rendering)
    const getUnitHealth = (f) => {
        const ticket = f.students > 0 ? (f.revenue / f.students) : 0;
        const profit = (f.revenue || 0) - (f.expenses || 0);
        const margin = f.revenue > 0 ? (profit / f.revenue) : 0;

        // Critical conditions (Realistic for a gym franchise)
        const isInternational = f.address?.toLowerCase().includes('paris') ||
            f.address?.toLowerCase().includes('france') ||
            f.address?.toLowerCase().includes('london') ||
            f.address?.toLowerCase().includes('uk') ||
            f.address?.toLowerCase().includes('ny') ||
            f.address?.toLowerCase().includes('york');

        const MIN_REVENUE = isInternational ? 15000 : 7000;
        const MIN_STUDENTS = isInternational ? 80 : 35;
        const MIN_PROFIT = isInternational ? 3000 : 1500;

        if (f.students < (MIN_STUDENTS / 2) || profit < 0 || f.revenue < (MIN_REVENUE / 3)) return 'danger';
        if (f.students < MIN_STUDENTS || f.revenue < MIN_REVENUE || profit < MIN_PROFIT || margin < 0.15) return 'warning';

        return 'healthy';
    };

    let filteredFranchises = franchises.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchTerm) || f.owner.toLowerCase().includes(searchTerm);

        const health = getUnitHealth(f);
        let matchesStatus = true;
        if (statusFilter === 'healthy') matchesStatus = (health === 'healthy');
        else if (statusFilter === 'attention') matchesStatus = (health === 'warning' || health === 'danger');

        return matchesSearch && matchesStatus;
    });

    // Sorting
    filteredFranchises.sort((a, b) => {
        switch (sortValue) {
            case 'students_desc': return b.students - a.students;
            case 'revenue_desc': return b.revenue - a.revenue;
            case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'name_asc':
            default:
                return a.name.localeCompare(b.name);
        }
    });

    if (filteredFranchises.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <i class="fa-solid fa-store-slash text-4xl mb-3 opacity-20"></i>
                <p class="font-bold">Nenhuma academia encontrada</p>
                <p class="text-[10px] uppercase tracking-widest mt-1">Tente ajustar seus filtros</p>
            </div>
        `;
        return;
    }

    const html = filteredFranchises.map(f => {
        const health = getUnitHealth(f);
        const beltColors = {
            'Branca': { bg: '#F8FAFC', text: '#334155', border: '#CBD5E1' }
        };

        return `
        <div class="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 card-shadow flex flex-col group hover:border-orange-200 transition-all hover-lift">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <h3 class="font-bold text-slate-900 group-hover:text-orange-600 transition truncate text-sm md:text-base">${f.name}</h3>
                        <!-- Status Indicator -->
                        <span class="w-2.5 h-2.5 flex-shrink-0 rounded-full ${ (f.isOnline || (localStorage.getItem('franqueado_franchise_id') === String(f.id)) || (f._id && localStorage.getItem('franqueado_franchise_id') === String(f._id))) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse' : 'bg-red-500 shadow-sm' }" 
                              title="${ (f.isOnline || (localStorage.getItem('franqueado_franchise_id') === String(f.id))) ? 'Online Agora' : 'Offline' }">
                        </span>
                    </div>
                    <p class="text-[9px] text-slate-400 font-bold uppercase truncate">${f.owner}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="openEditForm('${f.id}')" 
                        class="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar">
                        <i class="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    <button onclick="deleteFranchise('${f.id}')" 
                        class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir">
                        <i class="fa-solid fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
            <div class="space-y-2 mb-6 border-t border-slate-50 pt-4 text-[9px] md:text-[10px]">
                <div class="flex items-start gap-2">
                    <i class="fa-solid fa-location-dot text-orange-500 mt-0.5 flex-shrink-0"></i>
                    <p class="text-slate-500 leading-tight">${f.address}</p>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-phone text-orange-500 flex-shrink-0"></i>
                    <p class="text-slate-500 font-medium">${f.phone || 'N/A'}</p>
                </div>
                <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50">
                    <div class="bg-blue-50/50 border border-blue-100 p-2 rounded-2xl text-center group-hover:bg-blue-50 transition-colors">
                        <div class="text-[8px] uppercase font-bold text-blue-400 mb-1">Alunos</div>
                        <div class="text-xs font-black text-slate-700">
                             ${(typeof students !== 'undefined' && Array.isArray(students))
                ? students.filter(s => (s.franchiseId && s.franchiseId._id ? s.franchiseId._id : s.franchiseId) === f.id).length
                : (f.students || 0)}
                        </div>
                    </div>
                    <div class="bg-orange-50/50 border border-orange-100 p-2 rounded-2xl text-center group-hover:bg-orange-50 transition-colors">
                        <div class="text-[8px] uppercase font-bold text-orange-400 mb-1">Professores</div>
                        <div class="text-xs font-black text-slate-700">
                             ${(typeof teachers !== 'undefined' && Array.isArray(teachers))
                ? teachers.filter(t => (t.franchiseId && t.franchiseId._id ? t.franchiseId._id : t.franchiseId) === f.id).length
                : (f.teachers || 0)}
                        </div>
                    </div>
                    ${(() => {
                let bgClass, textClass, label, valueClass;

                if (health === 'healthy') {
                    bgClass = 'bg-green-50/50 border-green-100 group-hover:bg-green-100';
                    textClass = 'text-green-500';
                    label = 'Saudável';
                    valueClass = 'text-green-700';
                } else if (health === 'warning') {
                    bgClass = 'bg-amber-50/50 border-amber-100 group-hover:bg-amber-100';
                    textClass = 'text-amber-500';
                    label = 'Atenção';
                    valueClass = 'text-amber-700';
                } else {
                    bgClass = 'bg-red-50/50 border-red-100 group-hover:bg-red-100';
                    textClass = 'text-red-500';
                    label = 'Crítico';
                    valueClass = 'text-red-700';
                }

                return `
                        <div class="${bgClass} border p-2 rounded-2xl text-center transition-colors">
                            <div class="text-[8px] uppercase font-bold ${textClass} mb-1">Financeiro</div>
                            <div class="text-xs font-black ${valueClass}">${label}</div>
                        </div>
                        `;
            })()}
                </div>
            </div>
            <button onclick="viewUnitDetail('${f.id}')" class="w-full py-3 orange-gradient text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] transition shadow-lg">
                Ver Detalhes
            </button>
        </div>
        `;
    }).join('');

    grid.innerHTML = html;
}

window.toggleNetworkView = (view) => {
    const listView = document.getElementById('units-list-view');
    const mapView = document.getElementById('units-map-view');
    const btnList = document.getElementById('btn-view-list');
    const btnMap = document.getElementById('btn-view-map');

    if (view === 'list') {
        listView.classList.remove('hidden');
        mapView.classList.add('hidden');
        btnList.classList.add('bg-orange-500', 'text-white', 'shadow');
        btnList.classList.remove('text-slate-500');
        btnMap.classList.remove('bg-orange-500', 'text-white', 'shadow');
        btnMap.classList.add('text-slate-500');
    } else {
        listView.classList.add('hidden');
        mapView.classList.remove('hidden');
        btnMap.classList.add('bg-orange-500', 'text-white', 'shadow');
        btnMap.classList.remove('text-slate-500');
        btnList.classList.remove('bg-orange-500', 'text-white', 'shadow');
        btnList.classList.add('text-slate-500');

        if (!map && typeof L !== 'undefined') {
            initMap();
        }
    }
};

// ===== MAP FUNCTIONS =====
function initMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded');
        return;
    }

    map = L.map('map-container').setView([-25.4296, -49.2719], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19
    }).addTo(map);

    updateMapMarkers();
}

function updateMapMarkers() {
    if (!map) return;

    markers.forEach(m => map.removeLayer(m));
    markers = [];

    franchises.forEach(f => {
        if (f.lat && f.lng) {
            const marker = L.marker([f.lat, f.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    iconSize: [12, 12]
                })
            }).addTo(map);

            marker.bindPopup(`
                <div class="p-2 max-w-[150px]">
                    <p class="text-[10px] font-bold mb-1 truncate">${f.name}</p>
                    <p class="text-[8px] text-slate-500 mb-1 truncate"><i class="fa-solid fa-location-dot mr-1"></i>${f.address}</p>
                    <p class="text-[8px] text-slate-400 mb-2">${f.students} alunos</p>
                    <button onclick="viewUnitDetail('${f.id}')" class="w-full text-[8px] orange-gradient text-white px-2 py-1 rounded">Ver Detalhes</button>
                </div>
            `);

            markers.push(marker);
        }
    });
}

// ===== UNIT DETAIL =====
// ===== UNIT DETAIL =====
window.viewUnitDetail = (id) => {
    const franchise = franchises.find(f => f.id === id || f._id === id);
    if (!franchise) return;

    selectedFranchiseId = id;

    // Update Header
    const titleEl = document.getElementById('detail-title');
    const subtitleEl = document.getElementById('detail-subtitle');

    if (titleEl) titleEl.textContent = franchise.name;
    if (subtitleEl) subtitleEl.textContent = `${franchise.owner || 'Gerente'} | ${franchise.address || 'Endereço não informado'}`;

    changeSection('unit-detail');

    // Initialize Widget System for Detail View
    if (typeof initWidgetSystem === 'function') {
        // Use a small timeout to ensure DOM is visible/ready
        setTimeout(() => {
            initWidgetSystem('unit-widget-container', 'matrix-detail');
        }, 50);
    }
};


// ===== DIRECTIVES =====
function renderDirectives() {
    const container = document.getElementById('directives-list');
    if (!container) return;

    if (directives.length === 0) {
        container.innerHTML = '<p class="p-8 text-center text-slate-400 italic">Nenhum comunicado ainda.</p>';
        return;
    }

    const sorted = [...directives].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const html = sorted.map(d => `
        <div class="p-6 hover:bg-slate-50 transition">
            <div class="flex justify-between items-center mb-2">
                <p class="font-bold text-orange-600 uppercase text-xs">${d.targetUnit || 'Rede Geral'}</p>
                <span class="text-[9px] text-slate-400">${new Date(d.createdAt).toLocaleString('pt-PT')}</span>
            </div>
            <p class="text-slate-700 font-medium text-sm">${d.text}</p>
        </div>
    `).join('');

    container.innerHTML = html;
}

// ===== STUDENT MANAGEMENT =====

function calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

async function loadStudentsFromBackend() {
    try {
        const response = await apiRequest('/students');
        students = response.data || [];
        console.log('✅ Loaded students:', students.length);
        return true;
    } catch (error) {
        console.error('❌ Failed to load students:', error);
        return false;
    }
}

async function loadTeachersFromBackend() {
    try {
        const response = await apiRequest('/teachers');
        teachers = response.data || [];
        console.log('✅ Loaded teachers:', teachers.length);
        return true;
    } catch (error) {
        console.error('❌ Failed to load teachers:', error);
        return false;
    }
}

async function loadNetworkHistoricalMetrics(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`⏳ Loading historical metrics (Attempt ${i + 1}/${retries})...`);
            const response = await apiRequest('/metrics/network/summary?months=12');

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                historicalMetrics = response.data;
                console.log('✅ Loaded historical metrics:', historicalMetrics.length);
                return true;
            } else {
                console.warn('⚠️ Historical metrics empty, retrying...');
            }
        } catch (error) {
            console.error(`❌ Failed to load historical metrics (Attempt ${i + 1}):`, error);
        }
        // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
        if (i < retries - 1) await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
    }

    console.error('❌ Failed to load historical metrics after all attempts.');
    return false;
}

async function loadUnitHistoricalMetrics(franchiseId) {
    try {
        const response = await apiRequest(`/metrics/${franchiseId}?months=12`);
        return response.data || [];
    } catch (error) {
        console.error('❌ Failed to load unit historical metrics:', error);
        return [];
    }
}

window.setSort = (key) => {
    if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.direction = 'asc';
    }
    renderStudents();
};

// --- PAGINATION STATE ---
let currentStudentPage = 1;
const STUDENTS_PER_PAGE = 20;

// Reset page when filtering
window.resetMatrixStudentPage = () => {
    currentStudentPage = 1;
};

window.renderStudents = () => {
    const listBody = document.getElementById('students-list-body');
    const emptyMsg = document.getElementById('no-students-msg');

    // Safety check if elements exist
    if (!listBody) return;

    const searchQuery = document.getElementById('student-search')?.value.toLowerCase() || '';
    const beltFilter = document.getElementById('filter-belt')?.value || '';
    const degreeFilter = document.getElementById('filter-degree')?.value || '';
    const paymentFilter = document.getElementById('filter-payment')?.value || '';

    // Filter Logic
    let filtered = students.filter(s => {
        // Handle both object and string franchiseId
        const sId = typeof s.franchiseId === 'object' ? s.franchiseId._id : s.franchiseId;
        const matchUnit = !selectedFranchiseId || sId === selectedFranchiseId; // Show all if no unit selected, or filter by unit

        const matchSearch = (s.name || '').toLowerCase().includes(searchQuery);
        // "Todas" or empty string means no filter
        const matchBelt = (!beltFilter || beltFilter === 'Todas' || beltFilter === '') || s.belt === beltFilter;
        // Degree logic could be refined
        const matchDegree = (!degreeFilter || degreeFilter === 'Todos' || degreeFilter === '') || s.degree === degreeFilter;
        // "Todos" or empty string means no filter
        const matchPayment = (!paymentFilter || paymentFilter === 'Todos' || paymentFilter === '') || s.paymentStatus === paymentFilter;

        return matchUnit && matchSearch && matchBelt && matchDegree && matchPayment;
    });

    // Sorting Logic
    filtered.sort((a, b) => {
        let valA = a[currentSort.key] || '';
        let valB = b[currentSort.key] || '';

        // Specific logic for monthly payment column
        if (currentSort.key === 'monthlyFee') {
            valA = Array.isArray(a.amount) ? a.amount[a.amount.length - 1] : (parseFloat(a.amount) || 0);
            valB = Array.isArray(b.amount) ? b.amount[b.amount.length - 1] : (parseFloat(b.amount) || 0);
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Update Th headers for sorting indicator (optional but good practice)
    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('active-sort');
        if (th.id === `th-${currentSort.key}`) th.classList.add('active-sort');
    });

    // Pagination
    const totalPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE);
    if (currentStudentPage > totalPages && totalPages > 0) currentStudentPage = totalPages;
    if (currentStudentPage < 1) currentStudentPage = 1;

    const startIndex = (currentStudentPage - 1) * STUDENTS_PER_PAGE;
    const endIndex = startIndex + STUDENTS_PER_PAGE;
    const paginatedStudents = filtered.slice(startIndex, endIndex);

    // Empty State
    if (filtered.length === 0) {
        listBody.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        if (emptyMsg) emptyMsg.innerText = students.length === 0 ?
            'Nenhum aluno registrado na rede ou nesta unidade.' :
            'Nenhum aluno encontrado com estes filtros.';
        renderMatrixStudentsPagination(0, 0);
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');

    // Belt Colors Config (Consistent with Franchise App)
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

    // Render Rows
    listBody.innerHTML = paginatedStudents.map(s => {
        // Data Preparation
        const belt = s.belt || 'Branca';
        const style = beltColors[belt] || beltColors['Branca'];
        const degree = (s.degree && s.degree !== 'Nenhum') ? ` • ${s.degree}` : '';

        const amountVal = Array.isArray(s.amount) ? s.amount[s.amount.length - 1] : (parseFloat(s.amount) || 0);

        const status = s.paymentStatus === 'Paga' ? 'Paga' : 'Atrasada'; // Default to Atrasada if not Paga
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
                    <div class="text-[11px] font-medium text-slate-500">${s.email || '-'}</div>
                </td>
                <td class="py-4 px-2">
                    <div class="flex flex-col items-start gap-1">
                        <div class="font-bold text-slate-700 bg-slate-50 inline-block px-2 py-1 rounded-lg border border-slate-100 text-xs">
                            ${formatCurrency(amountVal)}
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
                        <button onclick="openStudentForm('${s._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm flex items-center justify-center"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteStudent('${s._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm flex items-center justify-center"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Render pagination controls
    renderMatrixStudentsPagination(filtered.length, totalPages);
};

// Pagination controls renderer for Matrix
window.renderMatrixStudentsPagination = (totalStudents, totalPages) => {
    const paginationContainer = document.getElementById('matrix-students-pagination');
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
        <button onclick="changeMatrixStudentPage(${currentStudentPage - 1})" 
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
            <button onclick="changeMatrixStudentPage(1)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500 transition-all">1</button>
        `;
        if (startPage > 2) {
            paginationHTML += `<span class="text-slate-400 px-2">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changeMatrixStudentPage(${i})" 
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
            <button onclick="changeMatrixStudentPage(${totalPages})" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500 transition-all">${totalPages}</button>
        `;
    }

    // Next button
    paginationHTML += `
        <button onclick="changeMatrixStudentPage(${currentStudentPage + 1})" 
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

// Change page function for Matrix
window.changeMatrixStudentPage = (page) => {
    currentStudentPage = page;
    renderStudents();
};

window.renderTeachers = () => {
    const listBody = document.getElementById('teachers-list-body');
    const noMsg = document.getElementById('no-teachers-msg');
    if (!listBody) return;

    // Filter by unit
    let filtered = teachers.filter(t => {
        const tFid = (t.franchiseId && t.franchiseId._id) ? t.franchiseId._id : t.franchiseId;
        return tFid === selectedFranchiseId;
    });

    // Apply search
    const query = document.getElementById('teacher-search')?.value.toLowerCase();
    if (query) {
        filtered = filtered.filter(t => t.name.toLowerCase().includes(query));
    }

    // Apply belt filter
    const beltFilter = document.getElementById('teacher-filter-belt')?.value;
    if (beltFilter && beltFilter !== 'Todas') {
        filtered = filtered.filter(t => t.belt === beltFilter);
    }

    // Apply degree filter
    const degreeFilter = document.getElementById('teacher-filter-degree')?.value;
    if (degreeFilter && degreeFilter !== 'Todos') {
        filtered = filtered.filter(t => (t.degree || 'Nenhum') === degreeFilter);
    }

    if (filtered.length === 0) {
        listBody.innerHTML = '';
        noMsg?.classList.remove('hidden');
        return;
    }

    noMsg?.classList.add('hidden');

    const beltColors = {
        'Branca': 'bg-slate-100 text-slate-600',
        'Cinza': 'bg-slate-400 text-white',
        'Amarela': 'bg-yellow-400 text-black',
        'Laranja': 'bg-orange-500 text-white',
        'Verde': 'bg-green-600 text-white',
        'Azul': 'bg-blue-600 text-white',
        'Roxa': 'bg-purple-600 text-white',
        'Marrom': 'bg-amber-800 text-white',
        'Preta': 'bg-slate-900 text-white',
        'Coral': 'belt-coral',
        'Vermelha': 'belt-vermelha'
    };

    listBody.innerHTML = filtered.map(t => {
        const beltStyle = beltColors[t.belt] || 'bg-slate-100 text-slate-600';

        return `
            <tr class="hover:bg-slate-50 transition group">
                <td class="py-4 px-2">
                    <div class="flex flex-col items-start gap-1">
                         <span class="font-bold text-slate-800">${(t.name || '').replace(/\s*\((Coral|Vermelha|Vermelho)\)/gi, '')}</span>
                         <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase border border-white/20 whitespace-nowrap ${beltStyle}">
                            ${t.belt} ${t.degree ? '• ' + t.degree : ''}
                        </span>
                    </div>
                </td>
                <td class="py-4 px-2 text-slate-500 text-xs">
                    ${t.gender || '-'}
                </td>
                <td class="py-4 px-2 text-slate-500 text-xs">
                    ${t.phone || '-'}
                </td>
                <td class="py-4 px-2 text-slate-500 text-xs max-w-[150px] truncate" title="${t.address || ''}">
                    ${t.address || '-'}
                </td>
                <td class="py-4 px-2 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="openTeacherForm('${t._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm flex items-center justify-center"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteTeacher('${t._id}')" class="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm flex items-center justify-center"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

window.openTeacherForm = async (teacherId = null) => {
    const f = franchises.find(u => u.id === selectedFranchiseId);
    if (!f) return;

    let teacher = null;
    if (teacherId) {
        try {
            const response = await fetch(`${API_URL}/teachers/${teacherId}`);
            const data = await response.json();
            teacher = data.data || data;
        } catch (error) {
            console.error('Error fetching teacher:', error);
            teacher = teachers.find(t => t._id === teacherId);
        }
    }

    const formHtml = `
        <div class="text-left">
            <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i class="fa-solid ${teacher ? 'fa-user-gear' : 'fa-user-plus'} text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold">${teacher ? 'Editar Professor' : 'Novo Professor'}</h2>
                    <p class="text-xs text-slate-500">${f.name}</p>
                </div>
            </div>
            
            <form id="teacher-form" class="space-y-4">
                <input type="hidden" name="id" value="${teacher ? teacher._id : ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                        <input type="text" name="name" required value="${teacher ? (teacher.name || '').replace(/\s*\((Coral|Vermelha|Vermelho)\)/gi, '') : ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nascimento</label>
                        <input type="date" name="birthDate" value="${teacher?.birthDate ? new Date(teacher.birthDate).toISOString().split('T')[0] : ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Data de Entrada</label>
                        <input type="date" name="hireDate" value="${teacher?.hireDate ? new Date(teacher.hireDate).toISOString().split('T')[0] : ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Gênero</label>
                        <select name="gender" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                            <option value="Masculino" ${teacher?.gender === 'Masculino' ? 'selected' : ''}>Masculino</option>
                            <option value="Feminino" ${teacher?.gender === 'Feminino' ? 'selected' : ''}>Feminino</option>
                            <option value="Outro" ${teacher?.gender === 'Outro' ? 'selected' : ''}>Outro</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                        <input type="tel" name="phone" value="${teacher?.phone || ''}" placeholder="(00) 0 0000-0000"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                        <input type="email" name="email" required value="${teacher?.email || ''}" placeholder="exemplo@email.com"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Endereço Completo</label>
                        <input type="text" name="address" value="${teacher?.address || ''}" placeholder="Rua, Número, Bairro, Cidade - UF"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Faixa</label>
                        <select name="belt" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                            <option value="Roxa" ${teacher?.belt === 'Roxa' ? 'selected' : ''}>Roxa</option>
                            <option value="Marrom" ${teacher?.belt === 'Marrom' ? 'selected' : ''}>Marrom</option>
                            <option value="Preta" ${teacher?.belt === 'Preta' ? 'selected' : ''}>Preta</option>
                            <option value="Coral" ${teacher?.belt === 'Coral' ? 'selected' : ''}>Coral</option>
                            <option value="Vermelha" ${teacher?.belt === 'Vermelha' ? 'selected' : ''}>Vermelha</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Grau</label>
                        <select name="degree" class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all">
                            <option value="Nenhum" ${(!teacher?.degree || teacher?.degree === 'Nenhum') ? 'selected' : ''}>Nenhum</option>
                            <option value="1º Grau" ${teacher?.degree === '1º Grau' ? 'selected' : ''}>1º Grau</option>
                            <option value="2º Grau" ${teacher?.degree === '2º Grau' ? 'selected' : ''}>2º Grau</option>
                            <option value="3º Grau" ${teacher?.degree === '3º Grau' ? 'selected' : ''}>3º Grau</option>
                            <option value="4º Grau" ${teacher?.degree === '4º Grau' ? 'selected' : ''}>4º Grau</option>
                            <option value="5º Grau" ${teacher?.degree === '5º Grau' ? 'selected' : ''}>5º Grau</option>
                            <option value="6º Grau" ${teacher?.degree === '6º Grau' ? 'selected' : ''}>6º Grau</option>
                            <option value="7º Grau" ${teacher?.degree === '7º Grau' ? 'selected' : ''}>7º Grau</option>
                            <option value="8º Grau" ${teacher?.degree === '8º Grau' ? 'selected' : ''}>8º Grau</option>
                            <option value="9º Grau" ${teacher?.degree === '9º Grau' ? 'selected' : ''}>9º Grau</option>
                            <option value="10º Grau" ${teacher?.degree === '10º Grau' ? 'selected' : ''}>10º Grau</option>
                        </select>
                    </div>
                </div>

                <div class="flex gap-2 pt-4">
                    <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Cancelar</button>
                    <button type="submit" class="flex-[2] px-4 py-2 orange-gradient text-white rounded-xl font-bold text-sm shadow-md hover:scale-[1.02] transition-all">
                        ${teacher ? 'Salvar Alterações' : 'Cadastrar Professor'}
                    </button>
                </div>
            </form>
        </div>
    `;

    openModal(formHtml);

    document.getElementById('teacher-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.franchiseId = selectedFranchiseId;
        saveTeacher(data);
    };
};

window.saveTeacher = async (data) => {
    try {
        const method = data.id ? 'PUT' : 'POST';
        const endpoint = data.id ? `/teachers/${data.id}` : '/teachers';

        await apiRequest(endpoint, method, data);

        // Refresh data
        await loadTeachersFromBackend();
        window.teachers = teachers; // Explicitly sync global

        updateStats(); // 🔄 Recalculate totals and Unit counts

        renderTeachers();

        // Update franchise teacher count locally
        if (method === 'POST') {
            const franchise = franchises.find(f => f.id === selectedFranchiseId || f._id === selectedFranchiseId);
            if (franchise) {
                renderNetwork(); // Refresh list view
                renderTopUnits(); // Refresh top units if needed
            }
        }

        // Refresh Unit Stats Widget if open
        if (window.widgetSystem && window.widgetSystem.widgets['matrix-unit-stats']) {
            window.widgetSystem.widgets['matrix-unit-stats'].update();
        }

        closeModal();
        showNotification(data.id ? 'Professor atualizado!' : 'Professor cadastrado!', 'success');
    } catch (e) {
        console.error('Error saving teacher:', e);
        showNotification('Erro ao salvar professor', 'error');
    }
};

window.deleteTeacher = async (id) => {
    if (!await confirmAction('Tem certeza que deseja excluir este professor? Essa ação é permanente.')) return;

    try {
        await apiRequest(`/teachers/${id}`, 'DELETE');

        // Refresh data
        await loadTeachersFromBackend();
        window.teachers = teachers; // Explicitly sync global

        updateStats(); // 🔄 Recalculate totals and Unit counts

        renderTeachers();

        // Update franchise teacher count locally
        const franchise = franchises.find(f => f.id === selectedFranchiseId || f._id === selectedFranchiseId);
        if (franchise && franchise.teachers > 0) {
            renderNetwork(); // Refresh list view
            renderTopUnits();
        }

        // Refresh Unit Stats Widget if open
        if (window.widgetSystem && window.widgetSystem.widgets['matrix-unit-stats']) {
            window.widgetSystem.widgets['matrix-unit-stats'].update();
        }

        showNotification('Professor removido!', 'success');
    } catch (e) {
        console.error('Error deleting teacher:', e);
        showNotification('Erro ao excluir professor', 'error');
    }
};

window.openStudentForm = async (studentId = null) => {
    const f = franchises.find(u => u.id === selectedFranchiseId);
    if (!f) return;

    let student = null;
    if (studentId) {
        try {
            const response = await fetch(`${API_URL}/students/${studentId}`);
            const data = await response.json();
            student = data.data || data;
        } catch (error) {
            console.error('Error fetching student:', error);
            student = students.find(s => s._id === studentId);
        }
    }

    // START HISTORY LOGIC
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
    // END HISTORY LOGIC

    const formHtml = `
        <div class="text-left">
            <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i class="fa-solid ${student ? 'fa-pen' : 'fa-user-plus'} text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold">${student ? 'Editar Aluno' : 'Matrícula de Aluno'}</h2>
                    <p class="text-xs text-slate-500">${f.name}</p>
                </div>
            </div>
            
            <form id="student-form" class="space-y-4">
                <input type="hidden" name="id" value="${student ? student._id : ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nome do Atleta *</label>
                        <input type="text" name="name" required value="${student ? student.name : ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="Ex: Carlos Silva">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Gênero</label>
                        <select name="gender" class="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none text-sm">
                            <option value="Masculino" ${student && student.gender === 'Masculino' ? 'selected' : ''}>Masculino</option>
                            <option value="Feminino" ${student && student.gender === 'Feminino' ? 'selected' : ''}>Feminino</option>
                            <option value="Outro" ${student && student.gender === 'Outro' ? 'selected' : ''}>Outro</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
                        <input type="date" name="birthDate" value="${student && student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                        <input type="text" name="phone" value="${student ? student.phone || '' : ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="(00) 0 0000-0000">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Email</label>
                        <input type="email" name="email" value="${student ? student.email || '' : ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="exemplo@email.com">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Faixa</label>
                        <select name="belt" class="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none text-sm">
                            ${['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'].map(belt =>
        `<option ${student && student.belt === belt ? 'selected' : ''}>${belt}</option>`
    ).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Grau</label>
                        <select name="degree" class="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none text-sm">
                            ${['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau', '7º Grau', '8º Grau', '9º Grau', '10º Grau'].map(degree =>
        `<option ${student && student.degree === degree ? 'selected' : ''}>${degree}</option>`
    ).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Valor Mensalidade (R$)</label>
                        <input type="number" step="0.01" name="amount" value="${student ? (Array.isArray(student.amount) ? (parseFloat(student.amount[student.amount.length - 1]) || 0).toFixed(2) : (parseFloat(student.amount) || 0).toFixed(2)) : '150.00'}" min="0"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Data de Inscrição</label>
                        <input type="date" name="registrationDate" value="${student && student.registrationDate ? new Date(student.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Status de Pagamento</label>
                        <select name="paymentStatus" class="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none text-sm">
                            <option value="Paga" ${student && student.paymentStatus === 'Paga' ? 'selected' : ''}>Paga</option>
                            <option value="Atrasada" ${student && student.paymentStatus === 'Atrasada' ? 'selected' : ''}>Atrasada</option>
                        </select>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Endereço Completo</label>
                        <input type="text" name="address" value="${student ? student.address || '' : ''}"
                            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                            placeholder="Rua, Número, Bairro, Cidade - UF">
                    </div>
                </div>
                
                ${historyHTML}

                <div class="flex gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onclick="closeModal()" 
                        class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                        Cancelar
                    </button>
                    <button type="submit" 
                        class="flex-1 px-6 py-3 orange-gradient text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition">
                        <i class="fa-solid ${student ? 'fa-floppy-disk' : 'fa-user-plus'} mr-2"></i> ${student ? 'Salvar Alterações' : 'Matricular'}
                    </button>
                </div>
            </form>
        </div>
    `;

    openModal(formHtml);

    document.getElementById('student-form').addEventListener('submit', student ? handleUpdateStudent : handleCreateStudent);
};

async function handleUpdateStudent(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const studentId = formData.get('id');
    const data = { franchiseId: selectedFranchiseId };

    formData.forEach((value, key) => {
        if (key !== 'id' && value !== '') {
            data[key] = key === 'amount' ? parseFloat(value) : value;
        }
    });

    const submitBtn = e.target.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Salvando...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest(`/students/${studentId}`, 'PUT', data);

        // Update local state
        const index = students.findIndex(s => s._id === studentId);
        if (index !== -1) {
            students[index] = response.data;
        }

        renderStudents();

        updateStats(); // Force refresh of all widgets
        closeModal();
        showNotification('✅ Dados do aluno atualizados!', 'success');
    } catch (error) {
        showNotification('❌ Erro ao atualizar: ' + error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 1. handleCreateStudent
async function handleCreateStudent(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = { franchiseId: selectedFranchiseId };

    formData.forEach((value, key) => {
        if (value !== '') {
            data[key] = key === 'amount' ? parseFloat(value) : value;
        }
    });

    const submitBtn = e.target.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Matriculando...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest('/students', 'POST', data);
        students.push(response.data);
        window.students = students;

        updateStats(); // 🔄 Syncs f.students/f.revenue with new data

        // Atualizar contador da academia (Visual)
        const currentCount = students.filter(s => (s.franchiseId && s.franchiseId._id ? s.franchiseId._id : s.franchiseId) === selectedFranchiseId).length;
        if (document.getElementById('detail-students')) {
            document.getElementById('detail-students').textContent = currentCount;
        }

        renderNetwork(); // Now uses updated f.students
        renderTopUnits(); // Now uses updated f.students

        // Refresh Unit Stats Widget if open
        if (window.widgetSystem && window.widgetSystem.widgets['matrix-unit-stats']) {
            window.widgetSystem.widgets['matrix-unit-stats'].update();
        }

        renderStudents();

        closeModal();
        showNotification('✅ Aluno matriculado com sucesso!', 'success');
    } catch (error) {
        showNotification('❌ Erro ao matricular: ' + error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 2. deleteStudent
window.deleteStudent = async (id) => {
    if (!await confirmAction('Remover este aluno?')) return;

    try {
        await apiRequest(`/students/${id}`, 'DELETE');
        students = students.filter(s => s._id !== id);
        window.students = students;

        updateStats(); // 🔄 Syncs f.students/f.revenue with new data

        const currentCount = students.filter(s => (s.franchiseId && s.franchiseId._id ? s.franchiseId._id : s.franchiseId) === selectedFranchiseId).length;
        if (document.getElementById('detail-students')) {
            document.getElementById('detail-students').textContent = currentCount;
        }

        renderNetwork(); // Now uses updated f.students
        renderTopUnits(); // Now uses updated f.students

        // Refresh Unit Stats Widget if open
        if (window.widgetSystem && window.widgetSystem.widgets['matrix-unit-stats']) {
            window.widgetSystem.widgets['matrix-unit-stats'].update();
        }

        renderStudents();

        showNotification('✅ Aluno removido com sucesso!', 'success');
    } catch (error) {
        showNotification('❌ Erro ao remover: ' + error.message, 'error');
    }
};




// ===== INITIALIZATION =====
async function init() {
    console.log('🥋 Arena Jiu-Jitsu Hub initialized');

    try {
        // Try to load from backend
        let backendAvailable = false;

        try {
            backendAvailable = await loadFranchisesFromBackend();
        } catch (e) { console.warn('Backend connection check failed'); }

        if (backendAvailable) {
            console.log('✅ Using backend data');
            try {
                await loadDirectivesFromBackend();
                await loadStudentsFromBackend();
                await loadTeachersFromBackend();
                await loadNetworkHistoricalMetrics();
            } catch (e) { console.error('Error loading secondary data', e); }
        } else {
            console.error('❌ Backend not available. Please ensure the server is running.');
            showNotification('Não foi possível conectar ao servidor.', 'error');
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }

    updateStats();
    renderTopUnits();
    renderNetwork();
    initMainChart('financial');

    // Initialize Widget System (With protection and retry)
    const initializeWidgets = (retryCount = 0) => {
        try {
            // Check if system is loaded and registry is populated
            const registrySize = (typeof WIDGET_REGISTRY !== 'undefined') ? Object.keys(WIDGET_REGISTRY).length : 0;

            if (typeof initWidgetSystem === 'function' && registrySize > 0) {
                console.log(`🚀 Initializing Widget System with ${registrySize} registered widgets`);
                initWidgetSystem('widget-container', 'matrix');
            } else if (retryCount < 10) {
                console.warn(`⏳ Widget system or registry not ready (size: ${registrySize}), retrying in 200ms...`);
                setTimeout(() => initializeWidgets(retryCount + 1), 200);
            } else {
                console.error("❌ Widget System initialization failed: Registry empty after multiple retries.");
            }
        } catch (e) {
            console.error("Widget init failed:", e);
        }
    };

    // Small initial delay to ensure all scripts are executed
    setTimeout(initializeWidgets, 100);
}

function renderMatrixMessages() {
    const container = document.getElementById('matrix-messages');
    if (!container) return;

    // Use real directives from backend
    const messagesToDisplay = directives || [];

    if (messagesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="flex justify-center py-10">
                <div class="text-center text-slate-400">
                    <i class="fa-solid fa-inbox text-4xl mb-3"></i>
                    <p class="text-sm">Nenhuma diretriz publicada ainda</p>
                </div>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    const sorted = [...messagesToDisplay].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
        return dateB - dateA;
    });

    container.innerHTML = sorted.map(msg => {
        // For backend directives, parse the text field to extract subject and body
        let subject = msg.subject || 'Comunicado';
        let body = msg.body || msg.text || '';
        let author = msg.author?.name || msg.author || 'Matriz';
        let date = msg.date || (msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('pt-BR') : '');

        // If it's a backend directive with formatted text, try to parse it
        if (msg.text && !msg.subject) {
            const lines = msg.text.split('\n');
            if (lines[0].startsWith('**') && lines[0].endsWith('**')) {
                subject = lines[0].replace(/\*\*/g, '');
                body = lines.slice(2).join('\n'); // Skip the subject and empty line
            } else {
                body = msg.text;
            }
        }

        // Determine priority badge color
        let priorityColor = 'orange';
        if (msg.priority === 'urgent') priorityColor = 'red';
        else if (msg.priority === 'high') priorityColor = 'orange';
        else if (msg.priority === 'low') priorityColor = 'blue';

        const directiveId = msg._id || msg.id;

        return `
            <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-${priorityColor}-500 bg-${priorityColor}-50 px-2 py-1 rounded-lg border border-${priorityColor}-100">${author}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-400">${date}</span>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="editDirective('${directiveId}')" 
                                class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-center"
                                title="Editar diretriz">
                                <i class="fa-solid fa-pen text-xs"></i>
                            </button>
                            <button onclick="deleteDirective('${directiveId}')" 
                                class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-300 transition-all flex items-center justify-center"
                                title="Excluir diretriz">
                                <i class="fa-solid fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <h4 class="font-bold text-slate-800 text-sm mb-1">${subject}</h4>
                <p class="text-xs text-slate-500 leading-relaxed">${body}</p>
            </div>
        `;
    }).join('');
}

window.sendMatrixMessage = async () => {
    const subjectInput = document.getElementById('matrix-subject');
    const bodyInput = document.getElementById('matrix-body');
    const btn = document.querySelector('#matrix-form button');
    const originalBtnContent = btn.innerHTML;

    if (!subjectInput.value || !bodyInput.value) return;

    // Loading State
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
    btn.disabled = true;

    try {
        // Combine subject and body into the text field expected by the backend
        const directiveText = `**${subjectInput.value}**\n\n${bodyInput.value}`;

        // Send to backend API
        const response = await apiRequest('/directives', 'POST', {
            text: directiveText,
            targetUnit: 'Toda a Rede',
            priority: 'medium',
            category: 'announcement',
            status: 'published',
            author: {
                name: 'Matriz Curitiba',
                role: 'HQ'
            }
        });

        if (response.success) {
            // Reset form
            subjectInput.value = '';
            bodyInput.value = '';

            // Reload directives from backend to ensure sync
            await loadDirectivesFromBackend();

            // Render updated messages
            renderMatrixMessages();
            showNotification('✅ Diretriz enviada para toda a rede!', 'success');
        } else {
            throw new Error(response.error || 'Falha ao enviar diretriz');
        }
    } catch (error) {
        console.error('Error sending directive:', error);
        showNotification('❌ Erro ao enviar diretriz: ' + error.message, 'error');
    } finally {
        // Reset Button
        btn.innerHTML = originalBtnContent;
        btn.disabled = false;
    }
};

// Hook into changeSection to render messages when opening Matrix Hub
const originalChangeSection = window.changeSection;
window.changeSection = (id) => {
    originalChangeSection(id);
    if (id === 'communication') {
        renderMatrixMessages();
    }
};

// ===== AI INTEGRATION (SECURE BACKEND PROXY) =====
async function callGemini(prompt, retries = 3) {
    const delays = [1000, 2000, 4000]; // Backoff exponencial: 1s, 2s, 4s

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            console.log(`📡 Calling AI Service (Tentativa ${attempt + 1}/${retries}): ${API_BASE_URL}/ai/generate`);

            const response = await fetch(`${API_BASE_URL}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({ prompt: prompt }),
                signal: AbortSignal.timeout(30000) // 30 segundos timeout
            });

            if (!response.ok) {
                const errorText = await response.text();

                // Parse error para verificar se é "overloaded"
                let errorMessage = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorText;
                } catch (e) {
                    // Se não for JSON, usa o texto direto
                }

                // Se for erro de sobrecarga E ainda temos tentativas, retry
                if ((errorMessage.includes('overloaded') || response.status === 503 || response.status === 429) && attempt < retries - 1) {
                    console.warn(`⚠️ Modelo sobrecarregado. Tentando novamente em ${delays[attempt]}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delays[attempt]));
                    continue; // Tenta novamente
                }

                throw new Error(`Server returned ${response.status}: ${errorMessage}`);
            }

            const json = await response.json();

            if (!json.success || !json.data) {
                // Verifica se é erro de overload
                const errorMsg = json.error || 'Falha na comunicação com IA';
                if ((errorMsg.includes('overloaded') || errorMsg.includes('quota')) && attempt < retries - 1) {
                    console.warn(`⚠️ Erro de cota/sobrecarga. Tentando novamente em ${delays[attempt]}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delays[attempt]));
                    continue; // Tenta novamente
                }
                throw new Error(errorMsg);
            }

            // ✅ Sucesso! Limpar markdown e retornar
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
            // Se for o último retry, retorna erro
            if (attempt === retries - 1) {
                console.error(`❌ AI Service Error após ${retries} tentativas:`, e);

                // Mensagens de erro mais amigáveis
                if (e.message.includes('overloaded')) {
                    return `ERROR: O serviço de IA está temporariamente sobrecarregado. Por favor, aguarde alguns minutos e tente novamente.`;
                } else if (e.message.includes('quota')) {
                    return `ERROR: Limite de uso da IA atingido. Contate o administrador do sistema.`;
                } else if (e.message.includes('timeout') || e.name === 'AbortError') {
                    return `ERROR: Tempo de resposta excedido. Verifique sua conexão com a internet.`;
                } else if (e.message.includes('Failed to fetch')) {
                    return `ERROR: Não foi possível conectar ao servidor. Verifique se o backend está rodando.`;
                }

                return `ERROR: ${e.message}`;
            }

            // Se não for o último retry e for erro de rede, tenta novamente
            console.warn(`⚠️ Erro na tentativa ${attempt + 1}. Tentando novamente em ${delays[attempt]}ms...`);
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        }
    }
}

// AI Analysis Logic (Powered by Google Gemini)
// AI Analysis Logic (Powered by Google Gemini)
window.runAiAnalysis = async (manual = false, targetId = 'ai-insight-content') => {
    // If no targetId passed (undefined/null), default to 'ai-insight-content'
    const finalTargetId = targetId || 'ai-insight-content';
    const container = document.getElementById(finalTargetId);
    if (!container) {
        console.warn(`runAiAnalysis: Container #${finalTargetId} not found.`);
        return;
    }

    // DETERMINE CONTEXT: Single Unit or Whole Network?
    const isNetworkContext = !selectedFranchiseId;

    // Loading State
    if (manual) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-12 text-slate-400 italic text-center">
                <i class="fa-solid fa-bolt animate-pulse mb-3 text-orange-500 text-2xl"></i>
                <span class="animate-pulse font-medium block">Consultando Gemini 2.0 Flash...</span>
                <span class="text-[10px] mt-2 block opacity-70">Enviando telemetria ${isNetworkContext ? 'da REDE' : 'da UNIDADE'} para análise neural.</span>
            </div>
        `;
    }

    // 1. Prepare Data Context for AI
    let dataContext = {};

    if (!isNetworkContext) {
        // --- SINGLE UNIT CONTEXT ---
        let franchise = franchises.find(f => f.id === selectedFranchiseId);

        // Fallback: Check if we have the franchise object directly (some flows might set this)
        if (!franchise && typeof currentFranchise !== 'undefined' && currentFranchise && currentFranchise.id === selectedFranchiseId) {
            franchise = currentFranchise;
        }

        if (!franchise) {
            console.warn('Franchise not found for ID:', selectedFranchiseId);
            // Attempt one last lookup by looser comparison or check if selectedFranchiseId IS the object
            if (typeof selectedFranchiseId === 'object') franchise = selectedFranchiseId;
        }

        // Filter students for THIS franchise
        const unitStudents = students.filter(s => {
            const sId = typeof s.franchiseId === 'object' ? s.franchiseId._id : s.franchiseId;
            return sId === selectedFranchiseId;
        });

        const count = unitStudents.length;
        const revenue = unitStudents.reduce((acc, s) => {
            const val = Array.isArray(s.amount) ? s.amount[s.amount.length - 1] : (parseFloat(s.amount) || 0);
            return acc + val;
        }, 0);
        const expenses = franchise ? (franchise.expenses || 0) : 0;
        const ticket = count ? revenue / count : 0;

        const beltsCount = {};
        unitStudents.forEach(s => { beltsCount[s.belt] = (beltsCount[s.belt] || 0) + 1; });

        const overdue = unitStudents.filter(s => s.paymentStatus === 'Atrasada').length;
        const retentionRate = count > 0 ? (100 - (overdue / count * 100)).toFixed(1) : 100;

        dataContext = {
            name: franchise ? franchise.name : 'Unidade',
            count,
            revenue,
            expenses,
            ticket,
            beltsCount,
            overdue,
            retentionRate,
            type: 'Unidade Individual'
        };

    } else {
        // --- WHOLE NETWORK CONTEXT (MATRIX VIEW) ---
        // Analyze only Matrix information (Royalties), not aggregated network revenue.

        const count = students.length; // Total students in network

        // Calculate Matrix Revenue (Royalties from all units)
        const matrixRevenue = franchises.reduce((sum, f) => {
            // Calculate revenue for this specific franchise based on its students
            const fStudents = students.filter(s => {
                const sFid = (s.franchiseId && s.franchiseId._id) ? s.franchiseId._id : s.franchiseId;
                return String(sFid) === String(f.id || f._id);
            });

            const fRevenue = fStudents.reduce((acc, s) => {
                const val = Array.isArray(s.amount) ? s.amount[s.amount.length - 1] : (parseFloat(s.amount) || 0);
                return acc + val;
            }, 0);

            const pct = f.royaltyPercent || 5;
            const royalty = fRevenue * (pct / 100);
            return sum + royalty;
        }, 0);

        // Matrix Expenses (Simulated or 0 if not tracked)
        const expenses = 0;

        // Distribution of belts is still relevant for network overview
        const beltsCount = {};
        students.forEach(s => { beltsCount[s.belt] = (beltsCount[s.belt] || 0) + 1; });

        const overdue = students.filter(s => s.paymentStatus === 'Atrasada').length;
        const retentionRate = count > 0 ? (100 - (overdue / count * 100)).toFixed(1) : 100;

        dataContext = {
            name: 'Matriz Arena Hub (Headquarters)',
            count,
            revenue: matrixRevenue, // Royalties
            expenses,
            beltsCount,
            overdue,
            retentionRate,
            franchiseCount: franchises.length,
            type: 'Matriz (Headquarters)'
        };
    }

    // 2. Build Prompt
    const financialLines = isNetworkContext
        ? `- Receita Recorrente (Royalties/Repasses): R$ ${dataContext.revenue.toFixed(2)}`
        : `- Faturamento Mensal: R$ ${dataContext.revenue.toFixed(2)}
        - Despesas Mensais: R$ ${dataContext.expenses.toFixed(2)}
        - Lucro Líquido: R$ ${(dataContext.revenue - dataContext.expenses).toFixed(2)}
        - Ticket Médio: R$ ${dataContext.ticket.toFixed(2)} (Ideal: R$ 200+)`;

    const prompt = `
        Atue como um Consultor Executivo Sênior de Franquias de Jiu-Jitsu (Arena Hub). Analise profundamente os dados ${isNetworkContext ? 'da MATRIZ (Headquarters)' : 'desta UNIDADE'} e gere insights estratégicos, detalhados e acionáveis.

        DADOS (${dataContext.type.toUpperCase()}):
        - Nome: ${dataContext.name}
        ${isNetworkContext ? `- Total de Unidades Supervisionadas: ${dataContext.franchiseCount}` : ''}
        - ${isNetworkContext ? 'Total de Alunos na Rede' : 'Alunos Ativos'}: ${dataContext.count}
        ${financialLines}
        - Distribuição de Faixas: ${JSON.stringify(dataContext.beltsCount)}
        - Inadimplência: ${dataContext.overdue} alunos
        - Taxa de Retenção (Estimada): ${dataContext.retentionRate}%
        
        INSTRUÇÕES PARA SAÍDA:
        Gere uma análise rica em formatação HTML simples (use <b> para destaques, listas <ul><li> para pontos chave).
        Não seja vago. Dê sugestões numéricas e táticas.
        Foque em ${isNetworkContext ? 'gestão da rede, expansão da marca e eficiência dos royalties' : 'eficiência local e crescimento'}.
        
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

        SAÍDA ESPERADA (APENAS JSON VÁLIDO e SEMPRE com as chaves cfo, coo, cmo):
    {
        "cfo": "Texto da análise (FORMATO STRING SIMPLES, NUNCA OBJETO)",
        "coo": "Texto da análise (FORMATO STRING SIMPLES, NUNCA OBJETO)",
        "cmo": "Texto da análise (FORMATO STRING SIMPLES, NUNCA OBJETO)"
    }
    `;

    // 3. Call AI
    const resultText = await callGemini(prompt);

    // Handle Error Responses
    let aiResponse = { cfo: "Análise indisponível no momento.", coo: "Análise indisponível no momento.", cmo: "Análise indisponível no momento." };

    // Handle Error Responses
    if (resultText && resultText.startsWith('ERROR:')) {
        console.error("AI Analysis Failed:", resultText);
        aiResponse = {
            cfo: "Erro na conexão com IA.",
            coo: "Verifique se o servidor backend está rodando.",
            cmo: resultText.replace('ERROR:', '')
        };
    } else if (resultText) {
        try {
            // 1. Extração robusta: localiza o primeiro { e o último }
            const startIdx = resultText.indexOf('{');
            const endIdx = resultText.lastIndexOf('}');

            if (startIdx !== -1 && endIdx !== -1) {
                let cleanJson = resultText.substring(startIdx, endIdx + 1);

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
};

window.listenToAudit = () => {
    const text = document.getElementById('ai-insight-content').innerText;
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    speechSynthesis.speak(u);
};

// ===== QUICK ACTIONS (AI TOOLS) =====
window.runQuickAction = async (type) => {
    // 1. Check if Unit is Selected
    if (!selectedFranchiseId) {
        showNotification('Selecione uma unidade no mapa ou lista primeiro para gerar insights específicos!', 'warning');
        return;
    }

    // 2. Prepare Context
    const franchise = franchises.find(f => f.id === selectedFranchiseId);
    if (!franchise) return;

    // 3. Open Modal with Loading State
    const loadingHtml = `
        <div class="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-2">
                <i class="fa-solid fa-wand-magic-sparkles animate-pulse text-orange-500 text-3xl"></i>
            </div>
            <div>
                <h3 class="text-xl font-bold text-slate-800">Gerando ${type}</h3>
                <p class="text-sm text-slate-500">A Inteligência Artificial está analisando os dados da unidade <strong>${franchise.name}</strong>...</p>
            </div>
            <div class="w-full max-w-xs bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div class="bg-orange-500 h-2 rounded-full animate-progress-indeterminate"></div>
            </div>
        </div>
    `;
    openModal(loadingHtml);

    // 4. Build Prompt based on Type
    const unitStudents = students.filter(s => {
        const sId = typeof s.franchiseId === 'object' ? s.franchiseId._id : s.franchiseId;
        return sId === selectedFranchiseId;
    });

    const count = unitStudents.length;
    const revenue = unitStudents.reduce((acc, s) => {
        const val = Array.isArray(s.amount) ? s.amount[s.amount.length - 1] : (parseFloat(s.amount) || 0);
        return acc + val;
    }, 0);
    const expenses = franchise.expenses || 0;

    let basePrompt = `
        Atue como Consultor Sênior da Arena Hub.
        Dados da Unidade: ${franchise.name}
        - Alunos: ${count}
        - Receita: R$ ${revenue.toFixed(2)}
        - Despesas: R$ ${expenses.toFixed(2)}
        - Local: ${franchise.address}
    `;

    let specificPrompt = '';

    if (type === 'Marketing Kit') {
        specificPrompt = `
            Crie um plano de marketing tático de 3 passos para o próximo mês focado em aumentar matrículas.
            Para cada passo, defina: Ação, Custo Estimado (Baixo/Médio) e Resultado Esperado.
            Responda em formato HTML simples (usando <strong>, <ul>, <li>, <br>).
            Não use Markdown.
        `;
    } else if (type === 'Análise SWOT') {
        specificPrompt = `
            Faça uma análise SWOT (Forças, Fraquezas, Oportunidades, Ameaças) concisa para esta unidade, considerando os dados financeiros fornecidos.
            Responda em formato HTML simples (usando <strong>, <ul>, <li>, <br>).
            Não use Markdown.
        `;
    } else if (type === 'Previsão IA') {
        specificPrompt = `
            Projete o cenário financeiro para os próximos 3 meses assumindo uma taxa de crescimento de 5% e churn de 3%.
            Estime a receita e dê uma recomendação financeira.
            Responda em formato HTML simples (usando <strong>, <p>, <br>).
            Não use Markdown.
        `;
    }

    try {
        // 5. Call AI
        const resultText = await callGemini(basePrompt + specificPrompt);

        // 6. Render Result in Modal
        if (resultText && !resultText.startsWith('ERROR:')) {
            const resultHtml = `
                <div class="flex flex-col h-full max-h-[calc(90vh-8rem)]">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 flex-shrink-0 pr-12">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                <i class="fa-solid fa-robot"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg text-slate-800">${type}</h3>
                                <p class="text-xs text-slate-500">Gerado via Gemini AI • ${new Date().toLocaleTimeString()}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="copyQuickActionResult(this)" class="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg transition-all hover:bg-green-100" title="Copiar resposta">
                                <i class="fa-solid fa-copy"></i> Copiar
                            </button>
                            <button onclick="runQuickAction('${type}')" class="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg transition-all hover:bg-orange-100">
                                <i class="fa-solid fa-rotate"></i> Atualizar
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto pr-2 -mr-2">
                        <div id="quick-action-result" class="prose prose-sm prose-slate max-w-none ai-html-content text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            ${resultText}
                        </div>
                    </div>

                    <div class="flex justify-end pt-4 mt-4 border-t border-slate-100 flex-shrink-0">
                        <button onclick="closeModal()" class="px-6 py-2.5 orange-gradient text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            Fechar Análise
                        </button>
                    </div>
                </div>
            `;
            openModal(resultHtml);
        } else {
            const errorMsg = resultText ? resultText.replace('ERROR:', '') : 'Erro desconhecido';
            throw new Error(errorMsg);
        }
    } catch (e) {
        const errorHtml = `
            <div class="p-8 text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">Falha ao gerar análise</h3>
                <p class="text-sm text-slate-500 mb-4">${e.message}</p>
                <div class="bg-red-50 p-3 rounded-lg border border-red-100 text-xs text-red-700 font-mono mb-6 mx-auto max-w-sm">
                    Verifique se o backend está rodando na porta 5000 e se a API Key é válida.
                </div>
                <div class="flex justify-center gap-3">
                    <button onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200">
                        Fechar
                    </button>
                    <button onclick="runQuickAction('${type}')" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 shadow-md">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        `;
        openModal(errorHtml);
    }
};

// ===== DIRECTIVE MANAGEMENT =====
window.editDirective = async function (directiveId) {
    if (!directiveId) return;

    // Find the directive
    const directive = directives.find(d => (d._id || d.id) === directiveId);
    if (!directive) {
        showNotification('❌ Diretriz não encontrada', 'error');
        return;
    }

    // Parse subject and body from text
    let subject = '';
    let body = directive.text || '';

    const lines = directive.text.split('\n');
    if (lines[0].startsWith('**') && lines[0].endsWith('**')) {
        subject = lines[0].replace(/\*\*/g, '');
        body = lines.slice(2).join('\n');
    }

    // Open modal with edit form
    const modalHtml = `
        <div class="text-left">
            <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i class="fa-solid fa-pen text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold">Editar Diretriz</h2>
                    <p class="text-xs text-slate-500">Atualize o comunicado oficial</p>
                </div>
            </div>
            
            <form id="edit-directive-form" class="space-y-4">
                <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assunto</label>
                    <input type="text" id="edit-directive-subject" required
                        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition"
                        placeholder="Ex: Atualização de Graduação 2026"
                        value="${subject}">
                </div>

                <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mensagem</label>
                    <textarea id="edit-directive-body" required rows="6"
                        class="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition resize-none"
                        placeholder="Digite as instruções oficiais para os franqueados...">${body}</textarea>
                </div>

                <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                    <select id="edit-directive-priority"
                        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition">
                        <option value="low" ${directive.priority === 'low' ? 'selected' : ''}>Baixa</option>
                        <option value="medium" ${directive.priority === 'medium' ? 'selected' : ''}>Normal</option>
                        <option value="high" ${directive.priority === 'high' ? 'selected' : ''}>Alta</option>
                        <option value="urgent" ${directive.priority === 'urgent' ? 'selected' : ''}>Urgente</option>
                    </select>
                </div>

                <div class="flex gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onclick="closeModal()" 
                        class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                        Cancelar
                    </button>
                    <button type="submit" 
                        class="flex-1 px-6 py-3 orange-gradient text-white rounded-xl font-bold text-sm shadow-lg transition">
                        <i class="fa-solid fa-floppy-disk mr-2"></i> Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    `;

    openModal(modalHtml);

    // Handle form submission
    document.getElementById('edit-directive-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const subjectInput = document.getElementById('edit-directive-subject');
        const bodyInput = document.getElementById('edit-directive-body');
        const priorityInput = document.getElementById('edit-directive-priority');
        const submitBtn = e.target.querySelector('[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Salvando...';
        submitBtn.disabled = true;

        try {
            const updatedText = `**${subjectInput.value}**\n\n${bodyInput.value}`;

            const response = await apiRequest(`/directives/${directiveId}`, 'PUT', {
                text: updatedText,
                priority: priorityInput.value
            });

            if (response.success) {
                // Reload directives
                await loadDirectivesFromBackend();
                renderMatrixMessages();
                closeModal();
                showNotification('✅ Diretriz atualizada com sucesso!', 'success');
            } else {
                throw new Error(response.error || 'Falha ao atualizar diretriz');
            }
        } catch (error) {
            console.error('Error updating directive:', error);
            showNotification('❌ Erro ao atualizar: ' + error.message, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
};

window.deleteDirective = async function (directiveId) {
    if (!directiveId) return;

    // Find the directive for confirmation message
    const directive = directives.find(d => (d._id || d.id) === directiveId);
    if (!directive) {
        showNotification('❌ Diretriz não encontrada', 'error');
        return;
    }

    // Parse subject for display
    let subject = 'esta diretriz';
    const lines = directive.text.split('\n');
    if (lines[0].startsWith('**') && lines[0].endsWith('**')) {
        subject = `"${lines[0].replace(/\*\*/g, '')}"`;
    }

    // Confirmation modal
    const confirmHtml = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fa-solid fa-trash text-red-500 text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">Excluir Diretriz?</h3>
            <p class="text-sm text-slate-500 mb-6">
                Tem certeza que deseja excluir ${subject}?<br>
                Esta ação não pode ser desfeita.
            </p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal()" 
                    class="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                    Cancelar
                </button>
                <button onclick="confirmDeleteDirective('${directiveId}')" 
                    class="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-red-600 transition">
                    <i class="fa-solid fa-trash mr-2"></i> Sim, Excluir
                </button>
            </div>
        </div>
    `;

    openModal(confirmHtml);
};

window.confirmDeleteDirective = async function (directiveId) {
    try {
        const response = await apiRequest(`/directives/${directiveId}`, 'DELETE');

        if (response.success) {
            // Reload directives
            await loadDirectivesFromBackend();
            renderMatrixMessages();
            closeModal();
            showNotification('✅ Diretriz excluída com sucesso!', 'success');
        } else {
            throw new Error(response.error || 'Falha ao excluir diretriz');
        }
    } catch (error) {
        console.error('Error deleting directive:', error);
        closeModal();
        showNotification('❌ Erro ao excluir: ' + error.message, 'error');
    }
};

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===== LIVE STATUS UPDATES =====
(function() {
    // 1. Listen for cross-tab login/logout events
    window.addEventListener('storage', (event) => {
        if (event.key === 'franqueado_franchise_id' || event.key === 'franqueado_logged_in') {
            console.log('🔄 Session change detected, updating network list...');
            if (typeof renderNetwork === 'function') renderNetwork();
        }
    });

    // 2. Poll for local changes (failsafe)
    setInterval(() => {
        // Re-render to update the "Online/Offline" indicator based on localStorage
        if (typeof renderNetwork === 'function') {
           // efficient re-render only if user is viewing the list
           const grid = document.getElementById('units-list-view');
           // Check visibility (offsetParent is null if hidden)
           if (grid && grid.offsetParent !== null) { 
               renderNetwork();
           }
        }
    }, 2000); 
})();

// ===== COPY QUICK ACTION RESULT =====
window.copyQuickActionResult = async function(button) {
    try {
        const resultDiv = document.getElementById('quick-action-result');
        if (!resultDiv) {
            throw new Error('Conteúdo não encontrado');
        }
        
        // Get text content without HTML tags
        const textContent = resultDiv.innerText || resultDiv.textContent;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(textContent);
        
        // Update button to show success
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
        button.classList.remove('text-green-600', 'hover:text-green-700', 'bg-green-50', 'hover:bg-green-100');
        button.classList.add('text-white', 'bg-green-500');
        
        // Show notification
        if (typeof showNotification === 'function') {
            showNotification('✅ Texto copiado com sucesso!', 'success');
        }
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('text-white', 'bg-green-500');
            button.classList.add('text-green-600', 'hover:text-green-700', 'bg-green-50', 'hover:bg-green-100');
        }, 2000);
        
    } catch (err) {
        console.error('Erro ao copiar:', err);
        if (typeof showNotification === 'function') {
            showNotification('❌ Erro ao copiar texto', 'error');
        } else {
            alert('Não foi possível copiar o texto. Por favor, tente novamente.');
        }
    }
};
