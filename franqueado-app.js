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
    'Coral': { bg: 'linear-gradient(to right, #ef4444, #000000)', text: '#FFFFFF', border: '#000000' },
    'Vermelha': { bg: '#ef4444', text: '#FFFFFF', border: '#991b1b' }
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
                          style="background: ${beltStyle.bg}; color: ${beltStyle.text}; border: 1px solid ${beltStyle.border};">
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
                        <span class="font-bold text-slate-800">${t.name}</span>
                        <div class="mt-1">
                            <span class="inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border" 
                                  style="background: ${beltStyle.bg}; color: ${beltStyle.text}; border-color: ${beltStyle.border};">
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
                    <div class="flex justify-end gap-2">
                        <button class="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition flex items-center justify-center">
                            <i class="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button class="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center">
                            <i class="fa-solid fa-trash text-[10px]"></i>
                        </button>
                    </div>
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

window.openTeacherModal = () => {
    alert('Funcionalidade de adicionar professor será implementada em breve.');
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
