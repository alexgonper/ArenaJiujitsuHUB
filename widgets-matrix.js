// ===== MATRIX STATS WIDGET =====
registerWidget({
    id: 'matrix-stats',
    name: 'Visão Geral da Rede',
    description: 'Métricas principais: alunos, faturamento, unidades e presença global',
    size: 'col-span-12',
    category: 'Métricas',
    icon: 'fa-solid fa-chart-pie',

    render: function (container) {
        container.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div class="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <div class="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-3">
                        <i class="fa-solid fa-users text-sm"></i>
                    </div>
                    <p class="text-[9px] font-bold text-orange-600 uppercase tracking-wider">Total Alunos</p>
                    <h3 id="widget-stat-total-students" class="text-2xl font-black mt-1">--</h3>
                </div>

                <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                    <div class="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3">
                        <i class="fa-solid fa-graduation-cap text-sm"></i>
                    </div>
                    <p class="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Total Professores</p>
                    <h3 id="widget-stat-total-teachers" class="text-2xl font-black mt-1">--</h3>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3">
                        <i class="fa-solid fa-wallet text-sm"></i>
                    </div>
                    <p class="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Faturamento Est.</p>
                    <h3 id="widget-stat-total-revenue" class="text-2xl font-black mt-1">R$ --</h3>
                </div>
                
                <div class="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <div class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-3">
                        <i class="fa-solid fa-chart-line text-sm"></i>
                    </div>
                    <p class="text-[9px] font-bold text-green-600 uppercase tracking-wider">Unidades Ativas</p>
                    <h3 id="widget-stat-unit-count" class="text-2xl font-black mt-1">--</h3>
                </div>
                
                <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                    <div class="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3">
                        <i class="fa-solid fa-earth-americas text-sm"></i>
                    </div>
                    <p class="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Presença Global</p>
                    <h3 id="widget-stat-intl-count" class="text-2xl font-black mt-1">--</h3>
                </div>
                
                <div class="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-200 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-2xl"></div>
                    <div class="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center mb-3 relative z-10">
                        <i class="fa-solid fa-hand-holding-dollar text-sm"></i>
                    </div>
                    <p class="text-[9px] font-bold text-orange-600 uppercase tracking-wider relative z-10">Repasses à Matriz</p>
                    <h3 id="widget-stat-total-royalties" class="text-2xl font-black mt-1 text-orange-600 relative z-10">R$ --</h3>
                </div>
            </div>
        `;

        this.update();
    },

    update: function () {
        // Update widget-specific elements with current data
        if (typeof franchises !== 'undefined' && typeof formatCurrency === 'function') {
            const totalStudents = franchises.reduce((sum, f) => sum + (f.students || 0), 0);
            const totalRevenue = franchises.reduce((sum, f) => sum + (f.revenue || 0), 0);
            const totalTeachers = (typeof teachers !== 'undefined') ? teachers.length : 0;
            const unitCount = franchises.length;
            const domesticIndicators = ['brasil', ' - sc', ' - pr', ' - sp', ' - rj', ' - mg', ' - rs', ' - df', ' - ba', '/pr', '/sc', '/sp', '/rj', '/mg'];
            const intlCount = franchises.filter(f => {
                if (!f.address) return false;
                const addr = f.address.toLowerCase();
                return !domesticIndicators.some(ind => addr.includes(ind));
            }).length;
            const totalRoyalties = franchises.reduce((sum, f) => {
                const pct = f.royaltyPercent || 5; // Default to 5% if not defined
                return sum + ((f.revenue || 0) * (pct / 100));
            }, 0);

            const el1 = document.getElementById('widget-stat-total-students');
            const el1b = document.getElementById('widget-stat-total-teachers');
            const el2 = document.getElementById('widget-stat-total-revenue');
            const el3 = document.getElementById('widget-stat-unit-count');
            const el4 = document.getElementById('widget-stat-intl-count');
            const el5 = document.getElementById('widget-stat-total-royalties');

            if (el1) el1.textContent = totalStudents.toLocaleString();
            if (el1b) el1b.textContent = totalTeachers.toLocaleString();
            if (el2) el2.textContent = formatCurrency(totalRevenue);
            if (el3) el3.textContent = unitCount;
            if (el4) el4.textContent = intlCount;
            if (el5) el5.textContent = formatCurrency(totalRoyalties);
        }
    }
});

// ===== MATRIX PERFORMANCE CHART WIDGET =====
registerWidget({
    id: 'matrix-performance',
    name: 'Performance da Rede',
    description: 'Gráfico de evolução financeira e de alunos ao longo do tempo',
    size: 'col-span-12 lg:col-span-8',
    category: 'Analytics',
    icon: 'fa-solid fa-chart-area',

    render: function (container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div class="flex bg-slate-100 rounded-lg p-1">
                    <button onclick="toggleWidgetChart('financial')" id="widget-btn-chart-financial" 
                        class="px-3 py-1 rounded-md text-[10px] font-bold bg-white shadow text-orange-600 transition">
                        Financeiro
                    </button>
                    <button onclick="toggleWidgetChart('students')" id="widget-btn-chart-students" 
                        class="px-3 py-1 rounded-md text-[10px] font-bold text-slate-500 hover:text-slate-700 transition">
                        Alunos
                    </button>
                </div>
            </div>
            <div class="h-64">
                <canvas id="widget-performanceChart"></canvas>
            </div>
        `;

        this.update();
    },

    update: function () {
        // Initialize chart with widget-specific canvas
        setTimeout(() => {
            const canvas = document.getElementById('widget-performanceChart');
            if (canvas && typeof Chart !== 'undefined' && typeof historicalMetrics !== 'undefined') {
                // Destroy existing chart if any
                if (window.widgetChartInstance) {
                    window.widgetChartInstance.destroy();
                }

                // If no metrics loaded yet, show empty state or return
                if (historicalMetrics.length === 0) return;

                const ctx = canvas.getContext('2d');

                // Process historicalMetrics for labels and data
                const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                const labels = historicalMetrics.map(item => {
                    const [year, month] = item._id.split('-');
                    return monthNames[parseInt(month) - 1];
                });

                const financialData = historicalMetrics.map(item => item.totalRevenue);
                const studentsData = historicalMetrics.map(item => item.totalStudents);

                const currentType = window.currentWidgetChartType || 'financial';

                const dataset = currentType === 'financial' ? {
                    label: 'Faturamento Total (R$)',
                    data: financialData,
                    borderColor: '#FF6B00',
                    backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#FF6B00',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                } : {
                    label: 'Total de Alunos',
                    data: studentsData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                };

                window.widgetChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [dataset]
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
                                displayColors: false,
                                callbacks: {
                                    label: function (context) {
                                        let label = context.dataset.label || '';
                                        if (label) label += ': ';
                                        if (currentType === 'financial') {
                                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                        } else {
                                            label += context.parsed.y + ' alunos';
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                grid: { color: 'rgba(241, 245, 249, 1)', drawBorder: false },
                                ticks: {
                                    font: { size: 9 },
                                    color: '#94a3b8',
                                    callback: function (value) {
                                        if (currentType === 'financial') {
                                            if (value >= 1000) return 'R$ ' + (value / 1000) + 'k';
                                            return 'R$ ' + value;
                                        }
                                        return value;
                                    }
                                }
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

// Helper function for widget chart toggle
window.toggleWidgetChart = function (type) {
    const btnFinancial = document.getElementById('widget-btn-chart-financial');
    const btnStudents = document.getElementById('widget-btn-chart-students');
    window.currentWidgetChartType = type;

    if (type === 'financial') {
        if (btnFinancial) btnFinancial.classList.add('bg-white', 'shadow', 'text-orange-600');
        if (btnFinancial) btnFinancial.classList.remove('text-slate-500');
        if (btnStudents) btnStudents.classList.remove('bg-white', 'shadow', 'text-orange-600', 'text-indigo-600');
        if (btnStudents) btnStudents.classList.add('text-slate-500');
    } else {
        if (btnStudents) btnStudents.classList.add('bg-white', 'shadow', 'text-indigo-600');
        if (btnStudents) btnStudents.classList.remove('text-slate-500');
        if (btnFinancial) btnFinancial.classList.remove('bg-white', 'shadow', 'text-orange-600');
        if (btnFinancial) btnFinancial.classList.add('text-slate-500');
    }

    // Trigger update on the widget to re-render chart with correct dataset
    // Trigger update on the widget to re-render chart with correct dataset
    const widget = typeof WIDGET_REGISTRY !== 'undefined' ? WIDGET_REGISTRY['matrix-performance'] : null;
    if (widget && typeof widget.update === 'function') {
        widget.update();
    }
};

// ===== MATRIX RANKING WIDGET =====
registerWidget({
    id: 'matrix-ranking',
    name: 'Ranking de Alunos',
    description: 'Top unidades por número de alunos ativos',
    size: 'col-span-12 lg:col-span-4',
    category: 'Rankings',
    icon: 'fa-solid fa-trophy',

    render: function (container) {
        container.innerHTML = `
            <div id="widget-top-units-list" class="space-y-4"></div>
            <button onclick="changeSection('network')" 
                class="mt-6 w-full py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold uppercase hover:bg-orange-500 hover:text-white transition">
                Ver Rede Completa
            </button>
        `;

        this.update();
    },

    update: function () {
        const container = document.getElementById('widget-top-units-list');
        if (!container || typeof franchises === 'undefined') return;

        const sorted = [...franchises].sort((a, b) => (b.students || 0) - (a.students || 0)).slice(0, 5);

        container.innerHTML = sorted.map((f, i) => `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs">
                    ${i + 1}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm text-slate-700 truncate">${f.name}</p>
                    <p class="text-[10px] text-slate-400">${f.students || 0} alunos</p>
                </div>
            </div>
        `).join('');
    }
});

// ===== MATRIX AI AUDITOR WIDGET =====
registerWidget({
    id: 'matrix-ai-auditor',
    name: 'Auditor Empresarial IA',
    description: 'Insights estratégicos personalizados para toda a rede',
    size: 'col-span-12',
    category: 'IA',
    icon: 'fa-solid fa-brain',

    render: function (container) {
        container.innerHTML = `
            <div class="relative overflow-hidden h-full flex flex-col">
                <div class="flex justify-end mb-4 relative z-10">
                    <button onclick="if(typeof listenToAudit === 'function') listenToAudit()" id="btn-audio"
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
                    <button onclick="if(typeof runAiAnalysis === 'function') runAiAnalysis(true)"
                        class="w-full py-2 text-[10px] font-bold uppercase rounded-xl border border-slate-200 hover:border-orange-500 text-slate-500 hover:text-orange-500 transition-all">
                        <i class="fa-solid fa-rotate mr-1"></i> Atualizar
                    </button>
                </div>
            </div>
        `;

        // Automatically trigger AI analysis on load (with a small delay to ensure DOM is ready)
        setTimeout(() => {
            if (typeof runAiAnalysis === 'function') {
                runAiAnalysis();
            }
        }, 800);
    },

    update: function () {
        // AI content updates via runAiAnalysis
    }
});

// ===== UNIT DETAIL STATS WIDGET =====
registerWidget({
    id: 'matrix-unit-stats',
    name: 'Métricas da Unidade',
    description: 'KPIs principais da unidade selecionada',
    size: 'col-span-12',
    category: 'Detalhes Unidade',
    icon: 'fa-solid fa-chart-line',

    render: function (container) {
        container.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <!-- Students -->
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-blue-100">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Alunos</p>
                        <div class="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>
                    <h3 id="widget-unit-students" class="text-xl font-black text-slate-900">--</h3>
                    <p class="text-[9px] text-green-500 font-bold mt-1 flex items-center gap-1"><i class="fa-solid fa-arrow-up"></i> 12% este mês</p>
                </div>
                
                <!-- Teachers -->
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-purple-100">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Professores</p>
                        <div class="w-7 h-7 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-graduation-cap"></i>
                        </div>
                    </div>
                    <h3 id="widget-unit-teachers" class="text-xl font-black text-slate-900">--</h3>
                    <p class="text-[9px] text-slate-400 font-bold mt-1">Corpo Docente</p>
                </div>

                <!-- Revenue -->
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-green-100">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Receita Mensal</p>
                        <div class="w-7 h-7 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-wallet"></i>
                        </div>
                    </div>
                    <h3 id="widget-unit-revenue" class="text-xl font-black text-slate-900">R$ --</h3>
                    <p class="text-[9px] text-slate-400 font-bold mt-1">Deste mês</p>
                </div>
                <!-- Ticket -->
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-orange-100 relative overflow-hidden group">
                     <div class="flex justify-between items-start mb-2 relative z-10">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Ticket Médio</p>
                        <span class="px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 text-[7px] font-bold"><i class="fa-solid fa-sparkles"></i> IA</span>
                    </div>
                    <h3 id="widget-unit-ticket" class="text-xl font-black text-slate-900 relative z-10">R$ --</h3>
                    <i class="fa-solid fa-chart-pie absolute -bottom-3 -right-3 text-6xl text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-500"></i>
                </div>
                <!-- Royalties -->
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-orange-100">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Repasse Matriz</p>
                        <div class="w-7 h-7 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-[10px]">
                            <i class="fa-solid fa-hand-holding-dollar"></i>
                        </div>
                    </div>
                    <h3 id="widget-unit-royalties" class="text-xl font-black text-slate-900">R$ --</h3>
                    <p id="widget-unit-royalties-label" class="text-[9px] text-slate-400 font-bold mt-1">Vencimento: 05/Próx</p>
                </div>
            </div>
        `;
        this.update();
    },

    update: function () {
        if (typeof selectedFranchiseId !== 'undefined' && typeof franchises !== 'undefined' && typeof students !== 'undefined') {
            const franchise = franchises.find(f => f._id === selectedFranchiseId);
            if (!franchise) return;

            // Calculate metrics logic
            const unitStudents = students.filter(s => {
                const sFid = (s.franchiseId && s.franchiseId._id) ? s.franchiseId._id : s.franchiseId;
                return String(sFid) === String(selectedFranchiseId);
            });

            const unitTeachers = (typeof teachers !== 'undefined') ? teachers.filter(t => {
                const tFid = (t.franchiseId && t.franchiseId._id) ? t.franchiseId._id : t.franchiseId;
                return String(tFid) === String(selectedFranchiseId);
            }) : [];

            const studentsCount = unitStudents.length;
            const teachersCount = unitTeachers.length;
            const monthlyRevenue = unitStudents.reduce((sum, s) => {
                let val = 0;
                if (Array.isArray(s.amount)) val = s.amount[s.amount.length - 1];
                else val = parseFloat(s.amount) || 0;
                return sum + val;
            }, 0);

            const averageTicket = studentsCount > 0 ? monthlyRevenue / studentsCount : 0;
            const royaltyPercent = franchise.royaltyPercent || 5;
            const matrixRoyalty = monthlyRevenue * (royaltyPercent / 100);

            // Update DOM
            const elStudents = document.getElementById('widget-unit-students');
            const elTeachers = document.getElementById('widget-unit-teachers');
            const elRevenue = document.getElementById('widget-unit-revenue');
            const elTicket = document.getElementById('widget-unit-ticket');
            const elRoyalties = document.getElementById('widget-unit-royalties');
            const elRoyaltiesLabel = document.getElementById('widget-unit-royalties-label');

            if (elStudents) elStudents.textContent = studentsCount;
            if (elTeachers) elTeachers.textContent = teachersCount;
            if (elRevenue) elRevenue.textContent = formatCurrency(monthlyRevenue);
            if (elTicket) elTicket.textContent = formatCurrency(averageTicket);
            if (elRoyalties) elRoyalties.textContent = formatCurrency(matrixRoyalty);
            if (elRoyaltiesLabel) elRoyaltiesLabel.textContent = `Repasse Matriz (${royaltyPercent}%)`;

            // Dynamic Student Growth
            // Dynamic Student Growth
            const elGrowthLabel = document.querySelector('#widget-unit-students + p');
            if (elGrowthLabel) {
                // Try to use global metrics or fetch if needed (assuming loadUnitHistoricalMetrics exists as seen in other widgets)
                let unitMetrics = [];
                if (typeof metrics !== 'undefined') {
                    unitMetrics = metrics.filter(m => {
                        const mFid = (m.franchiseId && m.franchiseId._id) ? m.franchiseId._id : m.franchiseId;
                        return String(mFid) === String(selectedFranchiseId);
                    });
                }

                if (unitMetrics.length < 2 && typeof loadUnitHistoricalMetrics === 'function') {
                    // Fallback: fetch directly if global metrics are empty or filtered out
                    loadUnitHistoricalMetrics(selectedFranchiseId).then(fetched => {
                        updateGrowthLabel(elGrowthLabel, fetched);
                    });
                } else {
                    updateGrowthLabel(elGrowthLabel, unitMetrics);
                }
            }

            function updateGrowthLabel(label, data) {
                if (!data || data.length < 2) {
                    label.innerHTML = `<i class="fa-solid fa-minus"></i> 0% este mês`;
                    label.className = `text-[9px] font-bold mt-1 flex items-center gap-1 text-slate-400`;
                    return;
                }

                const sorted = data.sort((a, b) => b.period.localeCompare(a.period));
                const current = sorted[0].students.total;
                const previous = sorted[1].students.total;
                const diff = current - previous;
                const pct = previous > 0 ? Math.round((diff / previous) * 100) : 0;
                const isPositive = pct >= 0;

                label.className = `text-[9px] font-bold mt-1 flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`;
                label.innerHTML = `<i class="fa-solid ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> ${Math.abs(pct)}% este mês`;
            }
        }
    }
});

// ===== UNIT PERFORMANCE CHART WIDGET =====
registerWidget({
    id: 'matrix-unit-performance',
    name: 'Desempenho da Unidade',
    description: 'Evolução mensal de faturamento e alunos da academia selecionada',
    size: 'col-span-12',
    category: 'Detalhes Unidade',
    icon: 'fa-solid fa-chart-line',

    render: function (container) {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-3xl border border-slate-100 h-64 md:h-80 shadow-sm transition-all hover:shadow-md">
                 <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <i class="fa-solid fa-chart-area text-blue-500 text-xs"></i> Evolução da Academia
                    </h3>
                    <div class="flex bg-slate-50 rounded-xl p-1 border border-slate-100 w-full sm:w-auto">
                        <button onclick="toggleUnitChart('financial')" id="btn-unit-chart-fin" 
                            class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-bold bg-white shadow-sm text-blue-600 transition-all">
                            Financeiro
                        </button>
                        <button onclick="toggleUnitChart('students')" id="btn-unit-chart-std" 
                            class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-bold text-slate-500 hover:text-slate-700 transition-all">
                            Alunos
                        </button>
                    </div>
                </div>
                <div class="h-40 md:h-52 relative">
                    <canvas id="unit-performance-chart"></canvas>
                </div>
            </div>
        `;
        this.update();
    },

    update: async function () {
        if (typeof selectedFranchiseId === 'undefined' || !selectedFranchiseId) return;

        const canvas = document.getElementById('unit-performance-chart');
        if (canvas && typeof Chart !== 'undefined') {
            if (window.unitChartInstance) window.unitChartInstance.destroy();

            // Load metrics for this specific unit
            const unitMetrics = await loadUnitHistoricalMetrics(selectedFranchiseId);
            if (!unitMetrics || unitMetrics.length === 0) return;

            const ctx = canvas.getContext('2d');
            const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

            // Sort metrics by period
            const sortedMetrics = [...unitMetrics].sort((a, b) => a.period.localeCompare(b.period));

            const labels = sortedMetrics.map(m => {
                const [year, month] = m.period.split('-');
                return monthNames[parseInt(month) - 1];
            });

            const currentType = window.currentUnitChartType || 'financial';
            const data = currentType === 'financial'
                ? sortedMetrics.map(m => m.finance.revenue)
                : sortedMetrics.map(m => m.students.total);

            const color = currentType === 'financial' ? '#3b82f6' : '#8b5cf6';
            const bgColor = currentType === 'financial' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)';

            window.unitChartInstance = new Chart(ctx, {
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
                        pointRadius: 4
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
    }
});

window.toggleUnitChart = function (type) {
    window.currentUnitChartType = type;
    const btnFin = document.getElementById('btn-unit-chart-fin');
    const btnStd = document.getElementById('btn-unit-chart-std');

    if (type === 'financial') {
        if (btnFin) btnFin.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
        if (btnFin) btnFin.classList.remove('text-slate-500');
        if (btnStd) btnStd.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600', 'text-purple-600');
        if (btnStd) btnStd.classList.add('text-slate-500');
    } else {
        if (btnStd) btnStd.classList.add('bg-white', 'shadow-sm', 'text-purple-600');
        if (btnStd) btnStd.classList.remove('text-slate-500');
        if (btnFin) btnFin.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
        if (btnFin) btnFin.classList.add('text-slate-500');
    }

    const widget = typeof WIDGET_REGISTRY !== 'undefined' ? WIDGET_REGISTRY['matrix-unit-performance'] : null;
    if (widget && typeof widget.update === 'function') widget.update();
};

// ===== UNIT STUDENTS LIST WIDGET =====
registerWidget({
    id: 'matrix-unit-students',
    name: 'Lista de Alunos da Unidade',
    description: 'Tabela de alunos registrados na unidade, com filtros e busca',
    size: 'col-span-12',
    category: 'Detalhes Unidade',
    icon: 'fa-solid fa-users',

    render: function (container) {
        // Reusing existing HTML structure for students table
        container.innerHTML = `
            <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 card-shadow">
                <div class="flex flex-col gap-6 mb-6">
                    <!-- Top Row: Actions -->
                    <div class="flex justify-end">
                        <button onclick="if(typeof openStudentForm === 'function') openStudentForm()" class="text-[9px] font-bold text-white orange-gradient px-5 py-2.5 rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-2 uppercase tracking-tight">
                            <i class="fa-solid fa-user-plus"></i> Novo Aluno
                        </button>
                    </div>

                    <!-- Filter Row (Matched with Franchisee App) -->
                    <div class="flex flex-col md:flex-row gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div class="relative flex-1">
                            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                            <input type="text" id="student-search" oninput="if(typeof resetMatrixStudentPage === 'function') resetMatrixStudentPage(); if(typeof renderStudents === 'function') renderStudents()" placeholder="Buscar por nome..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <select id="filter-belt" onchange="if(typeof resetMatrixStudentPage === 'function') resetMatrixStudentPage(); if(typeof renderStudents === 'function') renderStudents()" 
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
                            </select>
                            <select id="filter-degree" onchange="if(typeof resetMatrixStudentPage === 'function') resetMatrixStudentPage(); if(typeof renderStudents === 'function') renderStudents()" 
                                class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                                <option value="Todos">Todos os Graus</option>
                                <option value="Nenhum">Nenhum</option>
                                <option value="1º Grau">1º Grau</option>
                                <option value="2º Grau">2º Grau</option>
                                <option value="3º Grau">3º Grau</option>
                                <option value="4º Grau">4º Grau</option>
                            </select>
                            <select id="filter-payment" onchange="if(typeof resetMatrixStudentPage === 'function') resetMatrixStudentPage(); if(typeof renderStudents === 'function') renderStudents()" 
                                class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                                <option value="Todos">Financeiro</option>
                                <option value="Paga">Em Dia</option>
                                <option value="Atrasada">Em Atraso</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th class="pb-4 px-2 sortable group cursor-pointer hover:text-orange-500 transition-colors" onclick="setSort('name')" id="th-name">
                                    Aluno / Faixa <i class="fa-solid fa-sort sort-icon ml-1 opacity-30 group-hover:opacity-100"></i>
                                </th>
                                <th class="pb-4 px-2 sortable group cursor-pointer hover:text-orange-500 transition-colors" onclick="setSort('phone')" id="th-phone">
                                    Contato <i class="fa-solid fa-sort sort-icon ml-1 opacity-30 group-hover:opacity-100"></i>
                                </th>
                                <th class="pb-4 px-2 sortable group cursor-pointer hover:text-orange-500 transition-colors" onclick="setSort('monthlyFee')" id="th-monthlyFee">
                                    Mensalidade <i class="fa-solid fa-sort sort-icon ml-1 opacity-30 group-hover:opacity-100"></i>
                                </th>
                                <th class="pb-4 px-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="students-list-body" class="divide-y divide-slate-50"></tbody>
                    </table>
                    <div id="no-students-msg" class="hidden py-12 text-center text-slate-400 text-xs italic">Nenhum aluno registrado.</div>
                </div>
                
                <!-- Pagination Container -->
                <div id="matrix-students-pagination"></div>
            </div>
        `;
        // Note: The actual population of the table is handled by the global renderStudents() function in standalone-app.js, 
        // which targets 'students-list-body'. We just need to ensure the ID matches.

        // Trigger render
        setTimeout(() => {
            if (typeof renderStudents === 'function') renderStudents();
        }, 100);
    },
    update: function () {
        if (typeof renderStudents === 'function') renderStudents();
    }
});

// ===== UNIT TEACHERS LIST WIDGET =====
registerWidget({
    id: 'matrix-unit-teachers',
    name: 'Lista de Professores da Unidade',
    description: 'Tabela de professores registrados na unidade, com filtros e busca',
    size: 'col-span-12',
    category: 'Detalhes Unidade',
    icon: 'fa-solid fa-graduation-cap',

    render: function (container) {
        container.innerHTML = `
            <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 card-shadow">
                <div class="flex flex-col gap-6 mb-6">
                    <div class="flex justify-between items-center">
                         <div></div>
                        <button onclick="if(typeof openTeacherForm === 'function') openTeacherForm()" class="text-[9px] font-bold text-white orange-gradient px-5 py-2.5 rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-2 uppercase tracking-tight">
                            <i class="fa-solid fa-plus"></i> Novo Professor
                        </button>
                    </div>

                    <div class="flex flex-col md:flex-row gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div class="relative flex-1">
                            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                            <input type="text" id="teacher-search" oninput="if(typeof renderTeachers === 'function') renderTeachers()" placeholder="Buscar por nome..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <select id="teacher-filter-belt" onchange="if(typeof renderTeachers === 'function') renderTeachers()" 
                                class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                                <option value="Todas">Todas as Faixas</option>
                                <option value="Roxa">Roxa</option>
                                <option value="Marrom">Marrom</option>
                                <option value="Preta">Preta</option>
                                <option value="Coral">Coral</option>
                                <option value="Vermelha">Vermelha</option>
                            </select>
                            <select id="teacher-filter-degree" onchange="if(typeof renderTeachers === 'function') renderTeachers()" 
                                class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none focus:ring-2 focus:ring-orange-500">
                                <option value="Todos">Todos os Graus</option>
                                <option value="Nenhum">Nenhum</option>
                                <option value="1º Grau">1º Grau</option>
                                <option value="2º Grau">2º Grau</option>
                                <option value="3º Grau">3º Grau</option>
                                <option value="4º Grau">4º Grau</option>
                                <option value="5º Grau">5º Grau</option>
                                <option value="6º Grau">6º Grau</option>
                                <option value="7º Grau">7º Grau</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th class="pb-4 px-2">Professor / Faixa</th>
                                <th class="pb-4 px-2">Gênero</th>
                                <th class="pb-4 px-2">Telefone</th>
                                <th class="pb-4 px-2">Endereço</th>
                                <th class="pb-4 px-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="teachers-list-body" class="divide-y divide-slate-50"></tbody>
                    </table>
                    <div id="no-teachers-msg" class="hidden py-12 text-center text-slate-400 text-xs italic">Nenhum professor registrado.</div>
                </div>
            </div>
        `;

        setTimeout(() => {
            if (typeof renderTeachers === 'function') renderTeachers();
        }, 100);
    },
    update: function () {
        if (typeof renderTeachers === 'function') renderTeachers();
    }
});

// ===== UNIT AI AUDITOR WIDGET =====
registerWidget({
    id: 'matrix-unit-ai-auditor',
    name: 'Auditor Empresarial IA',
    description: 'Insights estratégicos personalizados para esta unidade',
    size: 'lg:col-span-12',
    category: 'Detalhes Unidade',
    icon: 'fa-solid fa-brain',

    render: function (container) {
        container.innerHTML = `
            <div class="relative overflow-hidden h-full flex flex-col">
                <div class="flex justify-end mb-4 relative z-10">
                    <button onclick="if(typeof listenToAudit === 'function') listenToAudit('ai-insight-content-unit')" id="btn-audio-unit"
                        class="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                        <i class="fa-solid fa-volume-high text-xs"></i>
                    </button>
                </div>
                <div id="ai-insight-content-unit"
                    class="flex-1 text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 overflow-y-auto max-h-[300px] relative z-10 text-[11px] leading-relaxed custom-scrollbar">
                    <div class="flex flex-col items-center justify-center h-full py-8 text-slate-400 italic">
                        <i class="fa-solid fa-circle-notch animate-spin mb-2 text-orange-500"></i>
                        <span class="animate-pulse">Conectando...</span>
                    </div>
                </div>
                <div class="mt-4">
                    <button onclick="if(typeof runAiAnalysis === 'function') runAiAnalysis(true, 'ai-insight-content-unit')"
                        class="w-full py-2 text-[10px] font-bold uppercase rounded-xl border border-slate-200 hover:border-orange-500 text-slate-500 hover:text-orange-500 transition-all">
                        <i class="fa-solid fa-rotate mr-1"></i> Atualizar
                    </button>
                </div>
            </div>
        `;

        // Trigger analysis
        setTimeout(() => {
            if (typeof runAiAnalysis === 'function') runAiAnalysis(false, 'ai-insight-content-unit');
        }, 500);
    },
    update: function () {
        if (typeof runAiAnalysis === 'function') runAiAnalysis(false, 'ai-insight-content-unit');
    }
});

console.log('✅ Matrix Widgets loaded');
