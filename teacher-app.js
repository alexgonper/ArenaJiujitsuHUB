/**
 * Arena Hub - Teacher Portal Logic
 * Manages states, API calls, and UI updates for the instructor dashboard.
 */

// State Management
let currentTeacher = null;
let dashboardData = null;
let students = [];
let filteredStudents = [];
let currentAttendanceClassId = null;

// Initialize Page (Clean)
// (Logic was moved to bottom or integrated)


function updateHeaderAndProfile() {
    const nameEl = document.getElementById('teacher-name-header');
    if (nameEl) nameEl.textContent = currentTeacher.name;

    const nameSidebar = document.getElementById('teacher-name-sidebar');
    if (nameSidebar) nameSidebar.textContent = currentTeacher.name;

    const pName = document.getElementById('profile-name');
    if (pName) pName.textContent = currentTeacher.name;

    const pBelt = document.getElementById('profile-belt');
    if (pBelt) {
        const belt = currentTeacher.belt || 'Branca';
        const style = getBeltStyle(belt);
        const degree = currentTeacher.degree && currentTeacher.degree !== 'Nenhum' ? ` • ${currentTeacher.degree}` : '';

        pBelt.className = `inline-block px-4 py-1.5 rounded-full text-[10px] font-black mt-2 uppercase tracking-widest border`;
        pBelt.style.background = style.bg;
        pBelt.style.color = style.text;
        pBelt.style.borderColor = style.border;
        pBelt.textContent = `${belt}${degree}`.toUpperCase();
    }

    const pFranchise = document.getElementById('profile-franchise');
    if (pFranchise) {
        const name = currentTeacher.franchiseId?.name || 'Unidade não informada';
        pFranchise.textContent = name.toLowerCase().startsWith('unidade') ? name : `Unidade ${name}`;
    }

    const pEmail = document.getElementById('profile-email');
    if (pEmail) pEmail.textContent = currentTeacher.email;

    const pPhone = document.getElementById('profile-phone');
    if (pPhone) pPhone.textContent = currentTeacher.phone || '--';

    const pGender = document.getElementById('profile-gender');
    if (pGender) pGender.textContent = currentTeacher.gender || '--';

    const pBirth = document.getElementById('profile-birth');
    if (pBirth) pBirth.textContent = currentTeacher.birthDate ? new Date(currentTeacher.birthDate).toLocaleDateString('pt-BR') : '--';

    const pHire = document.getElementById('profile-hire-date');
    if (pHire) {
        const hireDate = currentTeacher.hireDate || currentTeacher.createdAt;
        pHire.textContent = hireDate ? new Date(hireDate).toLocaleDateString('pt-BR') : '--';
    }

    const pAddress = document.getElementById('profile-address');
    if (pAddress) pAddress.textContent = currentTeacher.address || '--';

    // Avatar initial
    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.textContent = currentTeacher.name.charAt(0);

    const avatarLarge = document.getElementById('profile-avatar-large');
    if (avatarLarge) avatarLarge.textContent = currentTeacher.name.charAt(0);

    // Render Graduation History
    renderGraduationHistoryTable(currentTeacher.graduationHistory || []);
}

function renderGraduationHistoryTable(history) {
    const tbody = document.getElementById('graduation-history-body');
    if (!tbody) return;

    if (!history || history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-slate-400 italic">
                    Nenhum registro de graduação disponível para este professor.
                </td>
            </tr>
        `;
        return;
    }

    // Sort by date descending
    const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map(item => {
        const date = new Date(item.date).toLocaleDateString('pt-BR');
        const masterName = item.promotedBy || 'Mestre Arena';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-slate-600 font-medium">${date}</td>
                <td class="px-6 py-4 font-bold text-slate-800">${item.belt}</td>
                <td class="px-6 py-4 text-slate-500">${item.degree || 'Nenhum'}</td>
                <td class="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold tracking-wider">${masterName}</td>
            </tr>
        `;
    }).join('');
}

