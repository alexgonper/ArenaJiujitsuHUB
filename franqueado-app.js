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
    'Coral': { bg: 'none', text: 'transparent', border: '#EE1111', extra: 'background-image: linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 25%, #000000 25%, #000000 50%, #FFFFFF 50%, #FFFFFF 75%, #000000 75%, #000000 100%), linear-gradient(90deg, #EE1111 0%, #EE1111 25%, #FFFFFF 25%, #FFFFFF 50%, #EE1111 50%, #EE1111 75%, #FFFFFF 75%, #FFFFFF 100%); background-clip: text, padding-box; -webkit-background-clip: text, padding-box; font-weight: 900; position: relative;' },
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

    // Enable Login Button
    const btn = document.getElementById('btn-login');
    btn.disabled = false;
    btn.classList.remove('bg-slate-200', 'text-slate-400');
    btn.classList.add('orange-gradient', 'text-white', 'shadow-lg', 'hover:scale-[1.02]');
    btn.innerText = `Acessar ${currentUnit.name}`;
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
    location.reload();
};

async function loadDashboard(unit) {
    // Set Header Info
    document.getElementById('unit-name-display').textContent = unit.name;
    document.getElementById('unit-avatar').textContent = unit.name.charAt(6) || unit.name.charAt(0);

    // Set Stats
    document.getElementById('stat-students').textContent = unit.students || 0;
    document.getElementById('stat-revenue').textContent = `R$ ${(unit.revenue || 0).toLocaleString()}`;

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
            alert('Por favor, preencha o nome, data de nascimento e verifique sua conexão.');
            return;
        }

        try {
            if (id) {
                await TeacherAPI.update(id, body);
            } else {
                await TeacherAPI.create(body);
            }
            document.getElementById('teacher-modal-overlay').remove();
            renderTeachersList();
        } catch (error) {
            console.error('Error saving teacher:', error);
            alert('ERRO: Verifique se todos os campos obrigatórios (*) foram preenchidos corretamente.');
        }
    };
};

window.deleteTeacher = async (id) => {
    if (confirm('Tem certeza que deseja excluir este professor?')) {
        try {
            await TeacherAPI.delete(id);
            renderTeachersList();
        } catch (error) {
            alert('Erro ao excluir professor');
        }
    }
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
        'financial': 'Financeiro',
        'matrix': 'Matrix Hub'
    };
    document.getElementById('page-title').textContent = titles[tabId] || 'Portal do Franqueado';

    if (tabId === 'teachers') {
        renderTeachersList();
    }
};
