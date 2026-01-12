// ===== FRANCHISEE METRICS WIDGET =====
registerWidget({
    id: 'franchisee-metrics',
    name: 'Painel Financeiro',
    description: 'Visão executiva: alunos, receita, ticket médio e repasse matriz',
    size: 'col-span-12',
    category: 'Métricas',
    icon: 'fa-solid fa-chart-line',

    render: function (container) {
        container.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div class="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Meus Alunos</p>
                        <div class="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>
                    <h3 id="widget-stat-students" class="text-2xl font-black text-slate-900">--</h3>
                    <p class="text-[9px] text-green-500 font-bold mt-1 flex items-center gap-1">
                        <i class="fa-solid fa-arrow-up"></i> 12% este mês
                    </p>
                </div>

                <div class="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Professores</p>
                        <div class="w-7 h-7 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-graduation-cap"></i>
                        </div>
                    </div>
                    <h3 id="widget-stat-teachers" class="text-2xl font-black text-slate-900">--</h3>
                    <p class="text-[9px] text-slate-400 font-bold mt-1">Corpo Docente</p>
                </div>
                
                <div class="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Receita Mensal</p>
                        <div class="w-7 h-7 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-wallet"></i>
                        </div>
                    </div>
                    <h3 id="widget-stat-revenue" class="text-2xl font-black text-slate-900">R$ --</h3>
                    <p class="text-[9px] text-slate-400 font-bold mt-1">Deste mês</p>
                </div>
                
                <div class="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Ticket Médio</p>
                        <div class="w-7 h-7 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-chart-line"></i>
                        </div>
                    </div>
                    <h3 id="widget-stat-ticket" class="text-2xl font-black text-slate-900">R$ --</h3>
                    <p class="text-[9px] text-slate-400 font-bold mt-1">Média por aluno</p>
                </div>
                
                <div class="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-wider" id="widget-label-royalties">Repasse Matriz</p>
                        <div class="w-7 h-7 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-hand-holding-dollar"></i>
                        </div>
                    </div>
                    <h3 id="widget-stat-royalties" class="text-2xl font-black text-slate-900">R$ --</h3>
                    <p class="text-[9px] text-slate-400 font-bold mt-1">Vencimento: 05/Próx</p>
                </div>
            </div>
        `;

        this.update();
    },

    update: function () {
        // Metrics are updated by franchise-client.js updateStats function,
        // but we handle the growth percentage here if myMetrics available
        const elGrowthLabel = document.querySelector('#widget-stat-students + p');
        if (elGrowthLabel && typeof myMetrics !== 'undefined' && myMetrics.length >= 2) {
            const sorted = [...myMetrics].sort((a, b) => b.period.localeCompare(a.period));
            const current = sorted[0].students.total;
            const previous = sorted[1].students.total;
            const diff = current - previous;
            const pct = previous > 0 ? Math.round((diff / previous) * 100) : 0;
            const isPositive = pct >= 0;

            elGrowthLabel.className = `text-[9px] font-bold mt-1 flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`;
            elGrowthLabel.innerHTML = `<i class="fa-solid ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> ${Math.abs(pct)}% este mês`;
        } else if (elGrowthLabel) {
            elGrowthLabel.innerHTML = `<i class="fa-solid fa-minus"></i> 0% este mês`;
            elGrowthLabel.className = `text-[9px] font-bold mt-1 flex items-center gap-1 text-slate-400`;
        }
    }
});