// Profile Editing Logic
window.openEditProfileModal = function() {
    const modal = document.getElementById('modal-edit-profile');
    if (!modal) return;

    // Populate Fields
    document.getElementById('edit-teacher-name').value = currentTeacher.name || '';
    document.getElementById('edit-teacher-email').value = currentTeacher.email || '';
    document.getElementById('edit-teacher-gender').value = currentTeacher.gender || 'Masculino';
    document.getElementById('edit-teacher-phone').value = currentTeacher.phone || '';
    
    if (currentTeacher.birthDate) {
        document.getElementById('edit-teacher-birth').value = currentTeacher.birthDate.split('T')[0];
    }
    
    const hireDate = currentTeacher.hireDate || currentTeacher.createdAt;
    if (hireDate) {
        document.getElementById('edit-teacher-hire').value = hireDate.split('T')[0];
    }
    
    document.getElementById('edit-teacher-belt').value = currentTeacher.belt || 'Branca';
    document.getElementById('edit-teacher-degree').value = currentTeacher.degree || 'Nenhum';
    document.getElementById('edit-teacher-address').value = currentTeacher.address || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeEditProfileModal = function() {
    const modal = document.getElementById('modal-edit-profile');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.saveProfileUpdates = async function(event) {
    if (event) event.preventDefault();
    
    const btn = document.getElementById('btn-save-profile');
    const originalContent = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Salvando...';

    const payload = {
        name: document.getElementById('edit-teacher-name').value,
        email: document.getElementById('edit-teacher-email').value,
        gender: document.getElementById('edit-teacher-gender').value,
        phone: document.getElementById('edit-teacher-phone').value,
        birthDate: document.getElementById('edit-teacher-birth').value,
        belt: document.getElementById('edit-teacher-belt').value,
        degree: document.getElementById('edit-teacher-degree').value,
        address: document.getElementById('edit-teacher-address').value
    };

    try {
        const response = await fetch(`${window.API_BASE_URL}/teachers/${currentTeacher._id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('arena_token')}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Perfil atualizado com sucesso!', 'success');
            currentTeacher = result.data;
            
            // Sync with localStorage teacher data if stored there
            const stored = localStorage.getItem('arena_teacher');
            if (stored) {
                const storedTeacher = JSON.parse(stored);
                if (storedTeacher._id === currentTeacher._id) {
                    localStorage.setItem('arena_teacher', JSON.stringify(currentTeacher));
                }
            }
            
            updateHeaderAndProfile();
            closeEditProfileModal();
        } else {
            showToast(result.error || 'Erro ao atualizar perfil', 'error');
        }
    } catch (error) {
        console.error('Save profile error:', error);
        showToast('Erro de conexão ao salvar perfil', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
};

async function fetchDashboardData() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/teachers/${currentTeacher._id}/dashboard`);

        // Handle teacher not found (e.g. database reset)
        if (response.status === 404) {
            console.error('Teacher not found in DB. Redirecting to login.');
            localStorage.removeItem('arena_teacher');
            window.location.href = 'teacher-login.html';
            return;
        }

        const result = await response.json();

        if (result.success) {
            dashboardData = result.data;
            if (dashboardData.teacher) {
                currentTeacher = dashboardData.teacher;
                updateHeaderAndProfile();
            }
            if (dashboardData.franchise) {
                applyBranding(dashboardData.franchise);
                updateSupportInfo(dashboardData.franchise);
            }
        }
    } catch (error) {
        console.error('Fetch dashboard error:', error);
    }
}

function updateSupportInfo(franchise) {
    const b = franchise.branding || {};
    const section = document.getElementById('teacher-support-section');
    const emailCont = document.getElementById('support-email-container');
    const phoneCont = document.getElementById('support-phone-container');
    const emailEl = document.getElementById('support-email');
    const phoneEl = document.getElementById('support-phone');

    if (!section) return;

    let hasSupport = false;

    if (b.supportEmail) {
        emailEl.textContent = b.supportEmail;
        emailCont.classList.remove('hidden');
        hasSupport = true;
    } else {
        emailCont.classList.add('hidden');
    }

    if (b.supportPhone) {
        phoneEl.textContent = b.supportPhone;
        phoneCont.classList.remove('hidden');
        hasSupport = true;
    } else {
        phoneCont.classList.add('hidden');
    }

    if (hasSupport) {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
    }
}

async function fetchStudents(scope = 'all') {
    try {
        const list = document.getElementById('all-students-list');
        if (list) {
            list.innerHTML = `
                <div class="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <i class="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
                    <p class="text-sm font-bold uppercase">Carregando Alunos...</p>
                </div>
            `;
        }

        const response = await fetch(`${window.API_BASE_URL}/teachers/${currentTeacher._id}/students?scope=${scope}`);
        const result = await response.json();

        if (result.success) {
            students = result.data;
            filteredStudents = [...students];
            renderAllStudentsList();
        }
    } catch (error) {
        console.error('Fetch students error:', error);
    }
}


function renderDashboard() {
    if (!dashboardData) return;

    // 1. Render Stats
    renderProStats();

    // 2. Render Timeline (Top)
    renderTimeline();

    // 3. Command Center (Auto-select Logic)
    autoSelectLiveClass();
}

function renderProStats() {
    const stats = dashboardData.stats || {};
    
    // Alunos Atendidos (Total de presenças na semana)
    const weekTotal = stats.weekTotal || 0;
    const elTotal = document.getElementById('stat-total-week');
    if(elTotal) elTotal.textContent = weekTotal;
    
    // Taxa de Presença (Média da semana)
    const weekRate = stats.weekRate || 0;
    const elRate = document.getElementById('stat-rate-week');
    if(elRate) elRate.textContent = `${weekRate}%`;
    
    // Bars Visuals
    const barStudents = document.getElementById('bar-students');
    if(barStudents) barStudents.style.width = `${Math.min(weekTotal * 2, 100)}%`; // Using 50 as a daily average target for 100% bar
    
    const barRate = document.getElementById('bar-rate');
    if(barRate) barRate.style.width = `${weekRate}%`;
    
    // Streak
    const elStreak = document.getElementById('stat-streak');
    if(elStreak) elStreak.textContent = `${stats.streak || 0} aulas consecutivas`;
}

function autoSelectLiveClass() {
    const agenda = dashboardData.agenda || [];
    if (agenda.length === 0) {
        showNoClassState();
        return;
    }

    const active = getActiveClass(agenda);
    if (active) {
        // Found a live or upcoming class
        renderLiveClassMode(active);
        // Auto load attendance
        loadClassAttendance(active._id, active.name);
    } else {
        // No active class now, maybe show the next one or empty state
        const next = agenda[0]; // Assuming agenda is sorted
        if (next) {
             renderLiveClassMode(next, false); // False = not live yet
             loadClassAttendance(next._id, next.name);
        } else {
             showNoClassState();
        }
    }
}

function showNoClassState() {
    document.getElementById('live-wrapper').classList.add('hidden');
    document.getElementById('no-live-class').classList.remove('hidden');
}

function renderLiveClassMode(cls, isLive = true) {
    const card = document.getElementById('live-class-card');
    const wrapper = document.getElementById('live-wrapper');
    const noClass = document.getElementById('no-live-class');
    
    wrapper.classList.remove('hidden');
    noClass.classList.add('hidden');

    // Update Text
    document.getElementById('live-class-title').textContent = cls.name;
    document.getElementById('live-class-category').textContent = cls.category || 'Geral';
    document.getElementById('live-class-time').innerHTML = `<i class="fa-regular fa-clock"></i> ${cls.startTime} - ${cls.endTime}`;

    // Update Visuals based on Category/Live status
    // Reset classes first if needed, but we used utility classes so we can just swap colors or backgrounds?
    // For now we keep the dark glass look.
    
    const tag = document.getElementById('live-status-badge');
    if(isLive) {
        tag.innerHTML = '<i class="fa-solid fa-tower-broadcast mr-1"></i> No Ar';
        tag.className = "px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-widest";
    } else {
        tag.innerHTML = '<i class="fa-regular fa-calendar mr-1"></i> Próxima';
        tag.className = "px-3 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-black uppercase tracking-widest";
    }
    
    // Store current class ID for global access
    currentAttendanceClassId = cls._id;
}


function getActiveClass(agenda) {
    if (!agenda || agenda.length === 0) return null;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return agenda.find(cls => currentTime >= cls.startTime && currentTime <= cls.endTime) || agenda[0];
}


function renderTimeline() {
    const timeline = document.getElementById('timeline-container');
    const nextList = document.getElementById('next-classes-list'); // Sidebar list
    
    if (!timeline) return;

    if (!dashboardData || !dashboardData.agenda || dashboardData.agenda.length === 0) {
        timeline.innerHTML = '<div class="w-full text-center text-slate-400 text-xs py-4 opacity-50">Sem aulas hoje.</div>';
        if(nextList) nextList.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Fim do expediente!</p>';
        return;
    }

    // Sort agenda by time just in case
    const sorted = dashboardData.agenda.sort((a,b) => a.startTime.localeCompare(b.startTime));
    
    // Render Timeline
    timeline.innerHTML = sorted.map(cls => {
        const isNow = currentAttendanceClassId === cls._id; // We'll need to re-render when selection changes if we want highlight
        return `
        <div onclick="selectTimelineClass('${cls._id}')" 
             class="min-w-[150px] cursor-pointer snap-start rounded-2xl p-4 transition-all hover:scale-105 active:scale-95 border
             ${isNow ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 border-orange-400' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}">
             
            <p class="text-[10px] font-black uppercase tracking-widest ${isNow ? 'text-white/80' : 'text-slate-400'} mb-1">
                ${cls.startTime}
            </p>
            <h4 class="font-black text-sm leading-tight mb-2 ${isNow ? 'text-white' : 'text-slate-800'}">
                ${cls.name}
            </h4>
            <div class="flex items-center gap-2">
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-lg ${isNow ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">
                    ${cls.category || 'Geral'}
                </span>
            </div>
        </div>
    `}).join('');
    
    // Render Sidebar List (Remaining classes only)
    if(nextList) {
        const nowTime = new Date().toTimeString().substring(0,5);
        const upcoming = sorted.filter(c => c.startTime > nowTime);
        
        if(upcoming.length > 0) {
            nextList.innerHTML = upcoming.map(cls => `
                <div onclick="selectTimelineClass('${cls._id}')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition cursor-pointer border border-transparent hover:border-slate-100">
                    <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                        ${cls.startTime}
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-700 text-xs">${cls.name}</h4>
                        <p class="text-[9px] text-slate-400 uppercase">${cls.category}</p>
                    </div>
                </div>
            `).join('');
        } else {
             nextList.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">Sem mais aulas hoje.</p>';
        }
    }
}

// User click on timeline
window.selectTimelineClass = function(classId) {
    const cls = dashboardData.agenda.find(c => c._id === classId);
    if(cls) {
        currentAttendanceClassId = classId;
        renderLiveClassMode(cls, isClassCheckinOpen(cls));
        loadClassAttendance(classId, cls.name);
        renderTimeline(); // Re-render for highlight update
    }
};


function getCategoryIcon(category) {
    if (category === 'BJJ') return '<i class="fa-solid fa-user-ninja text-blue-600"></i>';
    if (category === 'No-Gi') return '<i class="fa-solid fa-shirt text-slate-600"></i>';
    if (category === 'Kids') return '<i class="fa-solid fa-child text-orange-600"></i>';
    if (category === 'Fundamentals') return '<i class="fa-solid fa-graduation-cap text-green-600"></i>';
    return '<i class="fa-solid fa-calendar-check text-slate-400"></i>';
}

// Initialize Page
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await init();
});

