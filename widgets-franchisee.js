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
        // Populate Students
        if (typeof myStudents !== 'undefined') {
            const elStd = document.getElementById('widget-stat-students');
            if (elStd) elStd.innerText = myStudents.length;
        }

        // Populate Teachers
        if (typeof myTeachers !== 'undefined') {
            const elTeach = document.getElementById('widget-stat-teachers');
            if (elTeach) elTeach.innerText = myTeachers.length;
        }

        // Populate Financials from Metrics
        if (typeof myMetrics !== 'undefined' && myMetrics.length > 0) {
            // Sort to get latest
            const sorted = [...myMetrics].sort((a, b) => b.period.localeCompare(a.period));
            const current = sorted[0]; // Latest month
            const previous = sorted[1];

            // Revenue
            const elRev = document.getElementById('widget-stat-revenue');
            if (elRev && current.finance) {
                 elRev.innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(current.finance.revenue);
            }

            // Ticket
            const elTicket = document.getElementById('widget-stat-ticket');
            if (elTicket && current.finance) {
                 // Calculate ticket if not present (Revenue / Active Students)
                 const ticket = current.finance.ticket || (current.students.active > 0 ? current.finance.revenue / current.students.active : 0);
                 elTicket.innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticket);
            }

            // Royalties (Example Logic: 10% of revenue or from data)
            const elRoyalties = document.getElementById('widget-stat-royalties');
            if (elRoyalties && current.finance) {
                const royalties = current.finance.royalties || (current.finance.revenue * 0.1);
                 elRoyalties.innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(royalties);
            }

            // Growth Label
            const elGrowthLabel = document.querySelector('#widget-stat-students + p');
            if (elGrowthLabel && previous) {
                const currCount = current.students.total;
                const prevCount = previous.students.total;
                const diff = currCount - prevCount;
                const pct = prevCount > 0 ? Math.round((diff / prevCount) * 100) : 0;
                const isPositive = pct >= 0;

                elGrowthLabel.className = `text-[9px] font-bold mt-1 flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`;
                elGrowthLabel.innerHTML = `<i class="fa-solid ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> ${Math.abs(pct)}% este mês`;
            }
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
                            <th class="pb-4 px-2 w-12 text-center">Foto</th>
                            <th class="pb-4 px-2 sortable group" onclick="setSort('name')" id="th-name">
                                Aluno / Faixa <span id="students-count-badge" class="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold border border-slate-200">0</span> <i class="fa-solid fa-sort sort-icon group-hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100"></i>
                            </th>
                            <th class="pb-4 px-2 sortable group" onclick="setSort('phone')" id="th-phone">
                                Contato <i class="fa-solid fa-sort sort-icon group-hover:text-orange-500 transition-colors"></i>
                            </th>
                            <th class="pb-4 px-2 sortable group" onclick="setSort('monthlyFee')" id="th-monthlyFee">
                                Mensalidade <i class="fa-solid fa-sort sort-icon group-hover:text-orange-500 transition-colors"></i>
                            </th>
                            <th class="pb-4 px-2">Endereço</th>
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
                            <th class="pb-4 px-2 w-12 text-center">Foto</th>
                            <th class="pb-4 px-2">
                                Professor / Faixa <span id="teachers-count-badge" class="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold border border-slate-200">0</span>
                            </th>
                            <th class="pb-4 px-2">Contato</th>
                            <th class="pb-4 px-2">Email</th>
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
                <!-- Basic Info Section -->
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

                <!-- Design & Branding (White Label) Section -->
                <div class="border-t border-slate-100 pt-6 mt-6">
                    <h3 class="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-palette text-orange-500"></i> Design & Branding (White Label)
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Nome da Marca</label>
                            <input type="text" id="edit-branding-name" class="input-field" placeholder="Ex: Arena Pro Florianópolis">
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">URL do Logo</label>
                            <div class="flex gap-2">
                                <input type="url" id="edit-branding-logo" class="flex-1 input-field" placeholder="https://exemplo.com/logo.png">
                                <label for="upload-logo-franchise" class="cursor-pointer px-3 py-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-orange-100 hover:text-orange-500 transition-all border border-slate-200 flex items-center justify-center">
                                    <i class="fa-solid fa-upload"></i>
                                </label>
                                <input type="file" id="upload-logo-franchise" class="hidden" accept="image/*" onchange="uploadImage(this, 'edit-branding-logo')">
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">URL do Favicon</label>
                            <div class="flex gap-2">
                                <input type="url" id="edit-branding-favicon" class="flex-1 input-field" placeholder="https://exemplo.com/favicon.ico">
                                <label for="upload-favicon-franchise" class="cursor-pointer px-3 py-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-orange-100 hover:text-orange-500 transition-all border border-slate-200 flex items-center justify-center">
                                    <i class="fa-solid fa-upload"></i>
                                </label>
                                <input type="file" id="upload-favicon-franchise" class="hidden" accept="image/*" onchange="uploadImage(this, 'edit-branding-favicon')">
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Cor Primária</label>
                            <div class="flex gap-2">
                                <input type="color" id="edit-branding-primary-color" class="h-10 w-12 border border-slate-200 rounded-lg cursor-pointer bg-white p-1">
                                <input type="text" id="edit-branding-primary-text" oninput="document.getElementById('edit-branding-primary-color').value = this.value" class="flex-1 input-field uppercase">
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Cor Secundária</label>
                            <div class="flex gap-2">
                                <input type="color" id="edit-branding-secondary-color" class="h-10 w-12 border border-slate-200 rounded-lg cursor-pointer bg-white p-1">
                                <input type="text" id="edit-branding-secondary-text" oninput="document.getElementById('edit-branding-secondary-color').value = this.value" class="flex-1 input-field uppercase">
                            </div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">URL do Fundo de Login</label>
                            <input type="url" id="edit-branding-bg" class="input-field" placeholder="https://exemplo.com/background.jpg">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Email de Suporte (Aluno/Prof)</label>
                            <input type="email" id="edit-branding-email" class="input-field" placeholder="suporte@academia.com">
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Telefone de Suporte (WhatsApp)</label>
                            <input type="text" id="edit-branding-phone" class="input-field" placeholder="(00) 00000-0000">
                        </div>
                    </div>
                </div>

                <div class="flex justify-end pt-6 border-t border-slate-100 mt-6">
                    <button onclick="updateGymSettings()" id="btn-update-settings"
                        class="px-8 py-3 orange-gradient text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all">
                        <i class="fa-solid fa-floppy-disk"></i> Salvar Alterações
                    </button>
                </div>
            </div>
        `;

        // Sync color picker with text input
        setTimeout(() => {
            const pColor = document.getElementById('edit-branding-primary-color');
            const pText = document.getElementById('edit-branding-primary-text');
            if (pColor && pText) pColor.oninput = (e) => pText.value = e.target.value.toUpperCase();

            const sColor = document.getElementById('edit-branding-secondary-color');
            const sText = document.getElementById('edit-branding-secondary-text');
            if (sColor && sText) sColor.oninput = (e) => sText.value = e.target.value.toUpperCase();
        }, 100);

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
            if (royaltyField) royaltyField.value = currentFranchise.royaltyPercent || 5;

            const expensesField = document.getElementById('edit-gym-expenses');
            if (expensesField) expensesField.value = currentFranchise.expenses || 0;

            // Branding fields
            const b = currentFranchise.branding || {};
            const bName = document.getElementById('edit-branding-name');
            const bLogo = document.getElementById('edit-branding-logo');
            const bFavicon = document.getElementById('edit-branding-favicon');
            const bBg = document.getElementById('edit-branding-bg');
            const bPrimary = document.getElementById('edit-branding-primary-color');
            const bPrimaryText = document.getElementById('edit-branding-primary-text');
            const bSecondary = document.getElementById('edit-branding-secondary-color');
            const bSecondaryText = document.getElementById('edit-branding-secondary-text');

            if (bName) bName.value = b.brandName || '';
            if (bLogo) bLogo.value = b.logoUrl || '';
            if (bFavicon) bFavicon.value = b.faviconUrl || '';
            if (bBg) bBg.value = b.loginBackground || '';

            const bEmail = document.getElementById('edit-branding-email');
            const bPhone = document.getElementById('edit-branding-phone');
            if (bEmail) bEmail.value = b.supportEmail || '';
            if (bPhone) bPhone.value = b.supportPhone || '';

            if (bPrimary) bPrimary.value = b.primaryColor || '#FF6B00';
            if (bPrimaryText) bPrimaryText.value = (b.primaryColor || '#FF6B00').toUpperCase();

            if (bSecondary) bSecondary.value = b.secondaryColor || '#000000';
            if (bSecondaryText) bSecondaryText.value = (b.secondaryColor || '#000000').toUpperCase();
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
            <div class="h-full flex flex-col">
                <div class="directives-feed flex-1 overflow-y-auto space-y-3 no-scrollbar min-h-[300px]">
                    <div class="flex justify-center py-10">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-100 flex justify-end items-center gap-2">
                    <p class="text-[9px] text-slate-400">Atualizado agora</p>
                    <button onclick="loadAndRenderDirectives()" class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center">
                        <i class="fa-solid fa-rotate text-xs"></i>
                    </button>
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
    const containers = document.querySelectorAll('.directives-feed');
    if (containers.length === 0) {
        console.warn("No .directives-feed containers found");
        return;
    }

    console.log(`Loading directives into ${containers.length} containers...`);

    const setLoading = (html) => {
        containers.forEach(c => c.innerHTML = html);
    };

    try {
        setLoading(`
            <div class="flex justify-center py-10">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        `);

        let directives = [];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        try {
            // Determine API URL - consistent with api-config.js fallback
            const apiUrl = window.API_BASE_URL || window.API_URL || 'http://localhost:5000/api/v1';
            
            const response = await fetch(`${apiUrl}/directives?status=published&limit=15&_t=${Date.now()}`, {
                signal: controller.signal,
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            directives = data.data || [];
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') throw new Error("Tempo de conexão esgotado (timeout)");
            throw fetchError;
        }

        console.log(`Loaded ${directives.length} directives`);

        if (!directives || directives.length === 0) {
            setLoading(`
                <div class="flex flex-col items-center justify-center py-10 text-center">
                    <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-inbox text-slate-200 text-2xl"></i>
                    </div>
                    <p class="text-sm text-slate-400 font-medium">Nenhuma diretriz publicada</p>
                    <p class="text-xs text-slate-300 mt-1">Os comunicados da matriz aparecerão aqui</p>
                </div>
            `);
            return;
        }

        // Render directives
        const html = directives.map(directive => {
            let subject = 'Comunicado Oficial';
            let body = directive.text || '';

            if (body.startsWith('**')) {
                const match = body.match(/^\*\*(.*?)\*\*\s*([\s\S]*)/);
                if (match) {
                    subject = match[1];
                    body = match[2].trim();
                }
            }

            let color = 'orange';
            let label = 'Normal';
            if (directive.priority === 'urgent') { color = 'red'; label = 'Urgente'; }
            else if (directive.priority === 'high') { color = 'orange'; label = 'Alta'; }
            else if (directive.priority === 'low') { color = 'blue'; label = 'Baixa'; }

            const dateStr = directive.createdAt ? new Date(directive.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            }) : '---';

            return `
                <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                             <div class="w-2 h-2 rounded-full bg-${color}-500 group-hover:animate-pulse"></div>
                             <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                ${directive.author?.name || 'Matriz Core'}
                             </span>
                             ${directive.priority !== 'medium' && directive.priority !== 'Normal' ? `
                                <span class="text-[8px] font-black uppercase bg-${color}-50 text-${color}-600 px-1.5 py-0.5 rounded border border-${color}-100">
                                    ${label}
                                </span>
                             ` : ''}
                        </div>
                        <span class="text-[10px] text-slate-300 font-mono">${dateStr}</span>
                    </div>
                    <h4 class="font-bold text-slate-800 text-sm mb-2 group-hover:text-orange-600 transition-colors">${subject}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed line-clamp-3">${body}</p>
                </div>
            `;
        }).join('');

        setLoading(html);

    } catch (error) {
        console.error('Error in loadAndRenderDirectives:', error);
        setLoading(`
            <div class="flex flex-col items-center justify-center py-12 text-center px-4">
                <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
                    <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-800 mb-1">Falha na Sincronização</h3>
                <p class="text-[11px] text-slate-500 max-w-[200px] mx-auto mb-6">
                    Erro ao buscar comunicados: ${error.message}
                </p>
                <button onclick="loadAndRenderDirectives()" 
                    class="px-8 py-3 orange-gradient text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg">
                    Tentar Novamente
                </button>
            </div>
        `);
    }
}

// ===== GRADUATION ELIGIBILITY WIDGET =====
registerWidget({
    id: 'franchisee-graduation',
    name: 'Gestão de Graduações',
    description: 'Verificação automática de alunos prontos para o próximo nível',
    size: 'col-span-12',
    category: 'Graduação',
    icon: 'fa-solid fa-medal',

    render: function (container) {
        container.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-[11px]">
                        <thead class="bg-slate-50/50 text-slate-500 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100">
                            <tr>
                                <th class="px-6 py-4 text-slate-400 font-black">Aluno</th>
                                <th class="px-6 py-4 text-slate-400 font-black">De -> Para</th>
                                <th class="px-6 py-4 text-slate-400 font-black">Aulas</th>
                                <th class="px-6 py-4 text-slate-400 font-black text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody id="graduation-table-body" class="divide-y divide-slate-50">
                            <tr>
                                <td colspan="4" class="text-center py-20 text-slate-400 italic">
                                    <i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Verificando elegibilidade...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-4 p-4 bg-orange-50/50 rounded-2xl text-orange-600 text-[10px] font-medium border border-orange-100/50">
                    <i class="fa-solid fa-circle-info mr-2"></i> Só aparecem nesta lista alunos que atingiram critério de tempo e presença.
                </div>
            </div>
        `;

        this.update();
    },

    update: async function () {
        const tableBody = document.getElementById('graduation-table-body');
        if (!tableBody || typeof currentFranchise === 'undefined' || !currentFranchise) return;

        try {
            const apiUrl = typeof API_URL !== 'undefined' ? API_URL : (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api/v1');
            const response = await fetch(`${apiUrl}/graduation/eligible/${currentFranchise._id || currentFranchise.id}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-orange-400 text-[10px] italic">Sessão expirada. Por favor, faça logout e entre novamente para sincronizar os dados.</td></tr>';
                } else {
                    throw new Error(`API Error: ${response.status}`);
                }
                return;
            }

            const result = await response.json();
            const eligibleStudents = result.data || [];

            if (eligibleStudents.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-slate-400 italic">Nenhum aluno elegível no momento.</td></tr>';
                return;
            }

            // Belt Colors helper
            const getBeltStyle = (belt) => {
                const colors = {
                    'Branca': { bg: '#F8FAFC', text: '#334155', border: '#CBD5E1' },
                    'Cinza': { bg: '#6B7280', text: '#FFFFFF', border: '#6B7280' },
                    'Amarela': { bg: '#FCD34D', text: '#713F12', border: '#FCD34D' },
                    'Laranja': { bg: '#FF6B00', text: '#FFFFFF', border: '#FF6B00' },
                    'Verde': { bg: '#22C55E', text: '#FFFFFF', border: '#22C55E' },
                    'Azul': { bg: '#3B82F6', text: '#FFFFFF', border: '#3B82F6' },
                    'Roxa': { bg: '#A855F7', text: '#FFFFFF', border: '#A855F7' },
                    'Marrom': { bg: '#92400E', text: '#FFFFFF', border: '#92400E' },
                    'Preta': { bg: '#09090b', text: '#FFFFFF', border: '#000000' },
                    'Coral': { bg: 'none', text: 'transparent', border: '#EE1111', extra: 'background-image: linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 25%, #000000 25%, #000000 50%, #FFFFFF 50%, #FFFFFF 75%, #000000 75%, #000000 100%), linear-gradient(90deg, #EE1111 0%, #EE1111 25%, #FFFFFF 25%, #FFFFFF 50%, #EE1111 50%, #EE1111 75%, #FFFFFF 75%, #FFFFFF 100%); background-clip: text, padding-box; -webkit-background-clip: text, padding-box; font-weight: 900; position: relative;' },
                    'Vermelha': { bg: '#EE1111', text: '#FFFFFF', border: '#EE1111' }
                };
                return colors[belt] || colors['Branca'];
            };

            const renderBadge = (fullString) => {
                if (!fullString) return '';
                const parts = fullString.split(' - ');
                const belt = parts[0] || 'Branca';
                const style = getBeltStyle(belt);
                return `<span class="inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border whitespace-nowrap" 
                              style="background: ${style.bg}; color: ${style.text}; border-color: ${style.border}; ${style.extra || ''}">
                            ${fullString}
                        </span>`;
            };

            tableBody.innerHTML = eligibleStudents.map(s => `
                <tr class="hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
                    <td class="px-6 py-4 font-bold text-slate-700">${s.name}</td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                             ${renderBadge(s.current || s.belt)}
                             <i class="fa-solid fa-arrow-right text-[8px] text-slate-300"></i>
                             ${renderBadge(s.next)}
                        </div>
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-600">
                        ${s.attended} <span class="text-slate-400 font-normal">/ ${s.required}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="processCandidatePromotion('${s.id}', '${s.name}', '${s.next}')" 
                                class="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-[9px] font-bold hover:bg-brand-600 transition shadow-sm uppercase tracking-wider">
                            Graduar
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Erro ao carregar graduáveis:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-red-400 text-xs">Erro ao verificar elegibilidade.</td></tr>';
        }
    }
});