// ===== FRANCHISEE PERFORMANCE CHART WIDGET =====
registerWidget({
    id: 'franchisee-performance',
    name: 'Evolução da Unidade',
    description: 'Acompanhamento histórico de faturamento e alunos',
    size: 'col-span-12',
    category: 'Analytics',
    icon: 'fa-solid fa-chart-line',

    render: function (container) {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-3xl border border-slate-100 h-64 md:h-80 shadow-sm">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <i class="fa-solid fa-chart-area text-orange-500 text-xs"></i> Performance Histórica
                    </h3>
                    <div class="flex bg-slate-50 rounded-xl p-1 border border-slate-100 w-full sm:w-auto">
                        <button onclick="toggleFranchiseeChart('financial')" id="btn-chart-fin" 
                            class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-bold bg-white shadow-sm text-orange-600 transition-all">
                            Receita
                        </button>
                        <button onclick="toggleFranchiseeChart('students')" id="btn-chart-std" 
                            class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-bold text-slate-500 hover:text-slate-700 transition-all">
                            Alunos
                        </button>
                    </div>
                </div>
                <div class="h-40 md:h-52 relative">
                    <canvas id="franchisee-performance-chart"></canvas>
                </div>
            </div>
        `;
        this.update();
    },

    update: function () {
        setTimeout(() => {
            const canvas = document.getElementById('franchisee-performance-chart');
            if (canvas && typeof Chart !== 'undefined' && typeof myMetrics !== 'undefined') {
                if (window.franchiseeChartInstance) window.franchiseeChartInstance.destroy();
                if (myMetrics.length === 0) return;

                const ctx = canvas.getContext('2d');
                const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

                // Sort metrics by period
                const sortedMetrics = [...myMetrics].sort((a, b) => a.period.localeCompare(b.period));

                const labels = sortedMetrics.map(m => {
                    const [year, month] = m.period.split('-');
                    return monthNames[parseInt(month) - 1];
                });

                const currentType = window.currentFranchiseeChartType || 'financial';
                const data = currentType === 'financial'
                    ? sortedMetrics.map(m => m.finance.revenue)
                    : sortedMetrics.map(m => m.students.total);

                const color = currentType === 'financial' ? '#FF6B00' : '#6366f1';
                const bgColor = currentType === 'financial' ? 'rgba(255, 107, 0, 0.1)' : 'rgba(99, 102, 241, 0.1)';

                window.franchiseeChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: currentType === 'financial' ? 'Receita (R$)' : 'Alunos',
                            data: data,
                            borderColor: color,
                            backgroundColor: bgColor,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: color,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#1e293b',
                                titleFont: { size: 10 },
                                bodyFont: { size: 12, weight: 'bold' },
                                padding: 12,
                                callbacks: {
                                    label: (context) => {
                                        if (currentType === 'financial') {
                                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                        }
                                        return context.parsed.y + ' alunos';
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                grid: { color: '#f8fafc' },
                                ticks: { font: { size: 9 }, color: '#94a3b8' }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { font: { size: 9 }, color: '#94a3b8' }
                            }
                        }
                    }
                });
            }
        }, 100);
    }
});

window.toggleFranchiseeChart = function (type) {
    window.currentFranchiseeChartType = type;
    const btnFin = document.getElementById('btn-chart-fin');
    const btnStd = document.getElementById('btn-chart-std');

    if (type === 'financial') {
        if (btnFin) btnFin.classList.add('bg-white', 'shadow-sm', 'text-orange-600');
        if (btnFin) btnFin.classList.remove('text-slate-500');
        if (btnStd) btnStd.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
        if (btnStd) btnStd.classList.add('text-slate-500');
    } else {
        if (btnStd) btnStd.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
        if (btnStd) btnStd.classList.remove('text-slate-500');
        if (btnFin) btnFin.classList.remove('bg-white', 'shadow-sm', 'text-orange-600');
        if (btnFin) btnFin.classList.add('text-slate-500');
    }

    if (typeof WIDGET_REGISTRY !== 'undefined') {
        const widget = WIDGET_REGISTRY['franchisee-performance'];
        if (widget && typeof widget.update === 'function') widget.update();
    }
};

// ===== STUDENTS LIST WIDGET =====
registerWidget({
    id: 'franchisee-students-list',
    name: 'Alunos Registrados',
    description: 'Lista completa de alunos com filtros e gerenciamento',
    size: 'col-span-12',
    category: 'Gestão',
    icon: 'fa-solid fa-users',

    render: function (container) {
        container.innerHTML = `
            <div class="flex justify-end mb-6">
                <button onclick="openStudentModal()"
                    class="text-[9px] font-bold text-white orange-gradient px-4 py-2 rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-2 uppercase">
                    <i class="fa-solid fa-user-plus"></i> Novo Aluno
                </button>
            </div>

            <!-- FILTROS -->
            <div class="flex flex-col md:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" id="filter-search" oninput="if(typeof resetStudentPage === 'function') resetStudentPage(); renderStudents()"
                        placeholder="Buscar por nome..."
                        class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                </div>
                <div class="flex gap-2">
                    <select id="filter-belt" onchange="if(typeof resetStudentPage === 'function') resetStudentPage(); renderStudents()"
                        class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="Todas">Todas as Faixas</option>
                        <option value="Branca">Branca</option>
                        <option value="Cinza">Cinza</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Laranja">Laranja</option>
                        <option value="Verde">Verde</option>
                        <option value="Azul">Azul</option>
                        <option value="Roxa">Roxa</option>
                        <option value="Marrom">Marrom</option>
                        <option value="Preta">Preta</option>
                        <option value="Coral">Coral</option>
                        <option value="Vermelha">Vermelha</option>
                    </select>
                    <select id="filter-degree" onchange="if(typeof resetStudentPage === 'function') resetStudentPage(); renderStudents()"
                        class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">Todos os Graus</option>
                        <option>Nenhum</option>
                        <option>1º Grau</option>
                        <option>2º Grau</option>
                        <option>3º Grau</option>
                        <option>4º Grau</option>
                        <option>5º Grau</option>
                        <option>6º Grau</option>
                        <option>7º Grau</option>
                        <option>8º Grau</option>
                        <option>9º Grau</option>
                        <option>10º Grau</option>
                    </select>
                    <select id="filter-fee" onchange="if(typeof resetStudentPage === 'function') resetStudentPage(); renderStudents()"
                        class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="Todos">Financeiro</option>
                        <option value="Paga">Paga</option>
                        <option value="Atrasada">Atrasada</option>
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th class="pb-4 px-2 sortable group" onclick="setSort('name')" id="th-name">
                                Aluno / Faixa <i class="fa-solid fa-sort sort-icon group-hover:text-orange-500 transition-colors"></i>
                            </th>
                            <th class="pb-4 px-2 sortable group" onclick="setSort('phone')" id="th-phone">
                                Contato <i class="fa-solid fa-sort sort-icon group-hover:text-orange-500 transition-colors"></i>
                            </th>
                            <th class="pb-4 px-2 sortable group" onclick="setSort('monthlyFee')" id="th-monthlyFee">
                                Mensalidade <i class="fa-solid fa-sort sort-icon group-hover:text-orange-500 transition-colors"></i>
                            </th>
                            <th class="pb-4 px-2 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="students-table-body" class="text-xs">
                        <!-- Students rendered via JS -->
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination Container -->
            <div id="students-pagination"></div>
        `;

        this.update();
    },

    update: function () {
        if (typeof renderStudents === 'function') {
            renderStudents();
        }
    }
});

// ===== TEACHERS LIST WIDGET =====
registerWidget({
    id: 'franchisee-teachers-list',
    name: 'Lista de Professores da Unidade',
    description: 'Gerenciamento de professores e instrutores da unidade',
    size: 'col-span-12',
    category: 'Gestão',
    icon: 'fa-solid fa-graduation-cap',

    render: function (container) {
        container.innerHTML = `
            <div class="flex justify-end mb-6">
                <button onclick="openTeacherModal()"
                    class="text-[9px] font-bold text-white orange-gradient px-4 py-2 rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-2 uppercase">
                    <i class="fa-solid fa-plus"></i> Novo Professor
                </button>
            </div>

            <!-- FILTROS -->
            <div class="flex flex-col md:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" id="filter-teacher-search" oninput="renderTeachers()"
                        placeholder="Buscar por nome..."
                        class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                </div>
                <div class="flex gap-2">
                    <select id="filter-teacher-belt" onchange="renderTeachers()"
                        class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="Todas">Todas as Faixas</option>
                        <option value="Roxa">Roxa</option>
                        <option value="Marrom">Marrom</option>
                        <option value="Preta">Preta</option>
                        <option value="Coral">Coral</option>
                        <option value="Vermelha">Vermelha</option>
                    </select>
                    <select id="filter-teacher-degree" onchange="renderTeachers()"
                        class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">Todos os Graus</option>
                        <option>Nenhum</option>
                        <option>1º Grau</option>
                        <option>2º Grau</option>
                        <option>3º Grau</option>
                        <option>4º Grau</option>
                        <option>5º Grau</option>
                        <option>6º Grau</option>
                        <option>7º Grau</option>
                        <option>8º Grau</option>
                        <option>9º Grau</option>
                        <option>10º Grau</option>
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th class="pb-4 px-2">Professor / Faixa</th>
                            <th class="pb-4 px-2">Gênero</th>
                            <th class="pb-4 px-2">Telefone</th>
                            <th class="pb-4 px-2">Endereço</th>
                            <th class="pb-4 px-2 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="teachers-table-body" class="text-xs">
                        <!-- Teachers rendered via JS -->
                    </tbody>
                </table>
            </div>
        `;

        this.update();
    },

    update: function () {
        if (typeof renderTeachers === 'function') {
            renderTeachers();
        }
    }
});

// ===== FRANCHISEE AI AUDITOR WIDGET =====
registerWidget({
    id: 'franchisee-ai-auditor',
    name: 'Auditor Empresarial IA',
    description: 'Insights estratégicos personalizados para sua unidade',
    size: 'col-span-12',
    category: 'IA',
    icon: 'fa-solid fa-brain',

    render: function (container) {
        container.innerHTML = `
            <div class="relative overflow-hidden h-full flex flex-col">
                <div class="flex justify-end mb-4 relative z-10">
                    <button onclick="listenToAudit()" id="btn-audio"
                        class="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                        <i class="fa-solid fa-volume-high text-xs"></i>
                    </button>
                </div>
                <div id="ai-insight-content"
                    class="flex-1 text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 overflow-y-auto max-h-[300px] relative z-10 text-[11px] leading-relaxed custom-scrollbar">
                    <div class="flex flex-col items-center justify-center h-full py-8 text-slate-400 italic">
                        <i class="fa-solid fa-circle-notch animate-spin mb-2 text-orange-500"></i>
                        <span class="animate-pulse">Conectando...</span>
                    </div>
                </div>
                <div class="mt-4">
                    <button onclick="runAiAnalysis(true)"
                        class="w-full py-2 text-[10px] font-bold uppercase rounded-xl border border-slate-200 hover:border-orange-500 text-slate-500 hover:text-orange-500 transition-all">
                        <i class="fa-solid fa-rotate mr-1"></i> Atualizar
                    </button>
                </div>
            </div>
        `;

        // Automatically trigger AI analysis on load
        setTimeout(() => {
            if (typeof runAiAnalysis === 'function') {
                runAiAnalysis();
            }
        }, 800);
    },

    update: function () {
        // Optional
    }
});

// ===== ACADEMY SETTINGS WIDGET =====
registerWidget({
    id: 'franchisee-settings',
    name: 'Dados da Academia',
    description: 'Configurações e informações da sua unidade',
    size: 'col-span-12',
    category: 'Configurações',
    icon: 'fa-solid fa-pen-to-square',

    render: function (container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block required-label">Nome da Academia</label>
                        <input type="text" id="edit-gym-name" class="input-field" placeholder="Ex: Arena Matriz" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block required-label">Professor Responsável</label>
                        <input type="text" id="edit-gym-owner" class="input-field" placeholder="Ex: Mestre Carlos" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block required-label">Telefone</label>
                        <input type="text" id="edit-gym-phone" class="input-field" placeholder="(00) 00000-0000" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block required-label">Endereço</label>
                        <input type="text" id="edit-gym-address" class="input-field" placeholder="Endereço" required>
                    </div>
                </div>
                <!-- Extra Row for Royalties and Expenses -->
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
                     <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Repasse / Royalties (%)</label>
                        <input type="number" id="edit-gym-royalty" class="input-field" min="0" max="100" step="0.1" placeholder="Ex: 5">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Despesas Mensais (R$)</label>
                        <input type="number" id="edit-gym-expenses" class="input-field" min="0" step="0.01" placeholder="Ex: 5000.00">
                    </div>
                </div>
                <div class="flex justify-end pt-2">
                    <button onclick="updateGymSettings()" id="btn-update-settings"
                        class="px-8 py-3 orange-gradient text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all">
                        <i class="fa-solid fa-floppy-disk"></i> Salvar Alterações
                    </button>
                </div>
            </div>
        `;

        this.update();
    },

    update: function () {
        // Populate fields with current franchise data
        if (typeof currentFranchise !== 'undefined' && currentFranchise) {
            const nameField = document.getElementById('edit-gym-name');
            const ownerField = document.getElementById('edit-gym-owner');
            const phoneField = document.getElementById('edit-gym-phone');
            const addressField = document.getElementById('edit-gym-address');

            if (nameField) nameField.value = currentFranchise.name || '';
            if (ownerField) ownerField.value = currentFranchise.owner || '';
            if (phoneField) phoneField.value = currentFranchise.phone || '';
            if (addressField) addressField.value = currentFranchise.address || '';

            const royaltyField = document.getElementById('edit-gym-royalty');
            if (royaltyField) {
                royaltyField.value = currentFranchise.royaltyPercent || 5;
            }

            const expensesField = document.getElementById('edit-gym-expenses');
            if (expensesField) {
                expensesField.value = currentFranchise.expenses || 0;
            }
        }
    }
});

