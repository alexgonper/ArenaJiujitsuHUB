/**
 * Sensei Virtual - AI Client
 * Connects frontend to the backend AI endpoint (/api/v1/ai/generate)
 * Handles UI interactions and context gathering for each portal.
 */

const SenseiClient = {
    isOpen: false,
    isThinking: false,
    context: {}, // Stores current app context (user, role, data)

    init: function () {
        console.log('🥋 Sensei Virtual initializing...');
        this.injectStyles();
        this.attachGlobalFunctions();
        this.detectContext();
        
        // Auto-render UI if missing (except on specific pages if needed)
        if (!document.getElementById('sensei-window')) {
            this.renderUI();
        }
    },

    attachGlobalFunctions: function () {
        window.toggleSensei = () => this.toggle();
        window.askSensei = () => this.ask();
    },

    injectStyles: function () {
        if (document.getElementById('sensei-styles')) return;
        const style = document.createElement('style');
        style.id = 'sensei-styles';
        style.textContent = `
            .sensei-thinking { animation: pulse 1.5s infinite; }
            .sensei-message { animation: fadeIn 0.3s ease-out; }
            @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    },

    renderUI: function () {
        // Only render if not already present
        if (document.getElementById('sensei-window')) return;

        const uiHTML = `
            <!-- Sensei Window -->
            <div id="sensei-window"
                class="fixed bottom-6 right-6 w-[calc(100%-3rem)] md:w-96 bg-white rounded-3xl shadow-2xl z-[9000] border border-slate-100 hidden flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right font-sans">
                <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white flex justify-between items-center shadow-md">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <i class="fa-solid fa-brain text-white text-sm"></i>
                        </div>
                        <div>
                            <span class="font-bold text-sm block leading-none">Sensei Virtual</span>
                            <span class="text-[10px] opacity-90 uppercase font-black tracking-widest">IA Assistant</span>
                        </div>
                    </div>
                    <button onclick="toggleSensei()" class="opacity-80 hover:opacity-100 transition hover:rotate-90 duration-300">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                
                <div id="chat-messages" class="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
                    <!-- Intro Message -->
                    <div class="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 text-slate-600 text-xs leading-relaxed sensei-message">
                        <p class="font-bold text-orange-600 mb-1 flex items-center gap-2">
                            <i class="fa-solid fa-robot"></i> Sensei
                        </p>
                        Oss! Sou seu assistente inteligente. Analiso seus dados em tempo real. Como posso ajudar hoje?
                    </div>
                </div>

                <div class="p-4 border-t border-slate-100 bg-white flex gap-2 items-center">
                    <input type="text" id="chat-input" placeholder="Digite sua pergunta..."
                        class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-700 placeholder-slate-400"
                        onkeypress="if(event.key === 'Enter') askSensei()">
                    
                    <button onclick="askSensei()" id="btn-send-sensei"
                        class="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-orange-600 active:scale-95 transition-all">
                        <i class="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                </div>
            </div>

            <!-- Floating Button -->
            <button onclick="toggleSensei()" id="sensei-float-btn"
                class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl border-4 border-white transition-all hover:scale-110 active:scale-95 z-[8999] hover:rotate-6 group">
                <i class="fa-solid fa-brain group-hover:animate-pulse"></i>
                <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold">AI</span>
            </button>
        `;

        const div = document.createElement('div');
        div.innerHTML = uiHTML;
        document.body.appendChild(div);
    },

    toggle: function () {
        const win = document.getElementById('sensei-window');
        const btn = document.getElementById('sensei-float-btn');
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            win.classList.remove('hidden');
            if(btn) btn.classList.add('hidden');
            // Focus input
            setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
        } else {
            win.classList.add('hidden');
            if(btn) btn.classList.remove('hidden');
        }
    },

    detectContext: function () {
        // Detect Portal
        const path = window.location.pathname;
        let role = 'unknown';
        let contextData = {};

        if (path.includes('matriz-app') || document.title.includes('Matriz')) {
            role = 'admin_matriz';
            contextData = {
                totalStudents: this.safeGet(() => window.students?.length, 0),
                franchisesCount: this.safeGet(() => window.franchises?.length, 0),
                revenue: this.safeGet(() => window.franchises?.reduce((acc, f) => acc + (f.revenue || 0), 0), 0)
            };
        } else if (path.includes('franqueado') || document.title.includes('Franqueado')) {
            role = 'franchisee_owner';
            contextData = {
                gymName: this.safeGet(() => document.getElementById('gym-name-header')?.innerText, 'Minha Unidade'),
                students: this.safeGet(() => window.myStudents?.length, 0),
                revenue: this.safeGet(() => document.getElementById('stat-revenue')?.innerText, '0')
            };
        } else if (path.includes('aluno') || document.title.includes('Aluno')) {
            role = 'student';
            contextData = {
                name: this.safeGet(() => window.currentUser?.name, 'Aluno'),
                belt: this.safeGet(() => window.currentUser?.belt, 'Branca'),
                attendance: this.safeGet(() => window.currentUser?.attendanceHistory?.length, 0)
            };
        } else if (path.includes('teacher') || document.title.includes('Professor')) {
            role = 'teacher';
            contextData = {
                name: this.safeGet(() => window.currentUser?.name, 'Professor'),
                students: this.safeGet(() => window.myStudents?.length, 0)
            };
        }

        this.context = { role, data: contextData };
        console.log('🥋 Sensei Context:', this.context);
    },

    safeGet: function (fn, defaultVal) {
        try {
            return fn();
        } catch (e) {
            return defaultVal;
        }
    },

    ask: async function () {
        if (this.isThinking) return;

        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (!msg) return;

        this.addMessage(msg, 'user');
        input.value = '';
        this.isThinking = true;
        this.updateSendButton(true);

        // Add thinking indicator
        const thinkingId = this.addThinking();

        // Prepare Payload
        try {
            // Re-detect context to get latest data
            this.detectContext();

            const payload = {
                prompt: msg,
                systemInstruction: `
                    Você é o Sensei Virtual do Arena Jiu-Jitsu Hub.
                    Usuário atual: ${this.context.role}.
                    Dados de contexto disponíveis: ${JSON.stringify(this.context.data)}.
                    Responda de forma curta, motivadora e executiva. Use "Oss!" ocasionalmente.
                    Se for aluno, motive o treino. Se for dono, foque em gestão e lucro.
                    Nunca invente dados que não estão no contexto, diga que não sabe se não souber.
                `
            };

            // Call Backend
            // Determine API URL (handle local vs production automatically)
            const API_BASE = window.API_BASE_URL || window.API_URL || '/api/v1';
            const response = await fetch(`${API_BASE}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // Remove thinking
            document.getElementById(thinkingId)?.remove();

            if (data.success) {
                this.addMessage(data.data, 'sensei');
            } else {
                this.addMessage('Desculpe, tive um problema de conexão com o dojo central. Oss!', 'sensei');
                console.error('AI Error:', data.error);
            }

        } catch (error) {
            document.getElementById(thinkingId)?.remove();
            this.addMessage('Erro de conexão. Verifique sua internet.', 'sensei');
            console.error('Network Error:', error);
        } finally {
            this.isThinking = false;
            this.updateSendButton(false);
        }
    },

    addMessage: function (text, sender) {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        
        const isUser = sender === 'user';
        
        div.className = `p-3 rounded-2xl shadow-sm text-xs leading-relaxed max-w-[85%] sensei-message ${
            isUser 
                ? 'bg-orange-500 text-white ml-auto rounded-tr-sm' 
                : 'bg-white border border-slate-100 text-slate-600 rounded-tl-sm'
        }`;

        div.innerHTML = isUser ? text : `<div class="font-bold text-orange-500 mb-1 text-[10px] uppercase">Sensei</div>${text}`;
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    addThinking: function () {
        const container = document.getElementById('chat-messages');
        const id = 'thinking-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'bg-slate-100 text-slate-400 p-3 rounded-2xl rounded-tl-sm text-xs border border-slate-50 flex items-center gap-2 max-w-[85%]';
        div.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-orange-500"></i> Analisando...`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    },

    updateSendButton: function (loading) {
        const btn = document.getElementById('btn-send-sensei');
        if (!btn) return;
        if (loading) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;
            btn.classList.add('opacity-70');
        } else {
            btn.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i>';
            btn.disabled = false;
            btn.classList.remove('opacity-70');
        }
    }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SenseiClient.init());
} else {
    SenseiClient.init();
}
