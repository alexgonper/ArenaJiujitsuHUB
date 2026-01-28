// ===== ARENAHUB WIDGET SYSTEM =====
// Customizable drag-and-drop dashboard framework

if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'http://localhost:5000/api/v1';
}


// Widget Registry
const WIDGET_REGISTRY = {};
window.WIDGET_REGISTRY = WIDGET_REGISTRY;

// Current Layout State
window.currentLayout = [];
let currentLayout = window.currentLayout; // maintain local ref for existing code
let editMode = false;
let sortableInstance = null;
let CURRENT_APP_TYPE = 'matrix';
let CURRENT_CONTAINER_ID = 'widget-container';
window.CURRENT_CONTAINER_ID = CURRENT_CONTAINER_ID; // Expose for debugging/external access

window.setCurrentWidgetContainer = function(id) {
    CURRENT_CONTAINER_ID = id;
    window.CURRENT_CONTAINER_ID = id;
    console.log(`🔌 Active widget container set to: ${id}`);
};

window.setCurrentAppType = function(type) {
    CURRENT_APP_TYPE = type;
    console.log(`📱 Active app type set to: ${type}`);
};

// ===== WIDGET REGISTRATION =====
function registerWidget(config) {
    WIDGET_REGISTRY[config.id] = {
        id: config.id,
        name: config.name,
        description: config.description,
        size: config.size || 'lg:col-span-4',
        category: config.category || 'general',
        icon: config.icon || 'fa-solid fa-chart-bar',
        actions: config.actions,
        render: config.render,
        update: config.update || (() => { }),
        destroy: config.destroy || (() => { })
    };
}

// Global helper to force update all active widgets
window.forceUpdateAllWidgets = function () {
    console.log('🔄 Force updating all widgets...');
    // We iterate the registry. The widgets themselves must handle checking if they are active/visible
    Object.values(WIDGET_REGISTRY).forEach(widget => {
        if (typeof widget.update === 'function') {
            try {
                widget.update();
            } catch (e) {
                console.error(`Error updating widget ${widget.id}:`, e);
            }
        }
    });
};

// ===== WIDGET SYSTEM INITIALIZATION =====
function initWidgetSystem(containerId, appType) {
    console.log(`🎨 Initializing Widget System for ${appType} in container ${containerId}`);

    CURRENT_APP_TYPE = appType;
    CURRENT_CONTAINER_ID = containerId;

    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Widget container not found:', containerId);
        return;
    }

    // Load user's saved layout or use default
    const layout = loadUserLayout(appType);
    window.currentLayout = layout;
    currentLayout = layout;

    // Render widgets
    renderDashboard(container, layout);

    // Initialize drag-drop if in edit mode
    if (editMode) {
        enableDragDrop(containerId);
    }
}

// ===== LAYOUT PERSISTENCE =====
function loadUserLayout(appType) {
    const storageKey = `arenaHub_v2_${appType}_layout`;
    const defaultLayout = getDefaultLayout(appType);

    // One-time force refresh for matrix detail widgets to ensure they appear
    const forceKey = `arenaHub_v2_force_refresh_matrix_v3`;
    if (appType.startsWith('matrix-detail') && !localStorage.getItem(forceKey)) {
        localStorage.removeItem(storageKey);
        localStorage.setItem(forceKey, 'true');
        console.log('🔄 Forced layout refresh for Matrix detail view');
    }

    // Try localStorage first
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            const savedLayout = JSON.parse(saved);

            // FORCE CLEANUP: Analytical widgets moved to Reports menu, remove from Dashboard (only for franchisee)
            const analyticalWidgets = [
                'franchisee-class-evolution', 'franchisee-churn-chart', 'franchisee-belt-chart',
                'franchisee-financial-health-chart', 'franchisee-engagement-chart', 'franchisee-heatmap-chart'
            ];
            
            let mergedLayout = [...savedLayout];
            let changed = false;

            if (appType === 'franchisee') {
                mergedLayout = savedLayout.filter(w => !analyticalWidgets.includes(w.id));
                changed = mergedLayout.length !== savedLayout.length;
            }
            
            // Sync with default layout for missing items (like new widgets we just created)
            defaultLayout.forEach(def => {
                const exists = mergedLayout.find(s => s.id === def.id);
                const isAnalyticalFranchisee = appType === 'franchisee' && analyticalWidgets.includes(def.id);
                
                if (!exists && !isAnalyticalFranchisee) {
                    console.log(`✨ Adding new default widget to ${appType}: ${def.id}`);
                    mergedLayout.push({ ...def, position: mergedLayout.length });
                    changed = true;
                }
            });

            if (changed) {
                mergedLayout.forEach((item, idx) => item.position = idx);
                saveUserLayout(mergedLayout, appType);
            }

            return mergedLayout;

            return mergedLayout;
        } catch (e) {
            console.warn('Failed to parse saved layout, using default');
        }
    }

    // Return default layout
    return defaultLayout;
}