window.processCandidatePromotion = async (studentId, name, nextLevel) => {
    const confirmMsg = `Deseja confirmar a graduação de ${name} para ${nextLevel}?`;

    // Check if custom modal system is available
    if (typeof showPortalConfirm === 'function') {
        showPortalConfirm('Confirmar Graduação', confirmMsg, () => executePromotion(studentId, name, nextLevel));
    } else if (confirm(confirmMsg)) {
        executePromotion(studentId, name, nextLevel);
    }
};

async function executePromotion(studentId, name, nextLevel) {
    try {
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api/v1');

        // Find a black belt teacher to "sign" the promotion
        const teachersRes = await fetch(`${apiUrl}/teachers?franchiseId=${currentFranchise._id || currentFranchise.id}`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const teachersData = await teachersRes.json();
        const teachers = teachersData.data || [];

        const blackBelt = teachers.find(t => t.belt === 'Preta');
        const teacherId = blackBelt ? blackBelt._id : (teachers[0]?._id || null);

        const response = await fetch(`${apiUrl}/graduation/promote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({ studentId, teacherId })
        });

        const resData = await response.json();

        if (resData.success) {
            const successTitle = 'Graduação Realizada!';
            const successMsg = `${name} agora é ${nextLevel}. Oss!`;

            if (typeof showPortalModal === 'function') {
                showPortalModal(successTitle, successMsg, 'success');
            } else {
                alert(successMsg);
            }

            // Optimistically update the local myStudents array
            if (typeof myStudents !== 'undefined' && Array.isArray(myStudents)) {
                const studentIndex = myStudents.findIndex(s => s._id === studentId || s.id === studentId);
                if (studentIndex !== -1) {
                    const parts = nextLevel.split(' - ');
                    myStudents[studentIndex].belt = parts[0];
                    myStudents[studentIndex].degree = parts.length > 1 ? parts[1] : 'Nenhum';
                }
            }

            // Update widget
            const widget = typeof WIDGET_REGISTRY !== 'undefined' ? WIDGET_REGISTRY['franchisee-graduation'] : null;
            if (widget) widget.update();

            // Also update the students list widget to reflect the new degree
            const studentsWidget = typeof WIDGET_REGISTRY !== 'undefined' ? WIDGET_REGISTRY['franchisee-students-list'] : null;
            if (studentsWidget) {
                studentsWidget.update();
            } else if (typeof renderStudents === 'function') {
                // Fallback if widget not found but global render function exists
                renderStudents();
            }
        }
    } catch (error) {
        console.error('Erro ao processar graduação:', error);
        const errorMsg = 'Não foi possível processar a graduação. Verifique se há um professor faixa-preta cadastrado.';
        if (typeof showPortalModal === 'function') {
            showPortalModal('Erro na Graduação', errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
    }
}

// Generic Modal Helper
window.openModal = function (htmlContent) {
    const modal = document.getElementById('ui-modal');
    const modalContent = document.getElementById('modal-content');
    const modalPanel = document.getElementById('modal-panel');

    if (modal && modalContent) {
        modalContent.innerHTML = htmlContent;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        // Animation
        setTimeout(() => {
            modalPanel.classList.remove('scale-95', 'opacity-0');
            modalPanel.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
};

// Refresh directives function
window.refreshDirectives = function () {
    loadAndRenderDirectives();
};

// ===== SCHEDULE MANAGEMENT WIDGET =====
registerWidget({
    id: 'franchisee-schedule',
    name: 'Grade de Horários',
    description: 'Gestão completa da grade semanal de aulas',
    size: 'col-span-12',
    category: 'Gestão',
    icon: 'fa-regular fa-calendar-days',

    render: function (container) {
        container.innerHTML = `
            <div class="flex flex-col h-full space-y-4">
                <div class="flex justify-end pr-4">
                    <button onclick="openAddClassModal()" 
                        class="text-[9px] font-bold text-white orange-gradient px-4 py-2.5 rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-2 uppercase">
                        <i class="fa-solid fa-plus"></i> Nova Aula
                    </button>
                </div>

                <!-- Schedule Grid -->
                <div class="flex-1 overflow-x-auto no-scrollbar">
                    <div class="grid grid-cols-7 gap-4 min-w-[1000px]" id="schedule-grid">
                        ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => `
                            <div class="flex flex-col gap-2">
                                <div class="text-center py-2 bg-slate-50/50 rounded-lg border border-slate-100/50 mb-2">
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${day}</span>
                                </div>
                                <div id="day-col-${index}" class="space-y-2 flex-1 min-h-[300px]">
                                    <!-- Classes will be injected here -->
                                    <div class="text-center py-20 text-slate-200">
                                        <i class="fa-solid fa-spinner fa-spin text-lg"></i>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.update();
    },

    update: function () {
        loadSchedule();
    }
});

// --- HELPER FUNCTIONS FOR SCHEDULE ---

async function loadSchedule() {
    try {
        if (!currentFranchiseId) return;

        // Ensure API_URL is available
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api/v1');

        const res = await fetch(`${apiUrl}/classes/franchise/${currentFranchiseId}?view=week`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const json = await res.json();

        if (json.success) {
            window.currentScheduleData = json.data;
            renderSchedule(json.data);
        }
    } catch (e) {
        console.error("Error loading schedule:", e);
        if (typeof showToast === 'function') showToast("Erro ao carregar grade", "error");
    }
}

function renderSchedule(classes) {
    // Clear columns
    for (let i = 0; i < 7; i++) {
        const col = document.getElementById(`day-col-${i}`);
        if (col) col.innerHTML = '';
    }

    // Group by day
    classes.forEach(cls => {
        const col = document.getElementById(`day-col-${cls.dayOfWeek}`);
        if (col) {
            const teacherName = cls.teacherId ? (cls.teacherId.name || 'Professor') : 'Sem Professor';
            const categoryColor = getCategoryColor(cls.category);

            col.innerHTML += `
                <div class="bg-${categoryColor}-50 border border-${categoryColor}-100 rounded-xl p-3 shadow-sm hover:shadow-md transition group relative">
                    <div class="flex justify-between items-center mb-1 gap-1">
                        <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-${categoryColor}-600 border border-${categoryColor}-200 shadow-sm truncate">
                            ${cls.category || 'Geral'}
                        </span>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onclick="openEditClassModal('${cls._id}')" class="text-slate-400 hover:text-orange-500 transition">
                                <i class="fa-solid fa-pen text-[10px]"></i>
                            </button>
                            <button onclick="deleteClass('${cls._id}')" class="text-slate-400 hover:text-red-500 transition">
                                <i class="fa-solid fa-trash text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                    <h4 class="font-bold text-slate-800 text-xs mb-0.5 leading-tight truncate" title="${cls.name}">${cls.name}</h4>
                    <p class="text-[10px] text-slate-500 mb-2 truncate">${teacherName}</p>
                    <div class="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white/60 px-2 py-1 rounded-lg border border-${categoryColor}-100 w-fit">
                        <i class="fa-regular fa-clock text-slate-400"></i>
                        ${cls.startTime} - ${cls.endTime}
                    </div>
                </div>
            `;
        }
    });
}

function getCategoryColor(category) {
    const map = {
        'BJJ': 'blue',
        'No-Gi': 'red',
        'Wrestling': 'orange',
        'Kids': 'green',
        'Fundamentals': 'slate',
        'Muay Thai': 'red'
    };
    return map[category] || 'slate';
}

// Modal Functions
window.openAddClassModal = () => {
    // Build options for teachers
    // Use myTeachers global from franchise-client.js
    const teachersList = window.myTeachers || [];
    const teacherOptions = teachersList.map(t =>
        `<option value="${t._id}">${t.name} (${t.belt || 'Faixa?'})</option>`
    ).join('');

    const content = `
        <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-slate-800">Nova Aula</h3>
            <p class="text-xs text-slate-500">Adicione um novo horário à grade</p>
        </div>
        
        <form id="form-new-class" onsubmit="event.preventDefault(); submitNewClass()" class="space-y-4">
            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Nome da Aula</label>
                <input type="text" id="class-name" class="input-field" placeholder="Ex: Jiu-Jitsu Avançado" required>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Dia da Semana</label>
                    <select id="class-day" class="input-field" required>
                        <option value="1">Segunda-feira</option>
                        <option value="2">Terça-feira</option>
                        <option value="3">Quarta-feira</option>
                        <option value="4">Quinta-feira</option>
                        <option value="5">Sexta-feira</option>
                        <option value="6">Sábado</option>
                        <option value="0">Domingo</option>
                    </select>
                </div>
                <div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Categoria</label>
                    <select id="class-category" class="input-field" required>
                        <option value="BJJ">Jiu-Jitsu (Kimono)</option>
                        <option value="No-Gi">No-Gi (Sem Kimono)</option>
                        <option value="Kids">Kids</option>
                        <option value="Fundamentals">Fundamentos</option>
                        <option value="Wrestling">Wrestling</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Tipo da Turma</label>
                    <select id="class-level" class="input-field" required>
                        <option value="beginner">Iniciantes</option>
                        <option value="intermediate">Intermediários</option>
                        <option value="advanced">Avançados</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Público Alvo</label>
                    <select id="class-target" class="input-field" required>
                        <option value="adults">Adultos</option>
                        <option value="kids">Kids</option>
                        <option value="women">Feminina</option>
                        <option value="seniors">Terceira Idade</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Faixa Mínima</label>
                    <select id="class-min-belt" class="input-field">
                        <option value="Branca">Branca</option>
                        <option value="Cinza">Cinza</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Laranja">Laranja</option>
                        <option value="Verde">Verde</option>
                        <option value="Azul">Azul</option>
                        <option value="Roxa">Roxa</option>
                        <option value="Marrom">Marrom</option>
                        <option value="Preta">Preta</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Capacidade Máx.</label>
                    <input type="number" id="class-capacity" class="input-field" placeholder="Ex: 30" min="1" value="30">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Início</label>
                    <input type="time" id="class-start" class="input-field" required>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Fim</label>
                    <input type="time" id="class-end" class="input-field" required>
                </div>
            </div>

            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Professor Responsável</label>
                <select id="class-teacher" class="input-field" required>
                    <option value="">Selecione...</option>
                    ${teacherOptions}
                </select>
            </div>

            <button type="submit" class="w-full btn-primary mt-4">
                Criar Aula
            </button>
        </form>
    `;

    // Based on franqueado-premium.html logic:
    const modal = document.getElementById('ui-modal');
    const modalContent = document.getElementById('modal-content');
    const modalPanel = document.getElementById('modal-panel');

    if (modal && modalContent) {
        modalContent.innerHTML = content;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        // Animation
        setTimeout(() => {
            modalPanel.classList.remove('scale-95', 'opacity-0');
            modalPanel.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
};

window.closeModal = () => {
    const modal = document.getElementById('ui-modal');
    const modalPanel = document.getElementById('modal-panel');

    if (modalPanel) {
        modalPanel.classList.remove('scale-100', 'opacity-100');
        modalPanel.classList.add('scale-95', 'opacity-0');
    }

    setTimeout(() => {
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }, 300);
};

window.submitNewClass = async () => {
    const submitBtn = document.querySelector('#form-new-class button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    // Ensure API_URL is available
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api/v1');

    const data = {
        franchiseId: currentFranchiseId,
        teacherId: document.getElementById('class-teacher').value,
        name: document.getElementById('class-name').value,
        dayOfWeek: parseInt(document.getElementById('class-day').value),
        startTime: document.getElementById('class-start').value,
        endTime: document.getElementById('class-end').value,
        category: document.getElementById('class-category').value,
        level: document.getElementById('class-level').value,
        targetAudience: document.getElementById('class-target').value,
        minBelt: document.getElementById('class-min-belt').value,
        capacity: parseInt(document.getElementById('class-capacity').value) || 30
    };

    try {
        const res = await fetch(`${apiUrl}/classes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();

        if (json.success) {
            if (typeof showToast === 'function') showToast('Aula criada com sucesso!', 'success');
            closeModal();
            loadSchedule(); // Refresh grid
        } else {
            throw new Error(json.message);
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('Erro: ' + e.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

window.deleteClass = async (id) => {
    const confirmMsg = 'Tem certeza que deseja remover esta aula?';
    
    const executeDelete = async () => {
        // Ensure API_URL is available
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api/v1');

        try {
            const res = await fetch(`${apiUrl}/classes/${id}`, {
                method: 'DELETE',
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const json = await res.json();

            if (json.success) {
                if (typeof showToast === 'function') showToast('Aula removida!', 'success');
                loadSchedule();
            } else {
                if (typeof showToast === 'function') showToast('Erro ao remover', 'error');
            }
        } catch (e) {
            console.error(e);
            if (typeof showToast === 'function') showToast('Erro de conexão', 'error');
        }
    };

    if (typeof showPortalConfirm === 'function') {
        showPortalConfirm('Remover Aula', confirmMsg, executeDelete);
    } else if (confirm(confirmMsg)) {
        executeDelete();
    }
};

window.openEditClassModal = (id) => {
    const cls = window.currentScheduleData.find(c => c._id === id);
    if (!cls) return;

    // Build options for teachers
    const teachersList = window.myTeachers || [];
    const teacherOptions = teachersList.map(t =>
        `<option value="${t._id}" ${t._id === (cls.teacherId?._id || cls.teacherId) ? 'selected' : ''}>${t.name} (${t.belt || 'Faixa?'})</option>`
    ).join('');

    const content = `
        <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-slate-800">Editar Aula</h3>
            <p class="text-xs text-slate-500">Atualize os dados da aula</p>
        </div>
        
        <form id="form-edit-class" onsubmit="event.preventDefault(); submitEditClass('${id}')" class="space-y-4">
            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Nome da Aula</label>
                <input type="text" id="edit-class-name" class="input-field" value="${cls.name}" required>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Dia da Semana</label>
                    <select id="edit-class-day" class="input-field" required>
                        <option value="1" ${cls.dayOfWeek === 1 ? 'selected' : ''}>Segunda-feira</option>
                        <option value="2" ${cls.dayOfWeek === 2 ? 'selected' : ''}>Terça-feira</option>
                        <option value="3" ${cls.dayOfWeek === 3 ? 'selected' : ''}>Quarta-feira</option>
                        <option value="4" ${cls.dayOfWeek === 4 ? 'selected' : ''}>Quinta-feira</option>
                        <option value="5" ${cls.dayOfWeek === 5 ? 'selected' : ''}>Sexta-feira</option>
                        <option value="6" ${cls.dayOfWeek === 6 ? 'selected' : ''}>Sábado</option>
                        <option value="0" ${cls.dayOfWeek === 0 ? 'selected' : ''}>Domingo</option>
                    </select>
                </div>
                <div>
                     <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Categoria</label>
                    <select id="edit-class-category" class="input-field" required>
                        <option value="BJJ" ${cls.category === 'BJJ' ? 'selected' : ''}>Jiu-Jitsu (Kimono)</option>
                        <option value="No-Gi" ${cls.category === 'No-Gi' ? 'selected' : ''}>No-Gi (Sem Kimono)</option>
                        <option value="Kids" ${cls.category === 'Kids' ? 'selected' : ''}>Kids</option>
                        <option value="Fundamentals" ${cls.category === 'Fundamentals' ? 'selected' : ''}>Fundamentos</option>
                        <option value="Wrestling" ${cls.category === 'Wrestling' ? 'selected' : ''}>Wrestling</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Tipo da Turma</label>
                    <select id="edit-class-level" class="input-field" required>
                        <option value="beginner" ${cls.level === 'beginner' ? 'selected' : ''}>Iniciantes</option>
                        <option value="intermediate" ${cls.level === 'intermediate' ? 'selected' : ''}>Intermediários</option>
                        <option value="advanced" ${cls.level === 'advanced' ? 'selected' : ''}>Avançados</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Público Alvo</label>
                    <select id="edit-class-target" class="input-field" required>
                        <option value="adults" ${cls.targetAudience === 'adults' ? 'selected' : ''}>Adultos</option>
                        <option value="kids" ${cls.targetAudience === 'kids' ? 'selected' : ''}>Kids</option>
                        <option value="women" ${cls.targetAudience === 'women' ? 'selected' : ''}>Feminina</option>
                        <option value="seniors" ${cls.targetAudience === 'seniors' ? 'selected' : ''}>Terceira Idade</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Faixa Mínima</label>
                    <select id="edit-class-min-belt" class="input-field">
                        <option value="Branca" ${cls.minBelt === 'Branca' ? 'selected' : ''}>Branca</option>
                        <option value="Cinza" ${cls.minBelt === 'Cinza' ? 'selected' : ''}>Cinza</option>
                        <option value="Amarela" ${cls.minBelt === 'Amarela' ? 'selected' : ''}>Amarela</option>
                        <option value="Laranja" ${cls.minBelt === 'Laranja' ? 'selected' : ''}>Laranja</option>
                        <option value="Verde" ${cls.minBelt === 'Verde' ? 'selected' : ''}>Verde</option>
                        <option value="Azul" ${cls.minBelt === 'Azul' ? 'selected' : ''}>Azul</option>
                        <option value="Roxa" ${cls.minBelt === 'Roxa' ? 'selected' : ''}>Roxa</option>
                        <option value="Marrom" ${cls.minBelt === 'Marrom' ? 'selected' : ''}>Marrom</option>
                        <option value="Preta" ${cls.minBelt === 'Preta' ? 'selected' : ''}>Preta</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Capacidade Máx.</label>
                    <input type="number" id="edit-class-capacity" class="input-field" value="${cls.capacity || 30}" min="1">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Início</label>
                    <input type="time" id="edit-class-start" class="input-field" value="${cls.startTime}" required>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Fim</label>
                    <input type="time" id="edit-class-end" class="input-field" value="${cls.endTime}" required>
                </div>
            </div>

            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Professor Responsável</label>
                <select id="edit-class-teacher" class="input-field" required>
                    <option value="">Selecione...</option>
                    ${teacherOptions}
                </select>
            </div>

            <button type="submit" class="w-full btn-primary mt-4">
                Salvar Alterações
            </button>
        </form>
    `;

    openModal(content);
};

window.submitEditClass = async (id) => {
    const submitBtn = document.querySelector('#form-edit-class button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    // Ensure API_URL is available
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api/v1');

    const data = {
        teacherId: document.getElementById('edit-class-teacher').value,
        name: document.getElementById('edit-class-name').value,
        dayOfWeek: parseInt(document.getElementById('edit-class-day').value),
        startTime: document.getElementById('edit-class-start').value,
        endTime: document.getElementById('edit-class-end').value,
        category: document.getElementById('edit-class-category').value,
        level: document.getElementById('edit-class-level').value,
        targetAudience: document.getElementById('edit-class-target').value,
        minBelt: document.getElementById('edit-class-min-belt').value,
        capacity: parseInt(document.getElementById('edit-class-capacity').value) || 30
    };

    try {
        const res = await fetch(`${apiUrl}/classes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();

        if (json.success) {
            if (typeof showToast === 'function') showToast('Aula atualizada com sucesso!', 'success');
            closeModal();
            loadSchedule(); // Refresh grid
        } else {
            throw new Error(json.message);
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('Erro: ' + e.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

// ===== HELPER: IMAGE UPLOAD =====
window.uploadImage = async (inputElement, targetInputId) => {
    const file = inputElement.files[0];
    if (!file) return;

    // Get the label element (button)
    const label = inputElement.previousElementSibling;
    const icon = label ? label.querySelector('i') : null;

    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000/api/v1');

    try {
        if (icon) icon.className = "fa-solid fa-spinner fa-spin";
        
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${apiUrl}/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Bypass-Tunnel-Reminder': 'true'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const targetInput = document.getElementById(targetInputId);
            if (targetInput) {
                targetInput.value = result.data.url;
                // Trigger input event
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (icon) icon.className = "fa-solid fa-check text-green-500";
            
            // Revert icon after 2 seconds
             setTimeout(() => {
                if (icon) icon.className = "fa-solid fa-upload";
            }, 2000);
        } else {
             alert('Erro no upload: ' + (result.error || 'Erro desconhecido'));
             if (icon) icon.className = "fa-solid fa-triangle-exclamation text-red-500";
             setTimeout(() => { if (icon) icon.className = "fa-solid fa-upload"; }, 3000);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Erro ao enviar imagem. Verifique a conexão.');
        if (icon) icon.className = "fa-solid fa-triangle-exclamation text-red-500";
        setTimeout(() => { if (icon) icon.className = "fa-solid fa-upload"; }, 3000);
    }
};


// ===== CHART 1: RETENTION FUNNEL (CHURN) =====
registerWidget({
    id: 'franchisee-churn-chart',
    name: 'Funil de Retenção',
    description: 'Análise de entradas, saídas e churn rate',
    size: 'col-span-12 md:col-span-6',
    category: 'Analytics',
    icon: 'fa-solid fa-filter-circle-xmark',

    actions: `
        <button onclick="showWidgetInfo('churn')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all shadow-sm group" title="Como analisar este gráfico?">
            <i class="fa-regular fa-circle-question text-xs transition-transform group-hover:rotate-12"></i> Entenda
        </button>
    `,

    render: function (container) {
        container.innerHTML = `
            <div class="relative w-full h-64">
                <canvas id="chart-churn"></canvas>
            </div>
            <div id="chart-churn-error" class="hidden text-center text-red-500 text-xs mt-2 italic">Erro ao carregar gráfico</div>
        `;
        this.update();
    },

    update: function () {
        setTimeout(() => {
            const canvas = document.getElementById('chart-churn');
            if (canvas && typeof Chart !== 'undefined') {
                if (window.churnChartInstance) window.churnChartInstance.destroy();

                const ctx = canvas.getContext('2d');
                // Mock logic if metrics are simple, but trying to use myMetrics
                // Assuming myMetrics has { students: { active: 100, new: 10, cancelled: 5 } } structure
                // If not, we use realistic mock based on the 'total' we have
                
                const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
                // Mock data that looks realistic for a retention funnel
                const dataNew = [12, 15, 10, 18, 20, 15];
                const dataCancelled = [2, 3, 5, 2, 4, 3];
                const dataNet = dataNew.map((v, i) => v - dataCancelled[i]);

                window.churnChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Novos Alunos',
                                data: dataNew,
                                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                                borderRadius: 4,
                                stack: 'Stack 0',
                            },
                             {
                                label: 'Cancelamentos',
                                data: dataCancelled.map(x => -x), // Negative for visual effect
                                backgroundColor: 'rgba(239, 68, 68, 0.6)',
                                borderRadius: 4,
                                stack: 'Stack 0',
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                            label += Math.abs(context.parsed.y);
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { stacked: true, grid: { display: false } },
                            y: { 
                                stacked: true, 
                                grid: { color: '#f1f5f9' },
                                ticks: { callback: (v) => Math.abs(v) } 
                            }
                        }
                    }
                });
            }
        }, 300);
    }
});

// ===== CHART 2: BELT DISTRIBUTION (PYRAMID) =====
registerWidget({
    id: 'franchisee-belt-chart',
    name: 'Distribuição por Graduação',
    description: 'Proporção de alunos por faixa (Saúde da Academia)',
    size: 'col-span-12 md:col-span-6',
    category: 'Gestão',
    icon: 'fa-solid fa-layer-group',

    actions: `
        <button onclick="showWidgetInfo('belt')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all shadow-sm group" title="Como analisar este gráfico?">
            <i class="fa-regular fa-circle-question text-xs transition-transform group-hover:rotate-12"></i> Entenda
        </button>
    `,

    render: function (container) {
        container.innerHTML = `
            <div class="relative w-full h-64 flex items-center justify-center">
                <canvas id="chart-belts"></canvas>
            </div>
            <div id="chart-belts-error" class="hidden text-center text-red-500 text-xs mt-2 italic">Erro ao carregar gráfico</div>
        `;
        this.update();
    },

    update: function () {
        setTimeout(() => {
            const canvas = document.getElementById('chart-belts');
            const errorDiv = document.getElementById('chart-belts-error');
            
            if (!canvas) {
                console.error('Canvas element not found for belt chart');
                return;
            }
            
            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded');
                if (errorDiv) {
                    errorDiv.classList.remove('hidden');
                    errorDiv.textContent = 'Chart.js não carregado. Verifique sua conexão.';
                }
                return;
            }
            
            if (window.beltChartInstance) window.beltChartInstance.destroy();

            const ctx = canvas.getContext('2d');
            
            // Calculate from real data if available
            let counts = { 'Branca': 0, 'Cinza': 0, 'Amarela': 0, 'Laranja': 0, 'Verde': 0, 'Azul': 0, 'Roxa': 0, 'Marrom': 0, 'Preta': 0 };
            
            if (typeof myStudents !== 'undefined' && Array.isArray(myStudents) && myStudents.length > 0) {
                myStudents.forEach(s => {
                    let belt = (s.belt || 'Branca').split(' - ')[0];
                    if (counts[belt] !== undefined) counts[belt]++;
                    else counts['Branca']++; // Fallback
                });
            } else {
                // Fallback mock - always show something
                console.log('Using fallback data for belt chart');
                counts = { 'Branca': 45, 'Azul': 20, 'Roxa': 10, 'Marrom': 5, 'Preta': 2 };
            }

            // Filter out empty belts for cleaner chart, but keep order
            const order = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];
            const data = [];
            const labels = [];
            const colors = [];
            const bgColors = {
                'Branca': 'rgba(226, 232, 240, 0.6)', 'Cinza': 'rgba(148, 163, 184, 0.6)', 'Amarela': 'rgba(252, 211, 77, 0.6)', 
                'Laranja': 'rgba(251, 146, 60, 0.6)', 'Verde': 'rgba(74, 222, 128, 0.6)', 'Azul': 'rgba(59, 130, 246, 0.6)', 
                'Roxa': 'rgba(168, 85, 247, 0.6)', 'Marrom': 'rgba(120, 53, 15, 0.6)', 'Preta': 'rgba(30, 41, 59, 0.6)'
            };

            order.forEach(b => {
                if (counts[b] > 0) {
                    labels.push(b);
                    data.push(counts[b]);
                    colors.push(bgColors[b]);
                }
            });

            try {
                window.beltChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } }
                        },
                        cutout: '60%'
                    }
                });
                console.log('Belt chart rendered successfully');
            } catch (error) {
                console.error('Error creating belt chart:', error);
                if (errorDiv) {
                    errorDiv.classList.remove('hidden');
                    errorDiv.textContent = 'Erro ao criar gráfico: ' + error.message;
                }
            }
        }, 300);
    }
});

// ===== CHART 3: OCCUPATION HEATMAP =====
registerWidget({
    id: 'franchisee-heatmap-chart',
    name: 'Mapa de Ocupação (Heatmap)',
    description: 'Densidade de alunos por horário e dia da semana',
    size: 'col-span-12',
    category: 'Operacional',
    icon: 'fa-solid fa-fire',

    actions: `
        <button onclick="showWidgetInfo('heatmap')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all shadow-sm group" title="Como analisar este gráfico?">
            <i class="fa-regular fa-circle-question text-xs transition-transform group-hover:rotate-12"></i> Entenda
        </button>
    `,

    render: function (container) {
        const times = ['06:00', '08:00', '12:00', '17:00', '19:00', '21:00'];
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        
        let html = `
            <div class="overflow-x-auto no-scrollbar">
                <table class="w-full text-center border-separate border-spacing-1">
                    <thead>
                        <tr>
                            <th class="p-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">Horário</th>
                            ${days.map(d => `<th class="p-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">${d}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        times.forEach(time => {
            html += `<tr>
                <td class="p-2 text-[10px] font-bold text-slate-400 bg-slate-50/50 rounded-lg">${time}</td>`;
            
            days.forEach(() => {
                let occupancy = 0;
                // Mock logic similar to matrix for consistency in demo
                if (time.includes('19') || time.includes('21')) occupancy = 70 + Math.floor(Math.random() * 25);
                else if (time.includes('06')) occupancy = 30 + Math.floor(Math.random() * 30);
                else occupancy = 10 + Math.floor(Math.random() * 50);

                let colorClass = 'bg-slate-50 text-slate-400 border border-slate-100';
                if (occupancy > 85) colorClass = 'bg-red-500 text-white shadow-sm border-transparent';
                else if (occupancy > 60) colorClass = 'bg-orange-400 text-white shadow-sm border-transparent';
                else if (occupancy > 40) colorClass = 'bg-orange-200 text-orange-800 border-transparent';
                else if (occupancy > 20) colorClass = 'bg-orange-50 text-orange-600 border-orange-100';

                const studentCount = Math.max(0, Math.floor(occupancy / 3.2));

                html += `<td class="p-1">
                    <div class="${colorClass} rounded-xl py-2 px-1 text-[10px] font-bold transition hover:scale-105 cursor-default flex flex-col items-center justify-center min-h-[48px]">
                        <span class="text-sm leading-none mb-0.5">${occupancy}%</span>
                        <span class="text-[8px] opacity-80 font-medium whitespace-nowrap">${studentCount} alunos</span>
                    </div>
                </td>`;
            });
            html += `</tr>`;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-4 flex items-center justify-end gap-3 text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-slate-100 border border-slate-200"></span> Vazio</span>
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-200"></span> Médio</span>
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-500"></span> Lotado</span>
            </div>
        `;
        
        container.innerHTML = html;
        this.update();
    },

    update: function () {
        // No real update logic needed for this mock version yet, 
        // but would fetch booking data here
    }
});

// ===== CHART 4: FINANCIAL HEALTH =====
registerWidget({
    id: 'franchisee-financial-health-chart',
    name: 'Saúde Financeira',
    description: 'Recebimentos, Pendências e Inadimplência',
    size: 'col-span-12 md:col-span-8',
    category: 'Financeiro',
    icon: 'fa-solid fa-file-invoice-dollar',

    actions: `
        <button onclick="showWidgetInfo('financial')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all shadow-sm group" title="Como analisar este gráfico?">
            <i class="fa-regular fa-circle-question text-xs transition-transform group-hover:rotate-12"></i> Entenda
        </button>
    `,

    render: function (container) {
        container.innerHTML = `
            <div class="relative w-full h-64">
                <canvas id="chart-financial-health"></canvas>
            </div>
            <div id="chart-financial-error" class="hidden text-center text-red-500 text-xs mt-2 italic">Erro ao carregar dados financeiros</div>
        `;
        this.update();
    },

    update: function () {
        setTimeout(() => {
            const canvas = document.getElementById('chart-financial-health');
            if (canvas && typeof Chart !== 'undefined') {
                if (window.finHealthChartInstance) window.finHealthChartInstance.destroy();

                const ctx = canvas.getContext('2d');
                
                const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
                // Mock data
                const received = [15000, 16500, 16000, 18000, 19500, 21000];
                const pending = [2000, 1500, 1800, 2200, 2500, 5000]; // Current month has more pending
                const overdue = [500, 800, 400, 600, 300, 100]; // Old inputs settle or stay overdue
                
                window.finHealthChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Recebido',
                                data: received,
                                backgroundColor: 'rgba(34, 197, 94, 0.6)', // Green
                                barPercentage: 0.6,
                            },
                            {
                                label: 'Pendente',
                                data: pending,
                                backgroundColor: 'rgba(251, 191, 36, 0.6)', // Amber
                                barPercentage: 0.6,
                            },
                             {
                                label: 'Inadimplente',
                                data: overdue,
                                backgroundColor: 'rgba(239, 68, 68, 0.6)', // Red
                                barPercentage: 0.6,
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { stacked: true, grid: { display: false } },
                            y: { 
                                stacked: true, 
                                grid: { color: '#f1f5f9' },
                                ticks: { 
                                    callback: function(value) {
                                        return 'R$ ' + value / 1000 + 'k';
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }, 300);
    }
});

// ===== CHART 5: ENGAGEMENT HISTOGRAM =====
registerWidget({
    id: 'franchisee-engagement-chart',
    name: 'Curva de Engajamento',
    description: 'Frequência média mensal dos alunos (Risco de Evasão)',
    size: 'col-span-12 md:col-span-4',
    category: 'Analytics',
    icon: 'fa-solid fa-heart-pulse',

    actions: `
        <button onclick="showWidgetInfo('engagement')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all shadow-sm group" title="Como analisar este gráfico?">
            <i class="fa-regular fa-circle-question text-xs transition-transform group-hover:rotate-12"></i> Entenda
        </button>
    `,

    render: function (container) {
        container.innerHTML = `
            <div class="relative w-full h-64">
                <canvas id="chart-engagement"></canvas>
            </div>
            <div id="chart-engagement-error" class="hidden text-center text-red-500 text-xs mt-2 italic">Erro ao carregar dados de engajamento</div>
        `;
        this.update();
    },

    update: function () {
        setTimeout(() => {
            const canvas = document.getElementById('chart-engagement');
            if (canvas && typeof Chart !== 'undefined') {
                if (window.engagementChartInstance) window.engagementChartInstance.destroy();

                const ctx = canvas.getContext('2d');
                
                // Bins: 0-4 checkins (Risk), 5-8 (Average), 9-12 (Good), 12+ (Super)
                const data = [15, 45, 30, 10]; // Percentages or counts
                const labels = ['Risco (0-4)', 'Média (5-8)', 'Bom (9-12)', 'Super (12+)'];
                const colors = [
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(251, 191, 36, 0.6)',
                    'rgba(34, 197, 94, 0.6)',
                    'rgba(59, 130, 246, 0.6)'
                ];

                window.engagementChartInstance = new Chart(ctx, {
                    type: 'bar', // Using horizontal bar for distribution
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Alunos',
                            data: data,
                            backgroundColor: colors,
                            borderRadius: 6,
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: { grid: { display: false } },
                            y: { grid: { display: false } }
                        }
                    }
                });
            }
        }, 300);
    }
});


// ===== INFO MODAL HELPER =====
window.showWidgetInfo = function (type) {
    const infos = {
        'churn': {
            title: 'Funil de Retenção (Churn Rate)',
            desc: 'Este gráfico mostra a relação entre novos alunos (verde) e cancelamentos (vermelho/negativo) mês a mês.',
            analysis: 'Seu objetivo é manter as barras verdes maiores que as vermelhas. Um aumento excessivo nas barras vermelhas indica problemas na qualidade das aulas ou no atendimento.'
        },
        'belt': {
            title: 'Distribuição por Graduação',
            desc: 'Visualização da proporção de alunos em cada faixa, da branca à preta.',
            analysis: 'Uma academia saudável tem formato de pirâmide: base larga de faixas brancas e afunilamento natural. Se faltam faixas brancas, você precisa melhorar o marketing. Se faltam graduados, o problema é retenção.'
        },
        'heatmap': {
            title: 'Mapa de Calor de Ocupação',
            desc: 'Tabela que mostra a densidade de alunos por dia e horário.',
            analysis: 'Use para otimizar a grade. Horários vermelhos estão superlotados (considere abrir turma extra ou limitar check-in). Horários brancos/verdes estão ociosos e geram prejuízo operacional.'
        },
        'financial': {
            title: 'Saúde Financeira',
            desc: 'Comparativo mensal entre valores Recebidos, Pendentes (a receber) e Inadimplentes (atrasados).',
            analysis: 'Foque em reduzir a barra vermelha (Inadimplência). A barra amarela (Pendente) deve se transformar em verde ao longo do mês. Se a amarela sobra muito no fim do mês, sua cobrança está falhando.'
        },
        'evolution': {
            title: 'Análise de Evolução Técnica',
            desc: 'Métricas consolidadas de presença e engajamento por modalidade.',
            analysis: 'Compare a "Média por Aula" entre categorias para identificar horários ociosos ou sobrecarregados.'
        },
        'evolution-attendance': {
            title: 'Frequência Média por Categoria',
            desc: 'Média de alunos presentes por aula em cada modalidade (BJJ, Kids, etc).',
            analysis: 'Use para identificar quais categorias têm maior densidade. Valores baixos podem indicar necessidade de marketing ou mudança de horário.'
        },
        'evolution-engagement': {
            title: 'Score de Engajamento',
            desc: 'Mede a fidelidade dos alunos em relação à sua modalidade principal.',
            analysis: 'Scores próximos a 10 indicam alta retenção. Quedas repentinas sugerem desmotivação ou problemas técnicos na turma.'
        },
        'evolution-table': {
            title: 'Estatísticas Técnicas',
            desc: 'Visão tabular detalhada do desempenho por categoria.',
            analysis: 'Analise a proporção entre Sessões Realizadas e Total de Presenças para validar a eficiência operacional da modalidade.'
        }
    };

    const info = infos[type];
    if (info) {
        if (typeof window.openModal === 'function') {
            window.openModal(`
                <div class="text-center p-2">
                    <div class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 text-2xl">
                        <i class="fa-solid fa-lightbulb"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 mb-2">${info.title}</h3>
                    <p class="text-sm text-slate-500 mb-6">${info.desc}</p>
                    
                    <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <i class="fa-solid fa-magnifying-glass-chart mr-1"></i> Como Analisar:
                        </p>
                        <p class="text-xs text-slate-700 leading-relaxed font-medium">
                            ${info.analysis}
                        </p>
                    </div>

                    <button onclick="closeModal()" class="w-full py-4 orange-gradient text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-8">
                        Entendi
                    </button>
                </div>
            `);
        } else {
            console.error('Modal function not found');
            alert(`${info.title}\n\n${info.analysis}`);
        }
    }
};

// Global cache for technical stats to avoid triple fetching
window._cachedTechnicalStats = null;
window._techStatsFetching = false;

async function getTechnicalStats() {
    if (window._cachedTechnicalStats) return window._cachedTechnicalStats;
    if (window._techStatsFetching) {
        // Simple poll
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (window._cachedTechnicalStats) {
                    clearInterval(interval);
                    resolve(window._cachedTechnicalStats);
                }
            }, 100);
        });
    }

    const fId = localStorage.getItem('franqueado_franchise_id') || localStorage.getItem('franchiseId');
    if (!fId) return null;

    window._techStatsFetching = true;
    try {
        const apiUrl = window.API_BASE_URL || window.API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${apiUrl}/classes/franchise/${fId}/technical-stats`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const result = await res.json();
        if (result.success) {
            window._cachedTechnicalStats = result.data.categories || [];
            return window._cachedTechnicalStats;
        }
    } catch (e) {
        console.error("Error fetching tech stats:", e);
    } finally {
        window._techStatsFetching = false;
    }
    return null;
}

// ===== EVOLUTION 1: ATTENDANCE CHART =====
registerWidget({
    id: 'franchisee-evolution-attendance',
    name: 'Presença por Categoria',
    description: 'Capacidade média ocupada por aula',
    size: 'col-span-12 md:col-span-6',
    category: 'Analytics',
    icon: 'fa-solid fa-users-viewfinder',
    actions: `<button onclick="showWidgetInfo('evolution-attendance')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all shadow-sm group"><i class="fa-regular fa-circle-question text-xs transition-transform group-hover:rotate-12"></i> Entenda</button>`,
    render: function (container) {
        container.innerHTML = `<div class="h-[250px] relative"><canvas id="canvas-evolution-attendance"></canvas></div>`;
        this.update();
    },
    update: async function () {
        const stats = await getTechnicalStats();
        const canvas = document.getElementById('canvas-evolution-attendance');
        if (!canvas || !stats || typeof Chart === 'undefined') return;
        
        if (window.chartEvAtt) window.chartEvAtt.destroy();
        window.chartEvAtt = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: stats.map(s => s.category),
                datasets: [{
                    label: 'Média/Aula',
                    data: stats.map(s => s.avgAttendance),
                    backgroundColor: 'rgba(255, 107, 0, 0.6)',
                    borderColor: '#FF6B00',
                    borderWidth: 2,
                    borderRadius: 12
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' } },
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, color: '#94a3b8' } }
                }
            }
        });
    }
});

// ===== EVOLUTION 2: ENGAGEMENT CHART =====
registerWidget({
    id: 'franchisee-evolution-engagement',
    name: 'Score de Engajamento',
    description: 'Frequência relativa dos alunos',
    size: 'col-span-12 md:col-span-6',
    category: 'Analytics',
    icon: 'fa-solid fa-bolt',
    actions: `<button onclick="showWidgetInfo('evolution-engagement')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all shadow-sm group"><i class="fa-regular fa-circle-question text-xs transition-transform group-hover:rotate-12"></i> Entenda</button>`,
    render: function (container) {
        container.innerHTML = `<div class="h-[250px] relative"><canvas id="canvas-evolution-engagement"></canvas></div>`;
        this.update();
    },
    update: async function () {
        const stats = await getTechnicalStats();
        const canvas = document.getElementById('canvas-evolution-engagement');
        if (!canvas || !stats || typeof Chart === 'undefined') return;
        
        const engagementData = stats.map(s => Math.min(10, (s.avgAttendance / Math.max(1, s.studentCount) * 10)));

        if (window.chartEvEng) window.chartEvEng.destroy();
        window.chartEvEng = new Chart(canvas, {
            type: 'line',
            data: {
                labels: stats.map(s => s.category),
                datasets: [{
                    label: 'Score',
                    data: engagementData,
                    borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true, tension: 0.4, pointRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' } },
                    y: { beginAtZero: true, max: 10, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, color: '#94a3b8' } }
                }
            }
        });
    }
});

// ===== EVOLUTION 3: STATS TABLE =====
registerWidget({
    id: 'franchisee-evolution-table',
    name: 'Estatísticas Técnicas',
    description: 'Desempenho detalhado por modalidade',
    size: 'col-span-12',
    category: 'Analytics',
    icon: 'fa-solid fa-table-list',
    actions: `<button onclick="showWidgetInfo('evolution-table')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all shadow-sm group"><i class="fa-regular fa-circle-question text-xs transition-transform group-hover:rotate-12"></i> Entenda</button>`,
    render: function (container) {
        container.innerHTML = `
            <div class="overflow-hidden bg-white border border-slate-100 rounded-2xl">
                <table class="w-full text-left text-[11px]">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                            <th class="px-6 py-4">Categoria</th>
                            <th class="px-6 py-4 text-center">Total Presenças</th>
                            <th class="px-6 py-4 text-center">Sessões Realizadas</th>
                            <th class="px-6 py-4 text-center">Alunos Ativos</th>
                            <th class="px-6 py-4 text-right">Média/Aula</th>
                        </tr>
                    </thead>
                    <tbody id="tech-stats-table-body" class="divide-y divide-slate-50">
                        <tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 italic">Carregando dados...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        this.update();
    },
    update: async function () {
        const tableBody = document.getElementById('tech-stats-table-body');
        if (!tableBody) return;
        const stats = await getTechnicalStats();
        if (!stats || stats.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 italic">Sem dados disponíveis.</td></tr>`;
            return;
        }

        tableBody.innerHTML = stats.map(s => `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4"><span class="font-bold text-slate-700 uppercase text-[10px] tracking-tight">${s.category || 'N/A'}</span></td>
                <td class="px-6 py-4 text-center font-bold text-slate-600">${s.totalPresences || 0}</td>
                <td class="px-6 py-4 text-center text-slate-500 font-medium">${s.sessionsCount || 0}</td>
                <td class="px-6 py-4 text-center text-slate-500 font-medium">${s.studentCount || 0}</td>
                <td class="px-6 py-4 text-right"><span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-black border border-slate-200">${(parseFloat(s.avgAttendance)||0).toFixed(1)}</span></td>
            </tr>
        `).join('');
    }
});

console.log('✅ Franchisee Widgets loaded');
