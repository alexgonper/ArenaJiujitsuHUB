// ===== IMPORTS AND INITIALIZATION =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, deleteDoc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ===== GLOBAL STATE =====
let app = null;
let auth = null;
let db = null;
let user = null;
let franchises = [];
let directives = [];
let selectedFranchiseId = null;
let map = null;
let markers = [];
let currentVariationIndex = 0;
let mainChartObj = null;
let unitChartObj = null;

// Current marketing data for regeneration
window.currentMarketingData = null;
window.currentMarketingImageUrl = null;

// ===== INITIALIZATION =====
async function init() {
    if (appConfig.enableFirebase) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Initialize authentication
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }

        // Setup auth state listener
        onAuthStateChanged(auth, (u) => {
            user = u;
            if (user) {
                loadDataFromFirebase();
                loadDirectivesFromFirebase();
            }
        });
    } else {
        // Use mock data
        franchises = mockFranchises;
        renderNetwork();
        renderTopUnits();
        updateStats();
        initMainChart();
    }
}

// ===== FIREBASE DATA FUNCTIONS =====
function loadDataFromFirebase() {
    const colFranchises = collection(db, 'artifacts', appConfig.appId, 'public', 'data', 'franchises');

    onSnapshot(colFranchises, (snap) => {
        franchises = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Seed data if empty
        if (franchises.length === 0) {
            mockFranchises.forEach(f => {
                const { id, ...data } = f;
                addDoc(colFranchises, data);
            });
            return;
        }

        renderNetwork();
        renderTopUnits();
        updateStats();
        initMainChart();
        if (map) updateMapMarkers();
    });
}

function loadDirectivesFromFirebase() {
    const colDirectives = collection(db, 'artifacts', appConfig.appId, 'public', 'data', 'directives');

    onSnapshot(colDirectives, (snap) => {
        directives = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderDirectives();
    });
}

// ===== AI HELPER FUNCTIONS =====
function formatAiResponse(text) {
    let clean = text.replace(/[#\*_]/g, '');
    clean = clean.replace(/^[ \t]*[-+]\s+/gm, '• ');
    clean = clean.replace(/\n{3,}/g, '\n\n');

    let lines = clean.split('\n');
    let html = lines.map(line => {
        let trimmed = line.trim();
        if (!trimmed) return '<br>';
        if (trimmed.length < 50 && (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':'))) {
            return `<span class="section-title">${trimmed}</span>`;
        }
        return `<div>${trimmed}</div>`;
    }).join('');

    return `<div class="ai-response-content">${html}</div>`;
}

async function callGemini(prompt, systemInstruction = "Mentor Matrix Arena Jiu-Jitsu.") {
    const apiBase = window.API_URL || 'http://localhost:5000/api/v1';

    try {
        const response = await fetch(`${apiBase}/ai/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({
                prompt: prompt,
                systemInstruction: systemInstruction + " IMPORTANTE: Não use caracteres especiais como #, *, _ ou hífens. Texto limpo."
            })
        });

        const json = await response.json();

        if (!json.success || !json.data) {
            throw new Error(json.error || 'Falha na resposta da IA');
        }

        let textResponse = json.data;

        // Clean markdown code block markers from Gemini response
        if (typeof textResponse === 'string') {
            textResponse = textResponse
                .replace(/```html\n?/gi, '')
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/g, '')
                .trim();
        }

        return textResponse;
    } catch (error) {
        console.error("Error calling backend AI:", error);
        return generateMockAIResponse(prompt);
    }
}

async function callImagen(prompt) {
    const apiBase = window.API_URL || 'http://localhost:5000/api/v1';

    try {
        const finalPrompt = `${ARENA_PERSONA_PROMPT}. Scenario: ${prompt}. Cinematic lighting, professional photography.`;

        const response = await fetch(`${apiBase}/ai/image`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({ prompt: finalPrompt })
        });

        const json = await response.json();

        if (!json.success || !json.data) {
            throw new Error(json.error || 'Falha na geração de imagem');
        }

        return json.data;
    } catch (error) {
        console.error("Error calling backend Image service:", error);
        return generateMockImage();
    }
}