function saveUserLayout(layout, appType) {
    const storageKey = `arenaHub_v2_${appType}_layout`;

    // Save to localStorage immediately
    localStorage.setItem(storageKey, JSON.stringify(layout));

    // Sync to backend (fire and forget)
    syncLayoutToBackend(layout).catch(err => {
        console.warn('Backend sync failed, layout saved locally:', err);
    });
}

async function syncLayoutToBackend(layout) {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/layout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layout })
        });

        if (!response.ok) throw new Error('Sync failed');
        console.log('✅ Layout synced to backend');
    } catch (error) {
        throw error;
    }
}

// ===== DEFAULT LAYOUTS =====
function getDefaultLayout(appType) {
    if (appType === 'matrix') {
        return [
            { id: 'matrix-stats', position: 0 },
            { id: 'matrix-performance', position: 1 },
            { id: 'matrix-ranking', position: 2 },
            { id: 'matrix-ai-auditor', position: 3 }
        ];
    } else if (appType === 'franchisee') {
        return [
            { id: 'franchisee-metrics', position: 0 },
            { id: 'franchisee-performance', position: 1 },
            { id: 'franchisee-ai-auditor', position: 2 },
            { id: 'franchisee-directives', position: 3 }
        ];
    } else if (appType === 'matrix-detail') {
        return [
            { id: 'matrix-unit-stats', position: 0 },
            { id: 'matrix-unit-performance', position: 1 },
            { id: 'matrix-unit-schedule', position: 2 },
            { id: 'matrix-unit-settings', position: 3 },
            { id: 'matrix-unit-students', position: 4 },
            { id: 'matrix-unit-teachers', position: 5 },
            { id: 'matrix-unit-graduation', position: 6 },
            { id: 'matrix-unit-ai-auditor', position: 7 },
            { id: 'matrix-unit-evolution-attendance', position: 8 },
            { id: 'matrix-unit-evolution-engagement', position: 9 },
            { id: 'matrix-unit-evolution-table', position: 10 },
            { id: 'matrix-unit-churn-chart', position: 11 },
            { id: 'matrix-unit-belt-chart', position: 12 },
            { id: 'matrix-unit-financial-health-chart', position: 13 },
            { id: 'matrix-unit-engagement-chart', position: 14 },
            { id: 'matrix-unit-heatmap-chart', position: 15 }
        ];
    } else if (appType === 'matrix-detail-dashboard') {
        return [
            { id: 'matrix-unit-stats', position: 0 },
            { id: 'matrix-unit-performance', position: 1 },
            { id: 'matrix-unit-ai-auditor', position: 2 }
        ];
    } else if (appType === 'matrix-detail-reports') {
        return [
            { id: 'matrix-unit-evolution-attendance', position: 0 },
            { id: 'matrix-unit-evolution-engagement', position: 1 },
            { id: 'matrix-unit-evolution-table', position: 2 },
            { id: 'matrix-unit-churn-chart', position: 3 },
            { id: 'matrix-unit-belt-chart', position: 4 },
            { id: 'matrix-unit-financial-health-chart', position: 5 },
            { id: 'matrix-unit-engagement-chart', position: 6 },
            { id: 'matrix-unit-heatmap-chart', position: 7 }
        ];
    } else if (appType === 'matrix-detail-students') {
        return [
            { id: 'matrix-unit-students', position: 0 }
        ];
    } else if (appType === 'matrix-detail-teachers') {
        return [
            { id: 'matrix-unit-teachers', position: 0 }
        ];
    } else if (appType === 'matrix-detail-graduation') {
        return [
            { id: 'matrix-unit-graduation', position: 0 }
        ];
    } else if (appType === 'matrix-detail-schedule') {
        return [
            { id: 'matrix-unit-schedule', position: 0 }
        ];
    } else if (appType === 'matrix-detail-settings') {
        return [
            { id: 'matrix-unit-settings', position: 0 }
        ];
    }
    return [];
}

