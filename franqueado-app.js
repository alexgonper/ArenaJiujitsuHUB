// Global State
let franchises = [];
let teachers = [];
let currentUnit = null;
// Mock students removed - now using real API data

const matrixMessages = [
    {
        subject: 'Atualização de Protocolos Sanitários',
        body: 'Prezados franqueados, reforçamos a importância de manter os totens de álcool em gel abastecidos.',
        date: 'Ontem',
        author: 'Diretoria Geral'
    },
    {
        subject: 'Novo Ajuste de Mensalidades 2026',
        body: 'A tabela de preços sugerida para 2026 já está disponível na área de downloads.',
        date: 'Há 3 dias',
        author: 'Financeiro'
    }
];

// Belt Colors Helper
const beltColors = {
    'Branca': { bg: '#F8FAFC', text: '#334155', border: '#CBD5E1' },
    'Cinza': { bg: '#6B7280', text: '#FFFFFF', border: '#6B7280' },
    'Amarela': { bg: '#FCD34D', text: '#713F12', border: '#FCD34D' },
    'Laranja': { bg: '#FF6B00', text: '#FFFFFF', border: '#FF6B00' },
    'Verde': { bg: '#22C55E', text: '#FFFFFF', border: '#22C55E' },
    'Azul': { bg: '#3B82F6', text: '#FFFFFF', border: '#3B82F6' },
    'Roxa': { bg: '#A855F7', text: '#FFFFFF', border: '#A855F7' },
    'Marrom': { bg: '#92400E', text: '#FFFFFF', border: '#92400E' },
    'Preta': { bg: '#000000', text: '#FFFFFF', border: '#000000' },
    'Coral': { bg: 'repeating-linear-gradient(90deg, #F00 0, #F00 10px, #FFF 10px, #FFF 20px)', text: '#000000', border: '#DC2626' },
    'Vermelha': { bg: '#EE1111', text: '#FFFFFF', border: '#EE1111' }
};

// Current Unit
// let currentUnit = null; (Moved to top)

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await FranchiseAPI.getAll();
        franchises = response.data;
        initLoginScreen();
    } catch (error) {
        console.error('Erro ao carregar academias:', error);
        // Fallback to empty list or alert
    }
});