function generateMockAIResponse(prompt) {
    const responses = {
        "health": "ANÁLISE DE SAÚDE DA UNIDADE\n\nPontos Fortes:\n• Taxa de retenção acima da média do setor\n• Crescimento consistente nos últimos 3 meses\n• Receita estável com boa margem de lucro\n\nÁreas de Atenção:\n• Diversificação de horários pode aumentar capacidade\n• Marketing digital pode expandir alcance\n• Implementar programa de fidelidade\n\nRecomendações:\n• Manter foco na qualidade do ensino\n• Expandir parcerias locais\n• Investir em eventos comunitários",
        "swot": "ANÁLISE SWOT\n\nFORÇAS:\n• Localização estratégica\n• Instrutores qualificados\n• Base de alunos fiel\n• Infraestrutura adequada\n\nFRAQUEZAS:\n• Presença digital limitada\n• Horários restritos\n• Programa de marketing básico\n\nOPORTUNIDADES:\n• Mercado em crescimento\n• Parcerias corporativas\n• Expansão de modalidades\n• Eventos e competições\n\nAMEAÇAS:\n• Concorrência local\n• Sazonalidade de matrículas\n• Flutuação econômica",
        "prediction": "PREVISÃO ESTRATÉGICA\n\nTendências Projetadas:\n• Crescimento estimado de 15-20% nos próximos 6 meses\n• Aumento da demanda por aulas infantis\n• Potencial para turmas corporativas\n\nAções Recomendadas:\n• Preparar infraestrutura para expansão\n• Contratar instrutor adicional\n• Desenvolver programa kids especializado\n• Criar parcerias com empresas locais"
    };

    // Determine response type based on prompt
    if (prompt.toLowerCase().includes('swot')) return responses.swot;
    if (prompt.toLowerCase().includes('previsão') || prompt.toLowerCase().includes('prediction')) return responses.prediction;
    return responses.health;
}

function generateMockImage() {
    // Return a placeholder image (orange gradient)
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 800, 800);
    gradient.addColorStop(0, '#FF6B00');
    gradient.addColorStop(1, '#FF8A00');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ARENA JIU-JITSU', 400, 400);

    return canvas.toDataURL('image/png');
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

    // Close mobile menu if open
    if (window.innerWidth < 1024) {
        toggleMobileMenu();
    }

    // Update section title
    const titles = {
        'overview': 'Dashboard de Performance',
        'network': 'Rede de Academias',
        'communication': 'Matrix Hub',
        'unit-detail': 'Detalhes da Unidade'
    };
    document.getElementById('section-title').textContent = titles[id] || 'Arena Matrix';
};

window.openModal = (html) => {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('ui-modal').classList.remove('hidden');
};

window.closeModal = () => {
    document.getElementById('ui-modal').classList.add('hidden');
};

window.toggleSensei = () => {
    document.getElementById('sensei-window').classList.toggle('hidden');
};

// ===== STATS AND DASHBOARD =====
function updateStats() {
    const totalStudents = franchises.reduce((sum, f) => sum + (f.students || 0), 0);
    const totalRevenue = franchises.reduce((sum, f) => sum + (f.revenue || 0), 0);
    const totalUnits = franchises.length;
    const intlUnits = franchises.filter(f =>
        !f.address.toLowerCase().includes('- sc') &&
        !f.address.toLowerCase().includes('- pr')
    ).length;

    document.getElementById('stat-total-students').textContent = totalStudents.toLocaleString();
    document.getElementById('stat-total-revenue').textContent = `R$ ${totalRevenue.toLocaleString()}`;
    document.getElementById('stat-unit-count').textContent = totalUnits;
    document.getElementById('intl-count-badge').textContent = `${intlUnits} ${intlUnits === 1 ? 'Local' : 'Locais'}`;
}