// ===== DASHBOARD RENDERING =====
function renderDashboard(container, layout) {
    // Clear existing content
    container.innerHTML = '';

    // Sort by position
    const sortedLayout = [...layout].sort((a, b) => a.position - b.position);

    // Render each widget
    sortedLayout.forEach(item => {
        const widget = WIDGET_REGISTRY[item.id];
        if (!widget) {
            console.warn('Widget not found:', item.id);
            return;
        }

        const widgetElement = createWidgetElement(widget, item);
        container.appendChild(widgetElement);

        // Inject actions if defined
        const actionsSlot = widgetElement.querySelector('.widget-actions');
        if (widget.actions && actionsSlot) {
            actionsSlot.innerHTML = widget.actions;
        }

        // Call widget's render function with safety wrap
        try {
            widget.render(widgetElement.querySelector('.widget-content'));
        } catch (error) {
            console.error(`❌ Error rendering widget [${item.id}]:`, error);
            widgetElement.querySelector('.widget-content').innerHTML = `
                <div class="p-4 text-center">
                    <i class="fa-solid fa-triangle-exclamation text-red-500 mb-2"></i>
                    <p class="text-[10px] text-slate-400 italic">Erro ao carregar widget.</p>
                </div>
            `;
        }
    });
}

function createWidgetElement(widget, layoutItem) {
    const div = document.createElement('div');
    div.className = `widget ${widget.size} bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 transition-all duration-300 relative group overflow-visible`;
    div.setAttribute('data-widget-id', widget.id);
    div.setAttribute('data-position', layoutItem.position);

    div.innerHTML = `
        <!-- System Controls (Visible only in Edit Mode) -->
        <button onclick="removeWidget('${widget.id}')" 
            class="widget-remove-btn absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-500 text-white shadow-lg hover:scale-110 transition-all z-[100] flex items-center justify-center ${editMode ? '' : 'hidden'}" 
            title="Remover Widget">
            <i class="fa-solid fa-xmark"></i>
        </button>
        
        <div class="widget-drag-handle absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest cursor-move shadow-lg opacity-0 group-hover:opacity-100 transition-all z-[100] ${editMode ? '' : 'hidden'}" data-drag-handle>
            <i class="fa-solid fa-grip-horizontal mr-1"></i> Arrastar
        </div>

        <div class="widget-header flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                    <i class="${widget.icon} text-lg"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-800 text-sm tracking-tight">${widget.name}</h3>
                    <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">${widget.category || 'Geral'}</p>
                </div>
            </div>
            <div class="widget-actions"></div>
        </div>
        <div class="widget-content"></div>
    `;

    return div;
}

// ===== DRAG & DROP =====
function enableDragDrop(containerId) {
    const container = document.getElementById(containerId);

    if (sortableInstance) {
        sortableInstance.destroy();
    }

    sortableInstance = Sortable.create(container, {
        animation: 200,
        handle: '[data-drag-handle]',
        ghostClass: 'widget-ghost',
        dragClass: 'widget-dragging',
        forceFallback: true,
        fallbackClass: 'widget-fallback',
        onEnd: function (evt) {
            updateWidgetPositions();
        }
    });
}

function disableDragDrop() {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
}

function updateWidgetPositions() {
    const container = document.getElementById(CURRENT_CONTAINER_ID);
    if (!container) return;

    const widgets = container.querySelectorAll('.widget');

    const newLayout = [];
    widgets.forEach((widget, index) => {
        const id = widget.getAttribute('data-widget-id');
        newLayout.push({ id, position: index });
    });

    currentLayout = newLayout;
    window.currentLayout = newLayout;

    saveUserLayout(newLayout, CURRENT_APP_TYPE);

    console.log('📍 Widget positions updated:', newLayout);
}