function checkAuth() {
    const storedTeacher = localStorage.getItem('arena_teacher');
    if (!storedTeacher) {
        window.location.href = 'teacher-login.html';
        return;
    }
    currentTeacher = JSON.parse(storedTeacher);
}

async function init() {
    try {
        // Update header and profile info immediately from currentTeacher
        updateHeaderAndProfile();

        // Load fresh data from API
        await Promise.all([
            fetchDashboardData()
        ]);

        renderDashboard();
        // Students list is now loaded on demand per class
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Erro ao carregar dados do servidor', 'error');
    }
}


// Logic for Loading Attendance (Inline)
async function loadClassAttendance(classId, className) {
    const list = document.getElementById('live-attendance-list');
    const countEl = document.getElementById('live-count-present');
    const statusLabel = document.getElementById('attendance-status-label');

    // UI Loading State
    if (list) {
        list.innerHTML = `
            <div class="py-8 flex justify-center">
                <div class="w-8 h-8 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin"></div>
            </div>
        `;
    }
    if (statusLabel) statusLabel.textContent = "Atualizando...";

    try {
        console.log(`Fetching attendance for class ${classId}...`);
        const response = await fetch(`${window.API_BASE_URL}/teachers/classes/${classId}/attendance?t=${Date.now()}`);
        const result = await response.json();
        
        console.log('Attendance API provided:', result);

        if (result.success) {
            filteredStudents = result.data || [];
            console.log('Filtered students set to:', filteredStudents);
            currentAttendanceClassId = classId;
            renderInlineStudentsList(); // New renderer
            
            // Counts
            const presentCount = filteredStudents.filter(s => s.status === 'confirmed' || !!s.checkInTime).length;
            const reservedCount = filteredStudents.length - presentCount;
            
            if(countEl) countEl.textContent = presentCount;

            if(statusLabel) statusLabel.textContent = `${filteredStudents.length} Alunos na Lista`;
            
        } else {
            console.error('Error fetching attendance:', result.error);
            list.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Erro ao carregar lista.</p>';
        }
    } catch (error) {
        console.error('Fetch attendance error:', error);
        list.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Erro de conexão.</p>';
    }
}