function renderTopUnits() {
    const sorted = [...franchises].sort((a, b) => (b.students || 0) - (a.students || 0)).slice(0, 5);
    const html = sorted.map((f, i) => `
        <div class="flex items-center gap-4 text-[10px]">
            <div class="w-6 h-6 rounded-full bg-slate-50 border flex items-center justify-center font-black text-slate-600">${i + 1}</div>
            <p class="flex-1 font-bold text-slate-800">${f.name}</p>
            <p class="font-black text-orange-600">${f.students}</p>
        </div>
    `).join('');

    document.getElementById('top-units-list').innerHTML = html;
}

// ===== CHARTS =====
window.initMainChart = (type = 'financial') => {
    const ctx = document.getElementById('performanceChart').getContext('2d');

    if (mainChartObj) {
        mainChartObj.destroy();
    }

    const data = type === 'financial'
        ? [250000, 280000, 260000, 310000, 330000, 365000]
        : [250, 280, 260, 310, 330, 365];

    mainChartObj = new Chart(ctx, {
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

    // Update button states
    document.querySelectorAll('[id^="btn-chart-"]').forEach(btn => {
        btn.classList.remove('bg-white', 'shadow', 'text-orange-600');
        btn.classList.add('text-slate-500');
    });
    document.getElementById(`btn-chart-${type}`).classList.add('bg-white', 'shadow', 'text-orange-600');
    document.getElementById(`btn-chart-${type}`).classList.remove('text-slate-500');
};

window.toggleMainChart = (type) => {
    initMainChart(type);
};

window.initUnitChart = (type, franchise) => {
    const ctx = document.getElementById('unitDetailChart').getContext('2d');

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

    unitChartObj = new Chart(ctx, {
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
};

// ===== NETWORK VIEW =====
function renderNetwork() {
    const grid = document.getElementById('units-list-view');
    const html = franchises.map(f => `
        <div class="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 card-shadow flex flex-col group hover:border-orange-200 transition-all hover-lift">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-slate-900 group-hover:text-orange-600 transition truncate text-sm md:text-base">${f.name}</h3>
                    <p class="text-[9px] text-slate-400 font-bold uppercase truncate">${f.owner}</p>
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
                <div class="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                    <div class="flex items-center gap-1">
                        <i class="fa-solid fa-users text-blue-500 text-xs"></i>
                        <span class="text-slate-700 font-bold">${f.students}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <i class="fa-solid fa-graduation-cap text-orange-500 text-xs"></i>
                        <span class="text-slate-700 font-bold">${f.teachers || 0}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <i class="fa-solid fa-dollar-sign text-green-500 text-xs"></i>
                        <span class="text-slate-700 font-bold">${(f.revenue / 1000).toFixed(0)}k</span>
                    </div>
                </div>
            </div>
            <button onclick="viewUnitDetail('${f.id}')" class="w-full py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition shadow-lg">
                Auditores IA ✨
            </button>
        </div>
    `).join('');

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

        if (!map) {
            initMap();
        }
    }
};

window.openUnitForm = () => {
    alert("Modo Demo: Funcionalidade de adicionar nova unidade estará disponível em breve!");
};

// ===== MAP FUNCTIONS =====
function initMap() {
    map = L.map('map-container').setView([-25.4296, -49.2719], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19
    }).addTo(map);

    updateMapMarkers();
}

function updateMapMarkers() {
    if (!map) return;

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // Add new markers
    franchises.forEach(f => {
        if (f.lat && f.lng) {
            const marker = L.marker([f.lat, f.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    iconSize: [12, 12]
                })
            }).addTo(map);

            marker.bindPopup(`
                <div class="p-2">
                    <p class="text-[10px] font-bold mb-1">${f.name}</p>
                    <p class="text-[8px] text-slate-500 mb-2">${f.students} alunos</p>
                    <button onclick="viewUnitDetail('${f.id}')" class="w-full text-[8px] bg-slate-900 text-white px-2 py-1 rounded">Ver Detalhes</button>
                </div>
            `);

            markers.push(marker);
        }
    });
}