// ===== EDIT MODE TOGGLE =====
window.toggleEditMode = function () {
    editMode = !editMode;
    const body = document.body;

    // Find active button (could be general btn or detail btn)
    // Find active button (could be general btn or detail btn or reports btn)
    const btns = [
        document.getElementById('btn-edit-mode'), 
        document.getElementById('btn-edit-mode-detail'),
        document.getElementById('btn-edit-mode-reports')
    ];

    const container = document.getElementById(CURRENT_CONTAINER_ID);

    if (editMode) {
        body.classList.add('edit-mode');

        btns.forEach(b => {
            if (b) {
                b.innerHTML = '<i class="fa-solid fa-check"></i> Concluir';
                b.classList.add('bg-orange-500', 'text-white', 'border-transparent');
                
                // Handle various source styles
                b.classList.remove('bg-slate-100', 'text-slate-700', 'bg-blue-50', 'text-blue-700', 'border-blue-200', 'border-slate-200', 'bg-orange-50', 'text-orange-600', 'border-orange-200');
            }
        });

        // Show drag handles and remove buttons
        if (container) {
            container.querySelectorAll('.widget-drag-handle, .widget-remove-btn').forEach(el => {
                el.classList.remove('hidden');
            });
            enableDragDrop(CURRENT_CONTAINER_ID);
        }

        showNotification('🎨 Modo de edição ativado. Arraste os widgets para reorganizar.', 'info');
    } else {
        body.classList.remove('edit-mode');

        btns.forEach(b => {
            if (b) {
                b.innerHTML = '<i class="fa-solid fa-pen"></i> Personalizar';
                b.classList.remove('bg-orange-500', 'text-white', 'border-transparent');
                
                // Restore branding style
                b.classList.add('bg-orange-50', 'text-orange-600', 'border-orange-200');
            }
        });

        // Hide drag handles
        if (container) {
            container.querySelectorAll('.widget-drag-handle, .widget-remove-btn').forEach(el => {
                el.classList.add('hidden');
            });
        }

        disableDragDrop();

        // Save final state
        if (currentLayout.length > 0) {
            saveUserLayout(currentLayout, CURRENT_APP_TYPE);
            showNotification('Layout salvo com sucesso!', 'success');
        }
    }
};


// ===== WIDGET MANAGEMENT =====
window.addWidget = function (widgetId) {
    const widget = WIDGET_REGISTRY[widgetId];
    if (!widget) {
        console.error('Widget not found:', widgetId);
        return;
    }

    // Check if already in layout
    if (currentLayout.find(w => w.id === widgetId)) {
        showNotification('Este widget já está no seu painel', 'warning');
        return;
    }

    // Add to layout
    const newPosition = currentLayout.length;
    currentLayout.push({ id: widgetId, position: newPosition });

    // Re-render dashboard
    const container = document.getElementById(CURRENT_CONTAINER_ID);
    renderDashboard(container, currentLayout);
    saveUserLayout(currentLayout, CURRENT_APP_TYPE);

    // Re-enable drag-drop if in edit mode
    if (editMode) {
        enableDragDrop(CURRENT_CONTAINER_ID);
        container.querySelectorAll('.widget-drag-handle, .widget-remove-btn').forEach(el => {
            el.classList.remove('hidden');
        });
    }

    closeModal();
    showNotification(`✅ Widget "${widget.name}" adicionado!`, 'success');
};