// --- UI MODAL SYSTEM ---
function showPortalModal(title, message, iconType = 'info') {
    const modal = document.getElementById('portal-modal');
    if (!modal) return;
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
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function initLoginScreen() {
    const list = document.getElementById('unit-selector');
    list.innerHTML = franchises.map(f => `
        <div onclick="selectUnit('${f._id || f.id}')" class="unit-option p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all flex justify-between items-center group" data-id="${f._id || f.id}">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold group-hover:bg-orange-500 group-hover:text-white transition">
                    ${f.name.charAt(6) || f.name.charAt(0)}
                </div>
                <span class="text-sm font-medium text-slate-700 group-hover:text-orange-700">${f.name}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-300 group-hover:text-orange-500"></i>
        </div>
    `).join('');
}

window.selectUnit = (id) => {
    // UI Selection Logic
    document.querySelectorAll('.unit-option').forEach(el => {
        el.classList.remove('border-orange-500', 'bg-orange-50', 'ring-2', 'ring-orange-200');
        if (el.dataset.id === id) {
            el.classList.add('border-orange-500', 'bg-orange-50', 'ring-2', 'ring-orange-200');
        }
    });

    currentUnit = franchises.find(f => (f._id || f.id) === id);

    // Apply branding to login screen
    applyBranding(currentUnit, true);

    // Enable Login Button
    const btn = document.getElementById('btn-login');
    btn.disabled = false;
    btn.classList.remove('bg-slate-200', 'text-slate-400');
    // btn.classList.add('orange-gradient', 'text-white', 'shadow-lg', 'hover:scale-[1.02]'); // Handled by applyBranding
    btn.innerText = `Acessar ${currentUnit.branding?.brandName || currentUnit.name}`;
};

window.login = () => {
    if (!currentUnit) return;

    // Transition Animation
    const screen = document.getElementById('login-screen');
    screen.classList.add('opacity-0', 'pointer-events-none', 'transition-opacity', 'duration-500');

    // Load Dashboard
    loadDashboard(currentUnit);
};

window.logout = () => {
    showPortalConfirm(
        'Sair do Painel',
        'Tem certeza que deseja sair do painel da unidade? Você precisará selecionar a unidade novamente.',
        () => {
            location.reload();
        }
    );
};

async function loadDashboard(unit) {
    // Apply full branding
    applyBranding(unit);

    // Set Header Info
    document.getElementById('unit-name-display').textContent = unit.name;
    document.getElementById('unit-avatar').textContent = unit.name.charAt(6) || unit.name.charAt(0);

    // Set Stats
    document.getElementById('stat-students').textContent = unit.students || 0;
    document.getElementById('stat-revenue').textContent = `R$ ${(unit.revenue || 0).toLocaleString()}`;

    // Get Graduation Stats (New in Phase 2)
    try {
        const gradRes = await GraduationAPI.getEligible(unit._id || unit.id);
        const eligibleCount = gradRes.count || 0;
        // Optimization: Use an existing placeholder or update the retention rate text
        const retentionElem = document.querySelector('#stat-students').closest('.grid').children[2];
        if (retentionElem) {
            retentionElem.querySelector('span').textContent = eligibleCount;
            retentionElem.querySelector('p').textContent = 'Prontos para Graduar';
            retentionElem.querySelector('.p-3').className = 'p-3 bg-orange-50 text-brand-500 rounded-xl';
            retentionElem.querySelector('i').className = 'fa-solid fa-medal';
        }
    } catch (err) {
        console.error('Erro ao buscar stats de graduação:', err);
    }

    // Load Messages
    renderMessages();

    // Load Students Table from API
    await renderStudentsList(unit._id || unit.id);
}

function renderMessages() {
    const html = matrixMessages.map(msg => `
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div class="flex justify-between items-start mb-1">
                <span class="text-[10px] font-bold uppercase tracking-widest text-orange-500">${msg.author}</span>
                <span class="text-[10px] text-slate-400">${msg.date}</span>
            </div>
            <h4 class="font-bold text-sm text-slate-800">${msg.subject}</h4>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">${msg.body}</p>
        </div>
    `).join('');

    document.getElementById('dashboard-messages').innerHTML = html;
    document.getElementById('matrix-feed').innerHTML = html.replace('line-clamp-2', ''); // Full view in Matrix tab
}

async function renderStudentsList(franchiseId) {
    const tableBody = document.getElementById('students-table-body');

    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Carregando alunos...</td></tr>';

    try {
        // Fetch students from API
        const response = await StudentAPI.getByFranchise(franchiseId);
        const myStudents = response.data || [];

        if (myStudents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-slate-400">Nenhum aluno encontrado.</td></tr>';
            return;
        }

        const html = myStudents.map(s => {
            const beltStyle = beltColors[s.belt || 'Branca'];
            const statusColor = s.paymentStatus === 'Paga' ? 'text-green-500' : 'text-red-500';
            const degree = (s.degree && s.degree !== 'Nenhum') ? ' • ' + s.degree : '';

            return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">${s.name.charAt(0)}</div>
                        <span class="font-bold text-slate-700">${s.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase" 
                          style="background: ${beltStyle.bg}; color: ${beltStyle.text}; border: 1px solid ${beltStyle.border}; ${beltStyle.extra || ''}">
                        ${s.belt}${degree}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-xs font-bold uppercase ${statusColor}">${s.paymentStatus || 'Paga'}</span>
                </td>
            </tr>
            `;
        }).join('');

        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-red-400"><i class="fa-solid fa-exclamation-triangle mr-2"></i>Erro ao carregar alunos. Verifique se o servidor está rodando.</td></tr>';
    }
}


async function renderTeachersList() {
    if (!currentUnit) return;

    const listBody = document.getElementById('teachers-table-body');
    if (!listBody) return;

    const searchQuery = document.getElementById('teacher-search')?.value.toLowerCase() || '';
    const beltFilter = document.getElementById('filter-teacher-belt')?.value || '';
    const degreeFilter = document.getElementById('filter-teacher-degree')?.value || '';

    try {
        const response = await TeacherAPI.getByFranchise(currentUnit._id || currentUnit.id);
        teachers = response.data;

        let filtered = teachers.filter(t => {
            const matchSearch = (t.name || '').toLowerCase().includes(searchQuery);
            const matchBelt = (!beltFilter || beltFilter === 'Todas') || t.belt === beltFilter;
            const matchDegree = (!degreeFilter || degreeFilter === 'Todos os Graus') || t.degree === degreeFilter;
            return matchSearch && matchBelt && matchDegree;
        });

        const html = filtered.map(t => {
            const beltStyle = beltColors[t.belt || 'Branca'] || beltColors['Branca'];
            const degreeText = (t.degree && t.degree !== 'Nenhum') ? ` • ${t.degree}` : '';

            return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
                <td class="px-6 py-4">
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-800">${(t.name || '').replace(/\s*\((Coral|Vermelha|Vermelho)\)/gi, '')}</span>
                        <div class="mt-1">
                            <span class="inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border" 
                                  style="background: ${beltStyle.bg}; color: ${beltStyle.text}; border-color: ${beltStyle.border}; ${beltStyle.extra || ''}">
                                ${t.belt}${degreeText}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-500">
                    ${t.birthDate ? new Date(t.birthDate).toLocaleDateString('pt-BR') : '--'}
                </td>
                <td class="px-6 py-4 text-slate-500">
                    ${t.hireDate ? new Date(t.hireDate).toLocaleDateString('pt-BR') : '--'}
                </td>
                <td class="px-6 py-4 text-right">
                        <button onclick="openTeacherModal('${t._id}')" class="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition flex items-center justify-center">
                            <i class="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button onclick="deleteTeacher('${t._id}')" class="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center">
                            <i class="fa-solid fa-trash text-[10px]"></i>
                        </button>
                </td>
            </tr>
            `;
        }).join('');

        listBody.innerHTML = html || '<tr><td colspan="4" class="text-center py-8 text-slate-400">Nenhum professor encontrado.</td></tr>';
    } catch (error) {
        console.error('Erro ao buscar professores:', error);
        listBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-red-400">Erro ao carregar professores.</td></tr>';
    }
}

window.openTeacherModal = (id = null) => {
    const teacher = id ? teachers.find(t => t._id === id) : null;

    // Default values and formatting for dates
    const name = teacher ? (teacher.name || '').replace(/\s*\((Coral|Vermelha|Vermelho)\)/gi, '') : '';
    const belt = teacher ? teacher.belt : 'Preta';
    const degree = teacher ? teacher.degree : 'Nenhum';
    const birthDate = teacher && teacher.birthDate ? new Date(teacher.birthDate).toISOString().split('T')[0] : '';
    const hireDate = teacher && teacher.hireDate ? new Date(teacher.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const belts = ['Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'];
    const degrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau', '7º Grau', '8º Grau', '9º Grau', '10º Grau'];

    const formHtml = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" id="teacher-modal-overlay">
            <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                <button onclick="document.getElementById('teacher-modal-overlay').remove()" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
                
                <h2 class="text-xl font-bold mb-6">${teacher ? 'Editar Professor' : 'Novo Professor'}</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Completo *</label>
                        <input type="text" id="modal-teacher-name" name="name" required value="${name}" placeholder="Ex: Mestre Carlos" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nascimento *</label>
                            <input type="date" id="modal-teacher-birth" value="${birthDate}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data de Entrada</label>
                            <input type="date" id="modal-teacher-hire" value="${hireDate}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Faixa</label>
                            <select id="modal-teacher-belt" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm">
                                ${belts.map(b => `<option value="${b}" ${belt === b ? 'selected' : ''}>${b}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grau</label>
                            <select id="modal-teacher-degree" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm">
                                ${degrees.map(d => `<option value="${d}" ${degree === d ? 'selected' : ''}>${d}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-8">
                    <button onclick="document.getElementById('teacher-modal-overlay').remove()" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Cancelar</button>
                    <button id="btn-save-teacher" class="flex-1 py-3 orange-gradient text-white rounded-xl font-bold shadow-lg text-sm">Salvar Professor</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHtml);

    document.getElementById('btn-save-teacher').onclick = async () => {
        const body = {
            name: document.getElementById('modal-teacher-name').value,
            birthDate: document.getElementById('modal-teacher-birth').value,
            hireDate: document.getElementById('modal-teacher-hire').value,
            belt: document.getElementById('modal-teacher-belt').value,
            degree: document.getElementById('modal-teacher-degree').value,
            franchiseId: currentUnit?._id || currentUnit?.id
        };

        if (!body.name || !body.birthDate || !body.franchiseId) {
            showPortalModal('Campos Obrigatórios', 'Por favor, preencha o nome, data de nascimento e verifique sua conexão.', 'error');
            return;
        }

        try {
            if (id) {
                await TeacherAPI.update(id, body);
            } else {
                await TeacherAPI.create(body);
            }
            document.getElementById('teacher-modal-overlay').remove();
            showPortalModal('Sucesso!', 'Os dados do professor foram salvos com sucesso.', 'success');
            renderTeachersList();
        } catch (error) {
            console.error('Error saving teacher:', error);
            showPortalModal('Erro', 'Verifique se todos os campos obrigatórios (*) foram preenchidos corretamente.', 'error');
        }
    };
};

window.deleteTeacher = async (id) => {
    showPortalConfirm(
        'Excluir Professor',
        'Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.',
        async () => {
            try {
                await TeacherAPI.delete(id);
                showPortalModal('Excluído', 'O professor foi removido do sistema.', 'success');
                renderTeachersList();
            } catch (error) {
                showPortalModal('Erro', 'Não foi possível excluir o professor. Tente novamente.', 'error');
            }
        },
        'error'
    );
};

// Navigation Logic
window.switchTab = (tabId) => {
    // Buttons state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-orange-50', 'text-orange-600');
        btn.classList.add('text-slate-500', 'hover:bg-slate-50');
    });

    const activeBtn = document.getElementById(`nav-${tabId}`);
    activeBtn.classList.remove('text-slate-500', 'hover:bg-slate-50');
    activeBtn.classList.add('bg-orange-50', 'text-orange-600');

    // Views state
    document.querySelectorAll('[id^="view-"]').forEach(view => view.classList.add('hidden'));
    document.getElementById(`view-${tabId}`)?.classList.remove('hidden');

    // Title update
    const titles = {
        'dashboard': 'Visão Geral',
        'students': 'Gestão de Alunos',
        'teachers': 'Gestão de Professores',
        'graduation': 'Gestão de Graduações',
        'financial': 'Financeiro',
        'matrix': 'Matrix Hub'
    };
    document.getElementById('page-title').textContent = titles[tabId] || 'Portal do Franqueado';

    if (tabId === 'teachers') {
        renderTeachersList();
    }
    if (tabId === 'graduation') {
        renderGraduationView();
    }
};

async function renderGraduationView() {
    if (!currentUnit) return;

    const tableBody = document.getElementById('graduation-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Verificando elegibilidade...</td></tr>';

    try {
        const response = await GraduationAPI.getEligible(currentUnit._id || currentUnit.id);
        const eligibleStudents = response.data || [];

        if (eligibleStudents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400">Nenhum aluno elegível no momento.</td></tr>';
            return;
        }

        tableBody.innerHTML = eligibleStudents.map(s => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
                <td class="px-6 py-4 font-bold text-slate-700">${s.name}</td>
                <td class="px-6 py-4">
                    <span class="text-xs text-slate-500">${s.belt} - ${s.degree}</span>
                    <i class="fa-solid fa-arrow-right mx-2 text-slate-300 text-[10px]"></i>
                    <span class="text-xs font-bold text-brand-500">${s.next}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-700">${s.attended}</span>
                        <span class="text-[10px] text-slate-400">/ ${s.required}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase">Pronto</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="processPromotion('${s.id}', '${s.name}', '${s.next}')" 
                            class="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition shadow-sm">
                        Graduar
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar graduáveis:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-red-400">Erro ao verificar elegibilidade.</td></tr>';
    }
}

window.processPromotion = async (studentId, name, nextLevel) => {
    showPortalConfirm(
        'Confirmar Graduação',
        `Deseja confirmar a graduação de ${name} para ${nextLevel}?`,
        async () => {
            try {
                // Find a black belt teacher to "sign" the promotion (optional validation, using first for now)
                const teachersRes = await TeacherAPI.getByFranchise(currentUnit._id || currentUnit.id);
                const blackBelt = teachersRes.data.find(t => t.belt === 'Preta');
                const teacherId = blackBelt ? blackBelt._id : (teachersRes.data[0]?._id || null);

                const response = await GraduationAPI.promote(studentId, teacherId);

                if (response.success) {
                    showPortalModal('Graduação Realizada!', `${name} agora é ${nextLevel}. Oss!`, 'success');
                    renderGraduationView();
                }
            } catch (error) {
                console.error('Erro ao processar graduação:', error);
                showPortalModal('Erro na Graduação', 'Não foi possível processar. Verifique se há um professor faixa-preta cadastrado.', 'error');
            }
        }
    );
};
// --- WHITE LABEL / BRANDING ---
function applyBranding(unit, loginOnly = false) {
    if (!unit) return;
    const b = unit.branding || {};

    const primaryColor = b.primaryColor || '#FF6B00';
    const secondaryColor = b.secondaryColor || '#000000';
    const brandName = b.brandName || unit.name;

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
            .orange-50 { background-color: ${primaryColor}10 !important; }
            /* Update specific stat icons */
            .p-3.bg-orange-50 { background-color: ${primaryColor}15 !important; color: ${primaryColor} !important; }
        `;
    }

    // 2. Login Screen Branding
    const loginLogoImg = document.getElementById('login-logo-img');
    const loginLogoIcon = document.getElementById('login-logo-icon');
    const loginBtn = document.getElementById('btn-login');

    if (b.logoUrl && loginLogoImg) {
        loginLogoImg.src = b.logoUrl;
        loginLogoImg.classList.remove('hidden');
        if (loginLogoIcon) loginLogoIcon.classList.add('hidden');
    }

    if (loginBtn) {
        loginBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`;
        loginBtn.classList.add('text-white', 'shadow-lg');
    }

    // 3. Full Portal Branding (if not loginOnly)
    if (!loginOnly) {
        // App Title / Brand Name
        const brandTitle = document.getElementById('portal-brand-title');
        if (brandTitle) {
            brandTitle.innerHTML = brandName.replace(' ', ' <span class="text-brand-500">') + (brandName.includes(' ') ? '</span>' : '');
        }

        // Sidebar Logo
        const logoImg = document.getElementById('logo-img');
        const logoIcon = document.getElementById('logo-icon');
        if (b.logoUrl && logoImg) {
            logoImg.src = b.logoUrl;
            logoImg.classList.remove('hidden');
            if (logoIcon) logoIcon.classList.add('hidden');
        }

        // Favicon
        if (b.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = b.faviconUrl;
        }

        // Title Tag
        document.title = `${brandName} | Portal do Franqueado`;
    }
}
