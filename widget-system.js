// ===== ARENAHUB WIDGET SYSTEM =====
// Customizable drag-and-drop dashboard framework

if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'http://localhost:5000/api/v1';
}


// Widget Registry
const WIDGET_REGISTRY = {};
window.WIDGET_REGISTRY = WIDGET_REGISTRY;

// Current Layout State
let currentLayout = [];
let editMode = false;
let sortableInstance = null;
let CURRENT_APP_TYPE = 'matrix';
let CURRENT_CONTAINER_ID = 'widget-container';

// ===== WIDGET REGISTRATION =====
function registerWidget(config) {
    WIDGET_REGISTRY[config.id] = {
        id: config.id,
        name: config.name,
        description: config.description,
        size: config.size || 'lg:col-span-4',
        category: config.category || 'general',
        icon: config.icon || 'fa-solid fa-chart-bar',
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
    console.log(`🎨 Initializing Widget System for ${appType}`);

    CURRENT_APP_TYPE = appType;
    CURRENT_CONTAINER_ID = containerId;

    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Widget container not found:', containerId);
        return;
    }

    // Load user's saved layout or use default
    const layout = loadUserLayout(appType);
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
    const storageKey = `arenaHub_${appType}_layout`;
    const defaultLayout = getDefaultLayout(appType);

    // Try localStorage first
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            const savedLayout = JSON.parse(saved);

            // Merge logic: ensure any newly added default widgets are included 
            // if they are missing from the saved layout
            const mergedLayout = [...savedLayout];
            let changed = false;

            defaultLayout.forEach(def => {
                const exists = savedLayout.find(s => s.id === def.id);
                if (!exists) {
                    console.log(`✨ Adding new default widget to layout: ${def.id}`);
                    mergedLayout.push(def);
                    changed = true;
                }
            });

            if (changed) {
                // Re-calculate positions to be safe
                mergedLayout.forEach((item, idx) => {
                    if (item.position >= savedLayout.length || changed) {
                        // Keep original positions for existing, append new at the end
                    }
                });
                saveUserLayout(mergedLayout, appType);
            }

            return mergedLayout;
        } catch (e) {
            console.warn('Failed to parse saved layout, using default');
        }
    }

    // Return default layout
    return defaultLayout;
}

function saveUserLayout(layout, appType) {
    const storageKey = `arenaHub_${appType}_layout`;

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
            { id: 'franchisee-students-list', position: 2 },
            { id: 'franchisee-teachers-list', position: 3 },
            { id: 'franchisee-ai-auditor', position: 4 },
            { id: 'franchisee-directives', position: 5 },
            { id: 'franchisee-settings', position: 6 }
        ];
    } else if (appType === 'matrix-detail') {
        return [
            { id: 'matrix-unit-stats', position: 0 },
            { id: 'matrix-unit-performance', position: 1 },
            { id: 'matrix-unit-settings', position: 2 },
            { id: 'matrix-unit-students', position: 3 },
            { id: 'matrix-unit-teachers', position: 4 },
            { id: 'matrix-unit-graduation', position: 5 },
            { id: 'matrix-unit-ai-auditor', position: 6 }
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
    div.className = `widget ${widget.size} bg-white rounded-3xl border border-slate-100 card-shadow p-6 transition-all duration-300`;
    div.setAttribute('data-widget-id', widget.id);
    div.setAttribute('data-position', layoutItem.position);

    div.innerHTML = `
        <div class="widget-header flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
                <div class="widget-drag-handle cursor-move text-slate-300 hover:text-slate-500 transition hidden" data-drag-handle>
                    <i class="fa-solid fa-grip-vertical text-lg"></i>
                </div>
                <h3 class="font-bold text-slate-700 text-sm uppercase tracking-widest flex items-center gap-2">
                    <i class="${widget.icon} text-orange-500"></i>
                    ${widget.name}
                </h3>
            </div>
            <button onclick="removeWidget('${widget.id}')" class="widget-remove-btn text-slate-300 hover:text-red-500 transition hidden" title="Remover">
                <i class="fa-solid fa-times"></i>
            </button>
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

    saveUserLayout(newLayout, CURRENT_APP_TYPE);

    console.log('📍 Widget positions updated:', newLayout);
}

// ===== EDIT MODE TOGGLE =====
window.toggleEditMode = function () {
    editMode = !editMode;
    const body = document.body;

    // Find active button (could be general btn or detail btn)
    const btn = document.getElementById('btn-edit-mode') || document.getElementById('btn-edit-mode-detail');
    // Try to find both buttons to update state everywhere if needed, though usually only one is visible.
    const btns = [document.getElementById('btn-edit-mode'), document.getElementById('btn-edit-mode-detail')];

    const container = document.getElementById(CURRENT_CONTAINER_ID);

    if (editMode) {
        body.classList.add('edit-mode');

        btns.forEach(b => {
            if (b) {
                b.innerHTML = '<i class="fa-solid fa-check"></i> Concluir';
                b.classList.add('bg-orange-500', 'text-white');
                b.classList.remove('bg-slate-100', 'text-slate-700');
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
                b.classList.remove('bg-orange-500', 'text-white');
                b.classList.add('bg-slate-100', 'text-slate-700');
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

        // Re-render
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
        } else if (CURRENT_APP_TYPE === 'matrix-detail') {
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
    <div class="text-left max-w-4xl">
        <div class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div class="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                <i class="fa-solid fa-plus text-xl"></i>
            </div>
            <div>
                <h2 class="text-xl font-bold">Adicionar Widget</h2>
                <p class="text-xs text-slate-500">Escolha um widget para adicionar ao seu painel</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto">
            ${widgetCards}
        </div>
        
        <button onclick="closeModal()" class="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition">
            Cancelar
        </button>
    </div>
`;

    openModal(modalHtml);
};

console.log('✅ Widget System loaded');