window.removeWidget = function (widgetId) {
    const confirmMsg = 'Deseja remover este widget do seu painel?';

    const doRemove = () => {
        currentLayout = currentLayout.filter(w => w.id !== widgetId);
        window.currentLayout = currentLayout;

        // Re-render
        const container = document.getElementById(CURRENT_CONTAINER_ID);
        renderDashboard(container, currentLayout);
        saveUserLayout(currentLayout, CURRENT_APP_TYPE);

        // Re-enable drag-drop if in edit mode
        if (editMode) {
            // Need to wait for DOM update or simply re-select from the fresh container
            setTimeout(() => {
                enableDragDrop(CURRENT_CONTAINER_ID);
                const freshContainer = document.getElementById(CURRENT_CONTAINER_ID);
                freshContainer.querySelectorAll('.widget-drag-handle, .widget-remove-btn').forEach(el => {
                    el.classList.remove('hidden');
                });
            }, 50);
        }

        showNotification('Widget removido', 'success');
    };

    if (typeof showPortalConfirm === 'function') {
        showPortalConfirm('Remover Widget', confirmMsg, doRemove, 'error');
    } else if (confirm(confirmMsg)) {
        doRemove();
    }
};

window.resetDashboard = function () {
    if (!confirm('Tem certeza que deseja restaurar o layout padrão? Esta ação não pode ser desfeita.')) return;

    const defaultLayout = getDefaultLayout(CURRENT_APP_TYPE);
    currentLayout = defaultLayout;
    window.currentLayout = defaultLayout;

    const container = document.getElementById(CURRENT_CONTAINER_ID);
    renderDashboard(container, currentLayout);
    saveUserLayout(currentLayout, CURRENT_APP_TYPE);

    // Sync edit mode state
    if (editMode) {
        enableDragDrop(CURRENT_CONTAINER_ID);
        container.querySelectorAll('.widget-drag-handle, .widget-remove-btn').forEach(el => {
            el.classList.remove('hidden');
        });
    }

    showNotification('✅ Layout restaurado para o padrão', 'success');
};

// ===== WIDGET SELECTOR MODAL =====
window.openWidgetSelector = function () {

    // Filter widgets based on current context
    const availableWidgets = Object.values(WIDGET_REGISTRY).filter(w => {
        // Must not be in current layout
        if (currentLayout.find(existing => existing.id === w.id)) return false;

        // Context filtering
        if (CURRENT_APP_TYPE === 'franchisee') {
            return w.id.startsWith('franchisee');
        } else if (CURRENT_APP_TYPE.startsWith('matrix-detail')) {
            return w.id.startsWith('matrix-unit');
        } else if (CURRENT_APP_TYPE === 'matrix') {
            // Standard matrix dashboard - exclude unit detail widgets
            return w.id.startsWith('matrix') && !w.id.startsWith('matrix-unit');
        }
        return false;
    });


    if (availableWidgets.length === 0) {
        showNotification('Todos os widgets disponíveis já estão no seu painel!', 'info');
        return;
    }

    const widgetCards = availableWidgets.map(w => `
    <div class="bg-white border-2 border-slate-100 rounded-2xl p-4 hover:border-orange-300 transition group cursor-pointer" onclick="addWidget('${w.id}')">
        <div class="flex items-start gap-3 mb-3">
            <div class="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 flex-shrink-0">
                <i class="${w.icon}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-700 text-sm group-hover:text-orange-600 transition">${w.name}</h4>
                <p class="text-[10px] text-slate-400 uppercase tracking-wide">${w.category}</p>
            </div>
        </div>
        <p class="text-xs text-slate-500 leading-relaxed mb-3">${w.description}</p>
        <button class="w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase group-hover:bg-orange-500 group-hover:text-white transition">
            <i class="fa-solid fa-plus mr-1"></i> Adicionar
        </button>
    </div>
`).join('');

    const modalHtml = `
    <div class="text-left w-full">
        <div class="flex items-center gap-4 mb-8">
            <div class="w-14 h-14 bg-[#dbeafe] rounded-2xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
               <div class="w-14 h-14 rounded-2xl flex items-center justify-center orange-gradient text-white shadow-lg">
                    <i class="fa-solid fa-plus text-2xl"></i>
               </div>
            </div>
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Adicionar Widget</h2>
                <p class="text-sm text-slate-500 mt-1">Personalize seu painel com novas métricas</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-4">
            ${widgetCards}
        </div>
        
        <button onclick="closeModal()" class="w-full mt-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-slate-200 transition">
            Cancelar
        </button>
    </div>
    `;

    openModal(modalHtml);
};

console.log('✅ Widget System loaded');