// Render Inline List (Swipe-like cards)
function renderInlineStudentsList() {
    const list = document.getElementById('live-attendance-list');
    if (!list) return;

    if (filteredStudents.length === 0) {
        list.innerHTML = `
            <div class="text-center py-10 opacity-50">
                <i class="fa-solid fa-user-clock text-3xl mb-2 text-slate-300"></i>
                <p class="text-xs font-bold text-slate-400 uppercase">Lista Vazia</p>
                <p class="text-[10px] text-slate-400">Nenhum aluno reservado ainda.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = filteredStudents.map(student => {
        const sData = student.studentId || student;
        const name = sData.name || 'Aluno';
        const belt = sData.belt || 'Branca';
        
        // Degree Formatting
        const rawDegree = String(sData.degree || 'Nenhum');
        const degreeFormatted = rawDegree.toUpperCase().includes('GRAU') ? rawDegree : `${rawDegree}º Grau`;
        // Ensure we don't display '0' or 'Nenhum' or empty
        const hasDegree = sData.degree && sData.degree !== 'Nenhum' && sData.degree != 0 && sData.degree !== '0';
        const degreeText = hasDegree ? ` • ${degreeFormatted}` : '';

        const beltStyle = getBeltStyle(belt);
        const initials = name.substring(0,2).toUpperCase();
        
        const isConfirmed = !!student.checkInTime || student.status === 'confirmed';
        const isReserved = !isConfirmed;

        // Check if class check-in is open
        const currentClass = dashboardData?.agenda?.find(c => c._id === (student.classId || currentAttendanceClassId));
        const isOpen = currentClass ? isClassCheckinOpen(currentClass) : false;

        // Action Logic
        let actionBtn = '';
        if (isConfirmed) {
            actionBtn = `
                <div class="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center border border-green-100 shadow-sm">
                    <i class="fa-solid fa-check"></i>
                </div>
            `;
        } else if (!isOpen) { 
             actionBtn = `
                <div title="Check-in fechado (Abre 15min antes)" class="w-10 h-10 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center border border-slate-200 cursor-not-allowed">
                    <i class="fa-regular fa-clock"></i>
                </div>
            `;
        } else {
            actionBtn = `
                <button onclick="quickConfirm('${sData._id}', '${student.classId || currentAttendanceClassId}', this)" 
                    class="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100 shadow-sm hover:bg-orange-500 hover:text-white transition-all active:scale-95">
                    <i class="fa-solid fa-check"></i>
                </button>
            `;
        }
        
        const checkInTimeText = student.checkInTime ? 
            new Date(student.checkInTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : 'Confirmado';

        const statusText = isConfirmed ? 
            `<span class="text-[9px] font-bold text-green-500 uppercase">Presente ${student.checkInTime ? 'às ' + checkInTimeText : ''}</span>` : 
            `<span class="text-[9px] font-bold text-blue-500 uppercase">Reservado</span>`;

        return `
            <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between group transition hover:border-orange-200">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-sm text-slate-400 border border-slate-100">
                        ${initials}
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-800 text-sm leading-tight">${name}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase border" style="background: ${beltStyle.bg}; color: ${beltStyle.text}; border-color: ${beltStyle.border}">
                                ${belt}${degreeText}
                            </span>
                            ${statusText}
                        </div>
                    </div>
                </div>
                <div>
                   ${actionBtn}
                </div>
            </div>
        `;
    }).join('');
}

// Quick Confirm Action
window.quickConfirm = async function(studentId, classId, btn) {
    if(!classId || classId === 'undefined') classId = currentAttendanceClassId;
    
    // Optimistic UI Update
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    btn.classList.add('pointer-events-none');
    
    // Resolve Franchise ID safely
    let franchiseId = null;
    if(currentTeacher && currentTeacher.franchiseId) {
        if(typeof currentTeacher.franchiseId === 'object') {
            franchiseId = currentTeacher.franchiseId._id;
        } else {
             franchiseId = currentTeacher.franchiseId;
        }
    }
    
    // Fallback if still null (should not happen if data loaded)
    if(!franchiseId && dashboardData && dashboardData.franchise) {
        franchiseId = dashboardData.franchise._id;
    }

    // Determine Action (Add or Remove)
    const studentIdx = filteredStudents.findIndex(s => (s.studentId && s.studentId._id === studentId) || s._id === studentId);
    let isRemoving = false;
    if(studentIdx !== -1) {
        const s = filteredStudents[studentIdx];
        if(s.status === 'confirmed' || !!s.checkInTime) {
            isRemoving = true;
        }
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/teachers/attendance`, {
            method: isRemoving ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: studentId,
                classId: classId,
                teacherId: currentTeacher._id,
                franchiseId: franchiseId
            })
        });
        
        const result = await response.json();
        
        if(result.success) {
            
            if(studentIdx !== -1) {
                // Optimistic Update
                if (isRemoving) {
                    filteredStudents[studentIdx].status = 'active'; // reserved/active
                    filteredStudents[studentIdx].checkInTime = null;
                    
                    // Visual Reset
                     btn.className = "w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100 shadow-sm hover:bg-orange-500 hover:text-white transition-all active:scale-95";
                     btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                     
                     // Decrement Count
                    const countEl = document.getElementById('live-count-present');
                    if(countEl) {
                        const current = parseInt(countEl.textContent) || 0;
                        countEl.textContent = Math.max(0, current - 1);
                    }

                } else {
                    filteredStudents[studentIdx].status = 'confirmed';
                    filteredStudents[studentIdx].checkInTime = new Date().toISOString();
                    
                    // Visual Success
                    btn.className = "w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg transform scale-110 transition-all";
                    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    
                    // Increment Count
                    const countEl = document.getElementById('live-count-present');
                    if(countEl) {
                        const current = parseInt(countEl.textContent) || 0;
                        countEl.textContent = current + 1;
                    }
                }
                
                // Re-render list
                renderInlineStudentsList();
            }

            // Background Refresh 
            setTimeout(() => {
                fetchDashboardData(); 
            }, 1000);
        } else {
            const errorMsg = result.message || result.error || 'Erro na operação';
            console.error('Attendance Error:', result);
            showToast(errorMsg, 'error');
            btn.innerHTML = originalContent;
            btn.classList.remove('pointer-events-none');
        }
    } catch(err) {
        console.error(err);
        btn.innerHTML = originalContent;
        btn.classList.remove('pointer-events-none');
    }
};