// ===== DIRECTIVES WIDGET =====
registerWidget({
    id: 'franchisee-directives',
    name: 'Diretrizes da Matriz',
    description: 'Comunicados oficiais e diretrizes do HQ',
    size: 'col-span-12',
    category: 'Comunicação',
    icon: 'fa-solid fa-bullhorn',

    render: function (container) {
        container.innerHTML = `
            <div class="bg-white rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col overflow-hidden">
                <div class="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                            <i class="fa-solid fa-bullhorn text-orange-500 text-xs"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-xs text-slate-700">Diretrizes da Matriz</h3>
                            <p class="text-[9px] text-slate-400 uppercase tracking-wider">Comunicação Oficial</p>
                        </div>
                    </div>
                    <button onclick="refreshDirectives()" class="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-200 transition-all" title="Atualizar">
                        <i class="fa-solid fa-rotate text-slate-400 hover:text-orange-500 text-xs"></i>
                    </button>
                </div>

                <div id="directives-feed" class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 no-scrollbar">
                    <div class="flex justify-center py-10">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                </div>
            </div>
        `;

        this.update();
    },

    update: function () {
        loadAndRenderDirectives();
    }
});

// Function to load and render directives
async function loadAndRenderDirectives() {
    const container = document.getElementById('directives-feed');
    if (!container) return;

    try {
        // Show loading state
        container.innerHTML = `
            <div class="flex justify-center py-10">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        `;

        // Fetch directives from backend
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api/v1');
        const response = await fetch(`${apiUrl}/directives?limit=10&status=published`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 text-center">
                    <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-inbox text-slate-300 text-2xl"></i>
                    </div>
                    <p class="text-sm text-slate-400 font-medium">Nenhuma diretriz publicada</p>
                    <p class="text-xs text-slate-300 mt-1">Aguardando comunicados da matriz</p>
                </div>
            `;
            return;
        }

        const directives = data.data;

        // Render directives
        container.innerHTML = directives.map(directive => {
            // Parse the text field to extract subject and body
            let subject = 'Comunicado';
            let body = directive.text || '';

            const lines = directive.text.split('\n');
            if (lines[0].startsWith('**') && lines[0].endsWith('**')) {
                subject = lines[0].replace(/\*\*/g, '');
                body = lines.slice(2).join('\n');
            }

            // Priority badge color
            let priorityColor = 'orange';
            let priorityLabel = 'Normal';
            if (directive.priority === 'urgent') {
                priorityColor = 'red';
                priorityLabel = 'Urgente';
            } else if (directive.priority === 'high') {
                priorityColor = 'orange';
                priorityLabel = 'Alta';
            } else if (directive.priority === 'low') {
                priorityColor = 'blue';
                priorityLabel = 'Baixa';
            }

            const date = new Date(directive.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            const author = directive.author?.name || 'Matriz';

            return `
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-bold uppercase tracking-widest text-${priorityColor}-600 bg-${priorityColor}-50 px-2 py-1 rounded-lg border border-${priorityColor}-100">
                                ${author}
                            </span>
                            ${directive.priority !== 'medium' ? `
                                <span class="text-[8px] font-bold uppercase tracking-wider text-${priorityColor}-500 bg-${priorityColor}-50 px-1.5 py-0.5 rounded border border-${priorityColor}-200">
                                    ${priorityLabel}
                                </span>
                            ` : ''}
                        </div>
                        <span class="text-[10px] text-slate-400">${date}</span>
                    </div>
                    <h4 class="font-bold text-slate-800 text-sm mb-1 group-hover:text-orange-600 transition-colors">${subject}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">${body}</p>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading directives:', error);
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-center">
                <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-3">
                    <i class="fa-solid fa-exclamation-triangle text-red-400 text-2xl"></i>
                </div>
                <p class="text-sm text-red-500 font-medium">Erro ao carregar diretrizes</p>
                <p class="text-xs text-slate-400 mt-1">${error.message}</p>
                <button onclick="refreshDirectives()" class="mt-4 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-all">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Refresh directives function
window.refreshDirectives = function () {
    loadAndRenderDirectives();
};

console.log('✅ Franchisee Widgets loaded');