// ===== UNIT DETAIL =====
window.viewUnitDetail = (id) => {
    const franchise = franchises.find(f => f.id === id);
    if (!franchise) return;

    selectedFranchiseId = id;

    document.getElementById('detail-title').textContent = franchise.name;
    document.getElementById('detail-subtitle').textContent = `${franchise.owner} | ${franchise.address}`;
    document.getElementById('detail-students').textContent = franchise.students || 0;
    document.getElementById('detail-revenue').textContent = `R$ ${(franchise.revenue || 0).toLocaleString()}`;
    document.getElementById('detail-expenses').textContent = `R$ ${(franchise.expenses || 0).toLocaleString()}`;

    // Reset prediction badges
    document.getElementById('ai-prediction-badge').classList.add('hidden');
    document.getElementById('pred-students').textContent = '';
    document.getElementById('pred-revenue').textContent = '';

    // Show loading state
    document.getElementById('ai-insight-content').innerHTML = `
        <div class="flex flex-col items-center py-8 text-center">
            <div class="loading-spinner mb-3"></div>
            <p class="text-slate-600 font-medium">Analisando dados...</p>
        </div>
    `;

    changeSection('unit-detail');
    initUnitChart('finance', franchise);
    runUnitHealthCheck();
};

window.runUnitHealthCheck = async () => {
    const franchise = franchises.find(f => f.id === selectedFranchiseId);
    if (!franchise) return;

    try {
        const prompt = `Análise de saúde da unidade ${franchise.name}. Alunos: ${franchise.students}. Receita mensal: R$ ${franchise.revenue}. Despesas: R$ ${franchise.expenses}. Localização: ${franchise.address}.`;
        const response = await callGemini(prompt, "Você é um consultor especializado em academias de artes marciais. Forneça análise objetiva e acionável.");

        document.getElementById('ai-insight-content').innerHTML = formatAiResponse(response);
    } catch (error) {
        document.getElementById('ai-insight-content').innerHTML = `
            <p class="text-red-500">Erro ao gerar análise. Tente novamente.</p>
        `;
    }
};

// ===== AI FEATURES =====
window.runSwotAnalysisIA = async () => {
    const franchise = franchises.find(f => f.id === selectedFranchiseId);
    if (!franchise) return;

    openModal(`
        <div class="flex flex-col items-center py-16 text-center space-y-4">
            <div class="loading-spinner"></div>
            <p class="font-black text-slate-800 text-lg">Gerando Análise SWOT...</p>
            <p class="text-sm text-slate-500">Isso pode levar alguns segundos</p>
        </div>
    `);

    try {
        const prompt = `Análise SWOT completa para ${franchise.name} em ${franchise.address}. Considere: ${franchise.students} alunos, receita R$ ${franchise.revenue}, mercado local de artes marciais.`;
        const response = await callGemini(prompt, "Consultor estratégico especializado em academias.");

        openModal(`
            <div class="p-6">
                <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white">
                        <i class="fa-solid fa-layer-group text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-black">Análise SWOT ✨</h3>
                        <p class="text-xs text-slate-500">${franchise.name}</p>
                    </div>
                </div>
                ${formatAiResponse(response)}
            </div>
        `);
    } catch (error) {
        closeModal();
        alert("Erro ao gerar análise SWOT. Tente novamente.");
    }
};