window.confirmAllAttendance = async function() {
    if(!filteredStudents || filteredStudents.length === 0) {
        showToast('Lista vazia', 'error');
        return;
    }
    
    // Filter only those not confirmed yet
    const toConfirm = filteredStudents.filter(s => !s.checkInTime).map(s => s.studentId._id || s.studentId);
    
    if(toConfirm.length === 0) {
        showToast('Todos já confirmados!', 'success');
        return;
    }

    showPortalConfirm('Confirmar Todos', `Deseja marcar presença para ${toConfirm.length} alunos?`, async () => {
        
        showToast(`Processando ${toConfirm.length} alunos...`, 'success');
        
        // Resolve Franchise ID safely
        let franchiseId = null;
        if(currentTeacher && currentTeacher.franchiseId) {
            if(typeof currentTeacher.franchiseId === 'object') {
                franchiseId = currentTeacher.franchiseId._id;
            } else {
                 franchiseId = currentTeacher.franchiseId;
            }
        }
        if(!franchiseId && dashboardData && dashboardData.franchise) {
            franchiseId = dashboardData.franchise._id;
        }

        const promises = toConfirm.map(sid => 
             fetch(`${window.API_BASE_URL}/teachers/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: sid,
                    classId: currentAttendanceClassId,
                    teacherId: currentTeacher._id,
                    franchiseId: franchiseId
                })
            })
        );
        
        await Promise.all(promises);
        
        // Optimistic Update All
        toConfirm.forEach(sid => {
            const idx = filteredStudents.findIndex(s => (s.studentId && s.studentId._id === sid) || s._id === sid);
            if(idx !== -1) {
                filteredStudents[idx].status = 'confirmed';
                filteredStudents[idx].checkInTime = new Date().toISOString();
            }
        });
        renderInlineStudentsList();
        
        showToast('Todos confirmados!', 'success');
        
        // Background sync
        setTimeout(() => loadClassAttendance(currentAttendanceClassId), 1000);
    });
};

function getBeltStyle(belt) {
    const beltColors = {
        'Branca': { bg: '#F8FAFC', text: '#334155', border: '#CBD5E1' },
        'Cinza': { bg: '#6B7280', text: '#FFFFFF', border: '#6B7280' },
        'Amarela': { bg: '#FCD34D', text: '#713F12', border: '#FCD34D' },
        'Laranja': { bg: '#FF6B00', text: '#FFFFFF', border: '#FF6B00' },
        'Verde': { bg: '#22C55E', text: '#FFFFFF', border: '#22C55E' },
        'Azul': { bg: '#3B82F6', text: '#FFFFFF', border: '#3B82F6' },
        'Roxa': { bg: '#A855F7', text: '#FFFFFF', border: '#A855F7' },
        'Marrom': { bg: '#92400E', text: '#FFFFFF', border: '#92400E' },
        'Preta': { bg: '#09090b', text: '#FFFFFF', border: '#000000' },
        'Coral': { bg: 'repeating-linear-gradient(90deg, #F00 0, #F00 10px, #FFF 10px, #FFF 20px)', text: '#000000', border: '#DC2626' },
        'Vermelha': { bg: '#EE1111', text: '#FFFFFF', border: '#EE1111' }
    };
    return beltColors[belt] || beltColors['Branca'];
}

// Search Logic
const searchInput = document.getElementById('student-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filteredStudents = students.filter(s => s.name.toLowerCase().includes(term));
        renderStudents();
    });
}

// Attendance Logic
let selectedStudentForAttendance = null;

// --- ALL STUDENTS LIST LOGIC ---
function renderAllStudentsList() {
    const list = document.getElementById('all-students-list');
    if (!list) return;

    const searchTerm = document.getElementById('all-students-search')?.value.toLowerCase() || '';
    const beltFilter = document.getElementById('all-students-belt-filter')?.value || 'Todas';

    const displayStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm);
        const matchesBelt = beltFilter === 'Todas' || s.belt === beltFilter;
        return matchesSearch && matchesBelt;
    });

    if (displayStudents.length === 0) {
        list.innerHTML = `
            <div class="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
                <i class="fa-solid fa-users-slash text-4xl mb-4"></i>
                <p class="text-sm font-bold uppercase">Nenhum aluno encontrado</p>
                <p class="text-xs italic">Tente mudar o filtro ou termo de busca.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = displayStudents.map(student => {
        const rawDegree = String(student.degree || 0);
        const degreeFormatted = rawDegree.toUpperCase().includes('GRAU') ? rawDegree : `${rawDegree}º Grau`;
        const degreeText = student.degree && student.degree !== 'Nenhum' ? ` • ${degreeFormatted}` : '';
        const beltStyle = getBeltStyle(student.belt);
        const statusClass = student.paymentStatus === 'Paga' ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50';
        const statusText = student.paymentStatus === 'Paga' ? 'Em Dia' : 'Atrasada';

        // Calculate age
        let ageText = '';
        if (student.birthDate) {
            const birth = new Date(student.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            ageText = `${age} anos`;
        }

        return `
            <div class="bg-white rounded-3xl border border-slate-100 p-5 flex items-center justify-between hover:border-orange-200 transition-all group">
                <div class="flex items-center gap-6 flex-1 min-w-0">
                    <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xl transition-all group-hover:scale-105 shadow-sm">
                        ${student.name.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-base font-black text-slate-800 tracking-tight mb-1 truncate">${student.name}</h4>
                        <div class="flex items-center gap-2">
                             <span class="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm" style="background: ${beltStyle.bg}; color: ${beltStyle.text}; border-color: ${beltStyle.border}">
                                ${student.belt}${degreeText}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-8 px-8 border-x border-slate-50 hidden lg:flex">
                    <div class="text-right">
                        <p class="text-[10px] font-black text-slate-800 uppercase tracking-wider mb-0.5">${student.phone || 'Sem Telefone'}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${student.gender || 'Não Inf.'} • ${ageText}</p>
                    </div>
                </div>

                <div class="flex items-center gap-6 pl-8">
                    <div class="text-center hidden sm:block">
                        <span class="text-[8px] font-black uppercase text-slate-300 block mb-1">Financeiro</span>
                        <span class="text-[9px] font-black ${statusClass} px-3 py-1 rounded-full border shadow-sm">
                            ${statusText.toUpperCase()}
                        </span>
                    </div>
                    <button onclick="openAttendanceModal('${student._id}', '${student.name.replace(/'/g, "\\'")}')" 
                        class="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-sm active:scale-95 group/btn">
                        <i class="fa-solid fa-user-check text-lg group-hover/btn:animate-pulse"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Add filters listeners
document.addEventListener('input', (e) => {
    if (e.target.id === 'all-students-search') {
        renderAllStudentsList();
    }
});

document.addEventListener('change', (e) => {
    if (e.target.id === 'all-students-belt-filter') {
        renderAllStudentsList();
    }
    if (e.target.id === 'all-students-scope-filter') {
        fetchStudents(e.target.value);
    }
});

function isClassCheckinOpen(cls) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = cls.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;

    const [endH, endM] = cls.endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;

    // Habilita 15 minutos antes
    return currentMinutes >= (startMinutes - 15) && currentMinutes <= endMinutes;
}

function openAttendanceModal(studentId, studentName) {
    selectedStudentForAttendance = studentId;

    const nameEl = document.getElementById('attendance-student-name');
    if (nameEl) nameEl.textContent = studentName;

    // Check financial status
    const student = students.find(s => s._id === studentId);
    const isOverdue = student && student.paymentStatus === 'Atrasada';

    const banner = document.getElementById('attendance-warning-banner');
    const select = document.getElementById('attendance-class-select');
    const selectContainer = select ? select.parentElement : null;
    const btn = document.getElementById('confirm-attendance-btn');

    // UI Updates based on status
    if (banner) {
        if (isOverdue) {
            banner.classList.remove('hidden');
            if (selectContainer) selectContainer.classList.add('hidden');
        } else {
            banner.classList.add('hidden');
            if (selectContainer) selectContainer.classList.remove('hidden');
        }
    }

    // Populate class select with filtering (only if not overdue)
    if (select && dashboardData && dashboardData.agenda) {
        if (isOverdue) {
            // Clear select if overdue to be safe, though it's hidden
            select.innerHTML = '';
        } else {
            // Filter classes that are currently "open" for check-in
            const validClasses = dashboardData.agenda.filter(isClassCheckinOpen);

            if (validClasses.length > 0) {
                select.innerHTML = validClasses.map(cls => `
                <option value="${cls._id}">${cls.name} (${cls.startTime}) - Aberta</option>
            `).join('');
                select.disabled = false;
            } else {
                if (dashboardData.agenda.length > 0) {
                    select.innerHTML = `<option value="" disabled selected>Nenhuma aula disponível para check-in agora (início -15min)</option>`;
                    select.disabled = true;
                } else {
                    select.innerHTML = `<option value="" disabled selected>Sem aulas hoje</option>`;
                    select.disabled = true;
                }
            }
        }
    }

    const modal = document.getElementById('attendance-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // Animate in
        const content = modal.querySelector('.relative.z-10');
        if (content) {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }
    }

    // Disable confirm button logic
    if (btn) {
        if (isOverdue) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            // Reset opacity/cursor first
            btn.classList.remove('opacity-50', 'cursor-not-allowed');

            if (select) {
                btn.disabled = select.disabled;
                if (select.disabled) {
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                }
            }
        }
    }
}

function closeAttendanceModal() {
    const modal = document.getElementById('attendance-modal');
    const panel = document.getElementById('attendance-panel');
    if (panel) {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => {
        if (modal) {
            modal.classList.add('hidden');
        }
    }, 300);
    selectedStudentForAttendance = null;
}

const confirmBtn = document.getElementById('confirm-attendance-btn');
if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
        const select = document.getElementById('attendance-class-select');
        const classId = select ? select.value : null;

        if (!selectedStudentForAttendance || !classId) return;

        // Set button state
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

        try {
            const response = await fetch(`${window.API_BASE_URL}/teachers/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudentForAttendance,
                    classId: classId,
                    teacherId: currentTeacher._id,
                    franchiseId: currentTeacher.franchiseId._id || currentTeacher.franchiseId
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast('Presença confirmada!', 'success');
                closeAttendanceModal();
                // Refresh data
                fetchDashboardData().then(renderDashboard);
            } else {
                showToast(result.error || 'Erro ao registrar presença', 'error');
            }
        } catch (error) {
            showToast('Erro de conexão', 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    });
}

// Logout
function logout() {
    showPortalConfirm('Sair do Portal', 'Deseja realmente encerrar sua sessão de professor?', () => {
        localStorage.removeItem('arena_teacher');
        window.location.href = 'teacher-login.html';
    });
}

// Global UI Helpers
window.closeModal = function () {
    const modal = document.getElementById('ui-modal');
    const panel = document.getElementById('modal-panel');
    if (panel) {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => {
        if (modal) modal.style.display = 'none';
    }, 300);
};

window.showPortalConfirm = function (title, message, onConfirm) {
    const modal = document.getElementById('ui-confirm-modal');
    const panel = document.getElementById('confirm-panel');
    const backdrop = document.getElementById('confirm-backdrop');
    if (!modal) return;
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerText = message;
    const yesBtn = document.getElementById('btn-confirm-yes');
    yesBtn.onclick = () => {
        closeConfirmModal();
        if (onConfirm) onConfirm();
    };
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.closeConfirmModal = function () {
    const modal = document.getElementById('ui-confirm-modal');
    const panel = document.getElementById('confirm-panel');
    const backdrop = document.getElementById('confirm-backdrop');
    if (panel) {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
    }
    setTimeout(() => {
        if (modal) modal.style.display = 'none';
    }, 300);
};

// Toast util
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;

    toastMsg.textContent = message;

    if (type === 'success') {
        toastIcon.className = 'w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg';
    } else {
        toastIcon.className = 'w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg';
    }

    toast.classList.remove('opacity-0', 'translate-x-32');
    toast.classList.add('opacity-100', 'translate-x-0');

    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-x-0');
        toast.classList.add('opacity-0', 'translate-x-32');
    }, 3000);
}

// --- WHITE LABEL / BRANDING ---
function applyBranding(franchise) {
    if (!franchise || !franchise.branding) return;
    const b = franchise.branding;

    const primaryColor = b.primaryColor || '#3B82F6';
    const brandName = b.brandName || franchise.name;
    console.log(`🎨 Applying branding: ${brandName} -> ${primaryColor}`);

    // Set Global CSS Variable for Sensei & Systems
    document.documentElement.style.setProperty('--brand-primary', primaryColor);

    // 1. CSS Styles
    const styleEl = document.getElementById('branding-styles');
    if (styleEl) {
        styleEl.innerHTML = `
            /* Sidebar & Menu Branding */
            .sidebar-item-active {
                background-color: ${primaryColor}15 !important;
                color: ${primaryColor} !important;
                border-left: 4px solid ${primaryColor} !important;
            }
            .sidebar-item-active i {
                color: ${primaryColor} !important;
            }
            .hover\\:text-orange-600:hover { color: ${primaryColor} !important; }
            .orange-gradient {
                background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%) !important;
            }
            .text-orange-500, .text-orange-600 { color: ${primaryColor} !important; }

            /* Active Class Card & Logo Branding Override */
            #active-class-card { background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%) !important; }

            /* Dynamic Button Branding */
            .active-presence-btn { background-color: ${primaryColor} !important; }
            .active-presence-btn:hover { filter: brightness(110%); }
            .bg-brand-500 { background-color: ${primaryColor} !important; }
            .btn-primary { background-color: ${primaryColor} !important; }
            .btn-primary:hover { box-shadow: 0 8px 16px ${primaryColor}33 !important; }

            /* Selected Card Branding */
            .brand-ring { box-shadow: 0 0 0 2px ${primaryColor} !important; }
            .brand-bg-light { background-color: ${primaryColor}15 !important; }
        `;
    }

    // 2. Logo
    const logoImg = document.getElementById('logo-img');
    const logoIcon = document.getElementById('logo-icon');
    if (b.logoUrl && logoImg) {
        logoImg.src = b.logoUrl;
        logoImg.classList.remove('hidden');
        if (logoIcon) logoIcon.classList.add('hidden');
        document.getElementById('logo-container').classList.remove('bg-gradient-to-br');
    }

    // 3. Favicon & Title
    if (b.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = b.faviconUrl;
    }
    document.title = `${brandName} | Painel do Professor`;
}

// --- WEEKLY SCHEDULE LOGIC ---
let currentScheduleFilter = 'my'; // 'my' or 'all'
let allWeeklyClasses = [];

async function loadTeacherSchedule() {
    try {
        if (!currentTeacher || !currentTeacher.franchiseId) return;

        const franchiseId = currentTeacher.franchiseId._id || currentTeacher.franchiseId;
        const timestamp = new Date().getTime();
        
        // Refresh metrics too to keep everything in sync
        if (typeof fetchDashboardData === 'function') fetchDashboardData().then(renderDashboard);

        const response = await fetch(`${window.API_BASE_URL}/classes/franchise/${franchiseId}?view=week&_t=${timestamp}`);
        const result = await response.json();

        if (result.success) {
            allWeeklyClasses = result.data || [];
            renderTeacherSchedule();
        }
    } catch (error) {
        console.error('Error loading teacher schedule:', error);
        showToast('Erro ao carregar grade de horários', 'error');
    }
}

function renderTeacherSchedule() {
    // Apply filter
    const classesToShow = currentScheduleFilter === 'my' 
        ? allWeeklyClasses.filter(cls => {
            const teacherId = cls.teacherId?._id || cls.teacherId;
            return teacherId === currentTeacher._id;
        })
        : allWeeklyClasses;

    // Clear all columns
    for (let i = 0; i < 7; i++) {
        const col = document.getElementById(`teacher-day-col-${i}`);
        if (col) col.innerHTML = '';
    }

    // Group classes by day and render
    classesToShow.forEach(cls => {
        const col = document.getElementById(`teacher-day-col-${cls.dayOfWeek}`);
        if (col) {
            const teacherName = cls.teacherId?.name || 'Professor';
            const categoryColor = getScheduleCategoryColor(cls.category);
            const isMyClass = (cls.teacherId?._id || cls.teacherId) === currentTeacher._id;

            // Booking Info (Capacity and Availability)
            const booking = cls.bookingInfo || { availableSlots: 30, capacity: 30 };
            const isFull = booking.availableSlots <= 0;
            const slotsColor = isFull ? 'text-red-500' : (booking.availableSlots < 5 ? 'text-orange-500' : 'text-slate-400');
            const targetDateStr = booking.nextDate || '';

            col.innerHTML += `
                <div onclick="openClassBookingsModal('${cls._id || cls.id}', '${cls.name}', '${targetDateStr}')" 
                    class="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition group relative cursor-pointer active:scale-95 ${isMyClass ? 'ring-2 ring-orange-200' : ''}">
                    <div class="flex justify-between items-start mb-0.5">
                        <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-${categoryColor}-50 text-${categoryColor}-600 border border-${categoryColor}-100">
                            ${cls.category || 'Geral'}
                        </span>
                        ${isMyClass ? '<span class="text-[8px] font-bold uppercase text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">Minha</span>' : ''}
                    </div>
                    
                    <div class="mb-1.5">
                        <span class="text-[8px] font-black uppercase ${slotsColor} inline-block">
                            ${booking.availableSlots}/${booking.capacity} VAGAS
                        </span>
                    </div>

                    <h4 class="font-bold text-slate-700 text-xs mb-0.5 leading-tight">${cls.name}</h4>
                    <p class="text-[10px] text-slate-400 mb-2 truncate">${teacherName}</p>
                    <div class="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                        <i class="fa-regular fa-clock text-slate-400"></i>
                        ${cls.startTime} - ${cls.endTime}
                    </div>
                </div>
            `;
        }
    });

    // Show empty message if no classes
    for (let i = 0; i < 7; i++) {
        const col = document.getElementById(`teacher-day-col-${i}`);
        if (col && col.innerHTML.trim() === '') {
            col.innerHTML = `
                <div class="text-center py-8 text-slate-300 text-[10px]">
                    <i class="fa-regular fa-calendar-xmark mb-2 text-2xl block opacity-30"></i>
                    <p>Sem aulas</p>
                </div>
            `;
        }
    }
}

function getScheduleCategoryColor(category) {
    const map = {
        'BJJ': 'blue',
        'No-Gi': 'red',
        'Wrestling': 'orange',
        'Kids': 'green',
        'Fundamentals': 'slate'
    };
    return map[category] || 'slate';
}

window.filterSchedule = function(filterValue) {
    currentScheduleFilter = filterValue;
    renderTeacherSchedule();
};

// --- CLASS BOOKINGS LIST MODAL ---
window.openClassBookingsModal = async function(classId, className, dateStrFromModel) {
    if (!dateStrFromModel) {
        showToast('⚠️ Data da aula não identificada.', 'error');
        return;
    }

    const dateStr = new Date(dateStrFromModel).toISOString();

    const modal = document.getElementById('ui-modal');
    const panel = document.getElementById('modal-panel');
    const content = document.getElementById('modal-content');

    if (!modal || !panel || !content) {
        console.error('Modal elements not found');
        return;
    }

    // Initial Loading State
    content.innerHTML = `
        <div class="text-center py-4">
            <h2 class="text-2xl font-black text-slate-800 mb-1 leading-tight">${className}</h2>
            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-8">Lista de Reservas</p>
            
            <div id="bookings-loader" class="flex flex-col items-center py-10">
                <div class="w-12 h-12 border-4 border-orange-50 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Buscando alunos...</p>
            </div>
            
            <div id="bookings-list-container" class="hidden text-left space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            </div>

            <button onclick="closeModal()" class="w-full mt-8 py-4 orange-gradient text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-lg active:scale-95">
                Fechar Lista
            </button>
        </div>
    `;

    // Show Modal
    modal.style.display = 'flex';
    setTimeout(() => {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    }, 10);

    try {
        const res = await fetch(`${window.API_BASE_URL}/bookings/list?classId=${classId}&date=${dateStr}`);
        const result = await res.json();
        
        const loader = document.getElementById('bookings-loader');
        const listContainer = document.getElementById('bookings-list-container');
        
        if (result.success && result.data && result.data.length > 0) {
            let html = '';
            result.data.forEach(booking => {
                const student = booking.studentId;
                if (!student) return;
                
                const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                const isConfirmed = booking.status === 'confirmed';
                const statusLabel = isConfirmed ? 'Presente' : 'Reservado';
                const statusColor = isConfirmed ? 'text-blue-500 border-blue-100' : 'text-green-500 border-green-100';
                const statusIcon = isConfirmed ? 'fa-solid fa-user-check' : 'fa-solid fa-check-circle';

                const beltStyle = getBeltStyle(student.belt || 'Branca');

                const rawDegree = String(student.degree || 'Nenhum');
                const degreeFormatted = rawDegree.toUpperCase().includes('GRAU') ? rawDegree : `${rawDegree}º Grau`;
                // Ensure we don't display '0' or 'Nenhum' or empty
                const hasDegree = student.degree && student.degree !== 'Nenhum' && student.degree != 0 && student.degree !== '0';
                const degreeText = hasDegree ? ` • ${degreeFormatted}` : '';

                html += `
                    <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-orange-200 transition-all group">
                        <div class="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                            ${initials}
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <h4 class="font-bold text-slate-800 text-sm truncate">${student.name}</h4>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase border" style="background: ${beltStyle.bg}; color: ${beltStyle.text}; border-color: ${beltStyle.border}">
                                    ${student.belt || 'Branca'}${degreeText}
                                </span>
                            </div>
                        </div>
                        <div class="bg-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusColor} border shadow-sm flex items-center gap-2">
                            <i class="${statusIcon}"></i>
                            <span class="hidden sm:inline">${statusLabel}</span>
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;
            loader.classList.add('hidden');
            listContainer.classList.remove('hidden');
        } else {
            loader.innerHTML = `
                <div class="opacity-30 flex flex-col items-center py-6">
                    <i class="fa-solid fa-users-slash text-5xl mb-4 text-slate-400"></i>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum aluno reservado</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        if (document.getElementById('bookings-loader')) {
            document.getElementById('bookings-loader').innerHTML = `
                <div class="text-red-500 font-bold text-[10px] uppercase tracking-widest py-10">Erro ao carregar lista</div>
            `;
        }
    }
};

// --- GRADUATION LOGIC (Ported from Franchisee Widget) ---

window.loadGraduationView = async function() {
    const container = document.getElementById('section-graduation');
    if (!container) return;

    // Render Container Logic
    container.innerHTML = `
        <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
            <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl">
                    <i class="fa-solid fa-medal"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">Gestão de Graduações</h2>
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Alunos aptos para promoção</p>
                </div>
            </div>

            <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm">Alunos Prontos para Graduar</h3>
                        <p class="text-[10px] text-slate-400">Com base em frequência e tempo mínimo</p>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-[11px]">
                        <thead class="bg-slate-50/50 text-slate-500 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100">
                            <tr>
                                <th class="px-6 py-4">Aluno</th>
                                <th class="px-6 py-4">De -> Para</th>
                                <th class="px-6 py-4">Aulas</th>
                                <th class="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody id="teacher-graduation-table-body" class="divide-y divide-slate-50">
                            <tr>
                                <td colspan="4" class="text-center py-10 text-slate-400">
                                    <i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Verificando...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="p-4 bg-orange-50/50 border-t border-orange-100/50 text-orange-600 text-[10px] font-medium italic">
                    <i class="fa-solid fa-circle-info mr-1"></i> Só aparecem nesta lista alunos que atingiram critério de tempo e presença.
                </div>
            </div>
        </div>
    `;

    updateGraduationTable();
};

async function updateGraduationTable() {
    const tableBody = document.getElementById('teacher-graduation-table-body');
    if (!tableBody) return;

    // Resolve Franchise ID
    let franchiseId = null;
    if (currentTeacher && currentTeacher.franchiseId) {
        franchiseId = typeof currentTeacher.franchiseId === 'object' ? currentTeacher.franchiseId._id : currentTeacher.franchiseId;
    } else if (dashboardData && dashboardData.franchise) {
        franchiseId = dashboardData.franchise._id;
    }

    if (!franchiseId) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-red-400 text-xs">Erro: Unidade não identificada.</td></tr>';
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/graduation/eligible/${franchiseId}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        const eligibleStudents = result.data || [];

        if (eligibleStudents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-slate-400 italic">Nenhum aluno elegível no momento.</td></tr>';
            return;
        }

        const renderBadge = (fullString) => {
            if (!fullString) return '';
            const parts = fullString.split(' - ');
            const belt = parts[0] || 'Branca';
            const style = getBeltStyle(belt); // Using existing helper
            return `<span class="inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border whitespace-nowrap" 
                          style="background: ${style.bg}; color: ${style.text}; border-color: ${style.border};">
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
                    <button onclick="processTeacherPromotion('${s.id}', '${s.name}', '${s.next}')" 
                            class="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-[9px] font-bold hover:bg-brand-600 transition shadow-sm uppercase tracking-wider mobile-touch-target">
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

window.processTeacherPromotion = async (studentId, name, nextLevel) => {
    const confirmMsg = `Deseja confirmar a graduação de ${name} para ${nextLevel}?`;

    showPortalConfirm('Confirmar Graduação', confirmMsg, () => executeTeacherPromotion(studentId, name, nextLevel));
};

async function executeTeacherPromotion(studentId, name, nextLevel) {
    try {
        const payload = { 
            studentId, 
            teacherId: currentTeacher._id 
        };

        const response = await fetch(`${window.API_BASE_URL}/graduation/promote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (resData.success) {
            showToast(`${name} graduado com sucesso!`, 'success');
            
            // Refresh table
            updateGraduationTable();
        } else {
            throw new Error(resData.message || 'Erro ao processar graduação');
        }
    } catch (error) {
        console.error('Erro ao processar graduação:', error);
        showToast('Não foi possível realizar a graduação.', 'error');
    }
}