window.runAdvancedPrediction = async () => {
    const franchise = franchises.find(f => f.id === selectedFranchiseId);
    if (!franchise) return;

    openModal(`
        <div class="flex flex-col items-center py-16 text-center space-y-4">
            <div class="loading-spinner"></div>
            <p class="font-black text-slate-800 text-lg">Calculando Previsões...</p>
        </div>
    `);

    try {
        const prompt = `Previsão de crescimento para ${franchise.name}. Dados atuais: ${franchise.students} alunos, R$ ${franchise.revenue} receita mensal. Forneça estimativas realistas para 3 e 6 meses.`;
        const response = await callGemini(prompt, "Analista de dados especializado em negócios fitness.");

        // Update prediction badges
        const studentsGrowth = Math.floor(franchise.students * 1.15);
        const revenueGrowth = Math.floor(franchise.revenue * 1.12);

        document.getElementById('pred-students').textContent = `↑ ${studentsGrowth} (em 6m)`;
        document.getElementById('pred-revenue').textContent = `↑ R$ ${revenueGrowth.toLocaleString()} (em 6m)`;
        document.getElementById('ai-prediction-badge').classList.remove('hidden');

        openModal(`
            <div class="p-6">
                <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white">
                        <i class="fa-solid fa-chart-line text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-black">Previsão Estratégica ✨</h3>
                        <p class="text-xs text-slate-500">${franchise.name}</p>
                    </div>
                </div>
                ${formatAiResponse(response)}
            </div>
        `);
    } catch (error) {
        closeModal();
        alert("Erro ao gerar previsão. Tente novamente.");
    }
};

// ===== MARKETING KIT =====
window.generateMarketingKit = async () => {
    const franchise = franchises.find(f => f.id === selectedFranchiseId);
    if (!franchise) return;

    openModal(`
        <div class="flex flex-col items-center py-16 text-center space-y-4">
            <div class="loading-spinner"></div>
            <p class="font-black text-slate-800 text-lg">Gerando Marketing Kit...</p>
            <p class="text-sm text-slate-500">Criando visual e campanhas personalizadas</p>
        </div>
    `);

    try {
        const prompt = `Crie um kit de marketing completo para ${franchise.name} em ${franchise.address}. Retorne APENAS um objeto JSON válido com esta estrutura exata:
{
  "visualPrompt": "descrição detalhada para gerar imagem promocional",
  "variations": [
    {
      "title": "Instagram",
      "caption": "legenda criativa para post",
      "email": "email de boas-vindas profissional"
    },
    {
      "title": "Facebook",
      "caption": "legenda para Facebook",
      "email": "email de promoção"
    },
    {
      "title": "Campanha Local",
      "caption": "mensagem para comunidade local",
      "email": "email de evento"
    }
  ]
}`;

        const responseText = await callGemini(prompt, "Você é um especialista em marketing para academias. Retorne APENAS JSON puro, sem markdown ou explicações.");

        // Try to parse JSON from response
        let data;
        try {
            // Extract JSON if wrapped in markdown code blocks
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                data = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            // Fallback to mock data if parsing fails
            data = {
                visualPrompt: `Arena Jiu-Jitsu training session in ${franchise.address}, dynamic action shot, professional athletes`,
                variations: [
                    {
                        title: "Instagram",
                        caption: `🥋 Transforme sua vida na ${franchise.name}!\n\n💪 Aulas de Jiu-Jitsu para todos os níveis\n🏆 Instrutores experientes\n👨‍👩‍👧‍👦 Ambiente familiar e acolhedor\n\n📍 ${franchise.address}\n📞 ${franchise.phone}\n\n#JiuJitsu #ArenaJiuJitsu #MarcialArts`,
                        email: `Olá!\n\nBem-vindo à ${franchise.name}! Estamos muito felizes em tê-lo conosco.\n\nNossa missão é proporcionar o melhor ensino de Jiu-Jitsu em um ambiente profissional e acolhedor. Nossa equipe está pronta para ajudá-lo a alcançar seus objetivos.\n\nVenha nos visitar!\n\nEquipe ${franchise.name}`
                    },
                    {
                        title: "Facebook",
                        caption: `Descubra o poder do Jiu-Jitsu na ${franchise.name}! 🥋\n\nOferecemos:\n✅ Aulas para iniciantes e avançados\n✅ Horários flexíveis\n✅ Equipe profissional\n✅ Ambiente seguro\n\nAgende sua aula experimental gratuita!\n\n${franchise.phone}`,
                        email: `Promoção Especial!\n\nMatrícula com 50% de desconto para novos alunos da ${franchise.name}.\n\nEsta é sua chance de começar a treinar Jiu-Jitsu com a melhor equipe da região.\n\nOferta válida até o final do mês. Entre em contato agora!`
                    },
                    {
                        title: "Campanha Local",
                        caption: `A ${franchise.name} é mais que uma academia - somos uma família! 🥋❤️\n\nJunte-se à nossa comunidade e descubra os benefícios do Jiu-Jitsu:\n• Autoconfiança\n• Disciplina\n• Condicionamento físico\n• Novas amizades\n\nVenha treinar conosco!`,
                        email: `Evento Comunitário - ${franchise.name}\n\nConvidamos você e sua família para nosso evento de portas abertas!\n\nData: Próximo sábado\nLocal: ${franchise.address}\n\nAulas demonstrativas gratuitas para todas as idades. Traga seus amigos!\n\nNos vemos lá!`
                    }
                ]
            };
        }

        const imageUrl = await callImagen(data.visualPrompt);

        window.currentMarketingData = data;
        window.currentMarketingImageUrl = imageUrl;
        currentVariationIndex = 0;

        renderMarketingModal(data, imageUrl, franchise.name);
    } catch (error) {
        console.error("Marketing kit error:", error);
        closeModal();
        alert("Erro ao gerar kit de marketing. Tente novamente.");
    }
};

function renderMarketingModal(data, imageUrl, unitName) {
    const content = `
        <div class="text-left space-y-6">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                        <i class="fa-solid fa-bullhorn"></i>
                    </div>
                    <div>
                        <h2 class="text-lg md:text-xl font-black">Marketing Studio ✨</h2>
                        <p class="text-[9px] text-slate-400 font-bold uppercase">${unitName}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div class="space-y-4">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Sugestão Visual IA</p>
                    <div class="relative aspect-square rounded-2xl overflow-hidden shadow-xl bg-slate-100 border border-slate-200">
                        <img src="${imageUrl}" class="w-full h-full object-cover" id="marketing-main-img" alt="Marketing Visual">
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <button onclick="window.open(window.currentMarketingImageUrl, '_blank')" class="flex-1 py-3 text-[9px] font-bold text-orange-500 border border-orange-200 rounded-xl hover:bg-orange-50 transition">
                            <i class="fa-solid fa-download mr-1"></i> Descarregar
                        </button>
                        <button onclick="regenerateMarketingImage()" class="flex-1 py-3 text-[9px] font-bold text-white orange-gradient rounded-xl transition flex items-center justify-center gap-2 hover:scale-105">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Regenerar
                        </button>
                    </div>
                </div>

                <div class="flex flex-col">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-4">Campanhas Estratégicas</p>
                    <div class="flex gap-2 border-b border-slate-100 mb-4 overflow-x-auto no-scrollbar pb-1">
                        ${data.variations.map((v, i) => `
                            <button onclick="switchMarketingTab(${i})" id="m-tab-${i}" class="m-tab pb-2 px-2 text-[9px] whitespace-nowrap uppercase font-bold transition-all ${i === currentVariationIndex ? 'marketing-tab-active' : 'text-slate-400 hover:text-slate-600'}">
                                ${v.title}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div id="marketing-content-root" class="space-y-4 flex-1 max-h-[350px] overflow-y-auto pr-1 no-scrollbar text-[10px]">
                        ${renderMarketingTab(data.variations[currentVariationIndex], currentVariationIndex)}
                    </div>
                </div>
            </div>
        </div>
    `;

    openModal(content);
}

function renderMarketingTab(variation, index) {
    return `
        <div class="animate-in fade-in duration-300 space-y-4">
            <div>
                <div class="flex justify-between items-center mb-2">
                    <span class="font-black text-slate-700 uppercase tracking-tighter">Legenda ${variation.title}</span>
                    <button onclick="regenerateMarketingCaption(${index}, this)" class="text-[9px] text-orange-500 font-bold hover:underline">
                        <i class="fa-solid fa-rotate-right mr-1"></i> Regenerar
                    </button>
                </div>
                <div id="v-cap-${index}" class="bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600 whitespace-pre-wrap">
                    ${variation.caption}
                </div>
            </div>
            <div>
                <div class="flex justify-between items-center mb-2">
                    <span class="font-black text-slate-700 uppercase tracking-tighter">E-mail</span>
                    <button onclick="regenerateMarketingEmail(${index}, this)" class="text-[9px] text-orange-500 font-bold hover:underline">
                        <i class="fa-solid fa-rotate-right mr-1"></i> Regenerar
                    </button>
                </div>
                <div id="v-eml-${index}" class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 whitespace-pre-wrap">
                    ${variation.email}
                </div>
            </div>
        </div>
    `;
}

window.switchMarketingTab = (index) => {
    currentVariationIndex = index;

    document.querySelectorAll('.m-tab').forEach(tab => {
        tab.classList.remove('marketing-tab-active', 'text-slate-800');
        tab.classList.add('text-slate-400');
    });

    const activeTab = document.getElementById(`m-tab-${index}`);
    activeTab.classList.add('marketing-tab-active');
    activeTab.classList.remove('text-slate-400');

    document.getElementById('marketing-content-root').innerHTML = renderMarketingTab(
        window.currentMarketingData.variations[index],
        index
    );
};

window.regenerateMarketingImage = async () => {
    const img = document.getElementById('marketing-main-img');
    img.classList.add('opacity-40');

    try {
        const imageUrl = await callImagen(window.currentMarketingData.visualPrompt + ", dynamic perspective, vibrant colors");
        window.currentMarketingImageUrl = imageUrl;
        img.src = imageUrl;
    } catch (error) {
        alert("Erro ao regenerar imagem.");
    } finally {
        img.classList.remove('opacity-40');
    }
};

window.regenerateMarketingCaption = async (index, button) => {
    const originalText = button.textContent;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Gerando...';
    button.disabled = true;

    const franchise = franchises.find(f => f.id === selectedFranchiseId);

    try {
        const prompt = `Crie uma nova legenda criativa para ${window.currentMarketingData.variations[index].title} para a academia ${franchise.name} em ${franchise.address}. Seja envolvente e use emojis.`;
        const response = await callGemini(prompt, "Copywriter especializado em redes sociais.");

        window.currentMarketingData.variations[index].caption = response.trim();
        document.getElementById(`v-cap-${index}`).textContent = response.trim();
    } catch (error) {
        alert("Erro ao regenerar.");
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
};

window.regenerateMarketingEmail = async (index, button) => {
    const originalText = button.textContent;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Gerando...';
    button.disabled = true;

    const franchise = franchises.find(f => f.id === selectedFranchiseId);

    try {
        const prompt = `Crie um novo email profissional para ${window.currentMarketingData.variations[index].title} para ${franchise.name}. Seja cordial e persuasivo.`;
        const response = await callGemini(prompt, "Especialista em email marketing.");

        window.currentMarketingData.variations[index].email = response.trim();
        document.getElementById(`v-eml-${index}`).textContent = response.trim();
    } catch (error) {
        alert("Erro ao regenerar.");
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
};

// ===== DIRECTIVES =====
window.sendMatrixDirective = async () => {
    const input = document.getElementById('matrix-msg-input');
    const message = input.value.trim();

    if (!message) return;

    const franchise = franchises.find(f => f.id === selectedFranchiseId);

    // Polish the message with AI
    const polished = await callGemini(
        `Transforme esta mensagem em uma diretriz oficial profissional: "${message}"`,
        "Redator corporativo. Seja conciso e profissional."
    );

    const directive = {
        text: polished.trim(),
        targetUnit: franchise.name,
        timestamp: new Date().toISOString()
    };

    if (appConfig.enableFirebase) {
        const colDirectives = collection(db, 'artifacts', appConfig.appId, 'public', 'data', 'directives');
        await addDoc(colDirectives, directive);
    } else {
        directives.push(directive);
        renderDirectives();
    }

    input.value = '';
    alert("Diretriz enviada com sucesso!");
};

window.polishDirective = async () => {
    const input = document.getElementById('matrix-msg-input');
    const message = input.value.trim();

    if (!message) {
        alert("Digite uma mensagem primeiro.");
        return;
    }

    input.disabled = true;
    input.placeholder = "Polindo com IA...";

    try {
        const polished = await callGemini(
            `Melhore e profissionalize esta mensagem mantendo o significado: "${message}"`,
            "Editor profissional."
        );
        input.value = polished.trim();
    } catch (error) {
        alert("Erro ao polir mensagem.");
    } finally {
        input.disabled = false;
        input.placeholder = "Digite uma ordem...";
    }
};

function renderDirectives() {
    const container = document.getElementById('directives-list');

    if (directives.length === 0) {
        container.innerHTML = '<p class="p-8 text-center text-slate-400 italic">Nenhuma diretriz enviada ainda.</p>';
        return;
    }

    const sorted = [...directives].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const html = sorted.map(d => `
        <div class="p-6 hover:bg-slate-50 transition">
            <div class="flex justify-between items-center mb-2">
                <p class="font-bold text-orange-600 uppercase text-xs">${d.targetUnit || 'Rede Geral'}</p>
                <span class="text-[9px] text-slate-400">${new Date(d.timestamp).toLocaleString('pt-PT')}</span>
            </div>
            <p class="text-slate-700 font-medium text-sm">${d.text}</p>
        </div>
    `).join('');

    container.innerHTML = html;
}

// ===== SENSEI VIRTUAL =====
window.askSensei = async () => {
    const input = document.getElementById('chat-input');
    const question = input.value.trim();

    if (!question) return;

    const messagesContainer = document.getElementById('chat-messages');

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'bg-orange-100 text-slate-800 p-3 rounded-2xl rounded-tr-sm ml-8';
    userMsg.textContent = question;
    messagesContainer.appendChild(userMsg);

    // Add thinking indicator
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'bg-slate-200 text-slate-600 p-3 rounded-2xl rounded-tl-sm mr-8 flex items-center gap-2';
    thinkingMsg.innerHTML = '<div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> Pensando...';
    messagesContainer.appendChild(thinkingMsg);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    input.value = '';

    try {
        const response = await callGemini(question, "Você é o Sensei Virtual, um assistente especializado em gestão de academias de Jiu-Jitsu. Seja útil, conciso e amigável.");

        messagesContainer.removeChild(thinkingMsg);

        const botMsg = document.createElement('div');
        botMsg.className = 'bg-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-sm mr-8';
        botMsg.textContent = response;
        messagesContainer.appendChild(botMsg);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        messagesContainer.removeChild(thinkingMsg);

        const errorMsg = document.createElement('div');
        errorMsg.className = 'bg-red-100 text-red-800 p-3 rounded-2xl rounded-tl-sm mr-8';
        errorMsg.textContent = 'Desculpe, ocorreu um erro. Tente novamente.';
        messagesContainer.appendChild(errorMsg);
    }
};

// Allow Enter key to send message
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.askSensei();
            }
        });
    }

    const matrixInput = document.getElementById('matrix-msg-input');
    if (matrixInput) {
        matrixInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.sendMatrixDirective();
            }
        });
    }
});

// ===== AUDIO FEATURES =====
window.listenToAudit = () => {
    const content = document.getElementById('ai-insight-content').textContent;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech

        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'pt-PT';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        window.speechSynthesis.speak(utterance);
    } else {
        alert("Seu navegador não suporta síntese de voz.");
    }
};

// ===== START APPLICATION =====
init();
