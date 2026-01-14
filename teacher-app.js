/**
 * Arena Hub - Teacher Portal Logic
 * Manages states, API calls, and UI updates for the instructor dashboard.
 */

// State Management
let currentTeacher = null;
let dashboardData = null;
let students = [];
let filteredStudents = [];

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

        pBelt.className = `inline-block px-4 py-1.5 rounded-full text-[10px] font-black mt-2 uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`;
        pBelt.textContent = `${belt}${degree}`.toUpperCase();
    }

    const pFranchise = document.getElementById('profile-franchise');
    if (pFranchise) pFranchise.textContent = currentTeacher.franchiseId?.name || 'Unidade Arena';

    const pEmail = document.getElementById('profile-email');
    if (pEmail) pEmail.textContent = currentTeacher.email;

    const pHire = document.getElementById('profile-hire-date');
    if (pHire) pHire.textContent = new Date(currentTeacher.createdAt).toLocaleDateString('pt-BR');

    // Avatar initial
    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.textContent = currentTeacher.name.charAt(0);

    const avatarLarge = document.getElementById('profile-avatar-large');
    if (avatarLarge) avatarLarge.textContent = currentTeacher.name.charAt(0);
}

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

async function fetchStudents() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/teachers/${currentTeacher._id}/students`);
        const result = await response.json();

        if (result.success) {
            students = result.data;
            filteredStudents = [...students];
        }
    } catch (error) {
        console.error('Fetch students error:', error);
    }
}

function renderDashboard() {
    if (!dashboardData) return;

    // Stats
    const totalEl = document.getElementById('stat-total-students');
    if (totalEl) totalEl.textContent = dashboardData.stats.totalStudents || 0;

    const attendEl = document.getElementById('stat-attendance-today');
    if (attendEl) attendEl.textContent = dashboardData.stats.attendanceToday || 0;

    // Active Class
    const activeClass = getActiveClass(dashboardData.agenda);
    const activeClassCard = document.getElementById('active-class-card');

    if (activeClass) {
        const nameEl = document.getElementById('active-class-name');
        if (nameEl) nameEl.textContent = activeClass.name;

        const catEl = document.getElementById('active-class-category');
        if (catEl) catEl.textContent = activeClass.category; // Or use hardcoded text like "AULA ATUAL" and just update details

        const timeEl = document.getElementById('active-class-time');
        if (timeEl) timeEl.textContent = `${activeClass.startTime} - ${activeClass.endTime}`;

        // Use brand border if using light theme active card, but we are using dark gradient card so border might be subtle
        if (activeClassCard) activeClassCard.classList.add('border-brand-500/50');
    }

    // Recent Attendance
    const recentList = document.getElementById('recent-attendance-list');
    if (recentList && dashboardData.recentAttendance) {
        if (dashboardData.recentAttendance.length > 0) {
            recentList.innerHTML = dashboardData.recentAttendance.map(att => `
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                            ${att.studentId?.name ? att.studentId.name.charAt(0) : '?'}
                        </div>
                        <div>
                            <p class="text-sm font-bold text-slate-800">${att.studentId?.name || 'Aluno Desconhecido'}</p>
                            <p class="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                <i class="fa-regular fa-clock"></i>
                                ${new Date(att.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <span class="px-2 py-1 rounded bg-green-100 text-green-600 text-[10px] font-black uppercase tracking-wide">Presente</span>
                </div>
            `).join('');
        } else {
            recentList.innerHTML = `
                <div class="text-center py-6 text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
                    <i class="fa-solid fa-clock opacity-50 mb-2"></i>
                    <p class="text-xs font-bold uppercase">Sem registros recentes</p>
                </div>
            `;
        }
    }
}

function getActiveClass(agenda) {
    if (!agenda || agenda.length === 0) return null;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return agenda.find(cls => currentTime >= cls.startTime && currentTime <= cls.endTime) || agenda[0];
}

function renderAgenda() {
    const agendaList = document.getElementById('agenda-list');
    if (!agendaList) return;

    if (!dashboardData || !dashboardData.agenda || dashboardData.agenda.length === 0) {
        agendaList.innerHTML = '<p class="text-xs text-slate-400 italic text-center">Sem aulas programadas para hoje.</p>';
        return;
    }

    const categoryColors = {
        'BJJ': { bg: 'bg-blue-100', text: 'text-blue-600' },
        'No-Gi': { bg: 'bg-slate-200', text: 'text-slate-600' },
        'Kids': { bg: 'bg-orange-100', text: 'text-orange-600' },
        'Fundamentals': { bg: 'bg-green-100', text: 'text-green-600' }
    };

    agendaList.innerHTML = dashboardData.agenda.map(cls => {
        const style = categoryColors[cls.category] || categoryColors['BJJ'];
        // Check local state for persistence
        return `
        <div id="agenda-card-${cls._id}" onclick="loadClassAttendance('${cls._id}', '${cls.name.replace(/'/g, "\\'")}')" class="cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md hover:bg-white transition-all group">
            <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="flex-shrink-0 w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    ${getCategoryIcon(cls.category)}
                </div>
                <div>
                    <h3 class="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">${cls.name}</h3>
                     <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <i class="fa-solid fa-user-tie text-slate-400"></i> ${currentTeacher.name}
                    </p>
                </div>
            </div>
            
            <div class="flex items-center gap-4 w-full md:w-auto justify-end">
               <div class="text-right">
                    <p class="text-[9px] text-slate-400 uppercase font-bold">Horário</p>
                    <p class="text-sm font-black text-slate-700">${cls.startTime}</p>
               </div>
               <div class="text-slate-300 group-hover:text-blue-500 transition-colors">
                    <i class="fa-solid fa-chevron-right"></i>
               </div>
            </div>
        </div>
    `}).join('');
}

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
        renderAgenda();
        // Students list is now loaded on demand per class
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Erro ao carregar dados do servidor', 'error');
    }
}

// New Function: Load Class Attendance
async function loadClassAttendance(classId, className) {
    const list = document.getElementById('students-attendance-list');
    const header = document.getElementById('attendance-header');
    const placeholder = document.getElementById('attendance-placeholder');
    const classNameEl = document.getElementById('attendance-class-name');

    // UI Loading State
    if (placeholder) placeholder.classList.add('hidden');
    if (header) header.classList.remove('hidden');
    if (list) {
        list.classList.remove('hidden');
        list.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                <p class="text-xs">Carregando lista de presença...</p>
            </div>
        `;
    }
    if (classNameEl) classNameEl.textContent = className;

    // Highlight selected class in agenda (optional visual cue)
    document.querySelectorAll('.agenda-card').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50'));
    const selectedCard = document.getElementById(`agenda-card-${classId}`);
    if (selectedCard) selectedCard.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');

    try {
        const response = await fetch(`${window.API_BASE_URL}/teachers/classes/${classId}/attendance`);
        const result = await response.json();

        if (result.success) {
            filteredStudents = [...students];
            renderStudents(true);
        } else {
            console.error('Error fetching attendance:', result.error);
            list.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Erro ao carregar lista.</p>';
        }
    } catch (error) {
        console.error('Fetch attendance error:', error);
        list.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Erro de conexão.</p>';
    }
}

window.confirmClassPresence = function (btn, classId) {
    // Visual feedback
    const originalWidth = btn.offsetWidth;
    btn.style.width = `${originalWidth}px`; // Maintain width
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    btn.disabled = true;

    // Simulate API delay
    setTimeout(() => {
        btn.innerHTML = 'Presença Confirmada';
        btn.classList.remove('active-presence-btn', 'bg-brand-500', 'hover:bg-brand-600');
        btn.classList.add('bg-green-500', 'opacity-80', 'cursor-not-allowed');

        // Persist local state
        localStorage.setItem(`class_confirmed_${classId}`, 'true');

        showToast('Presença na aula confirmada!', 'success');
    }, 600);
}

function renderStudents(isAttendanceList = false) {
    const list = document.getElementById('students-attendance-list');
    if (!list) return;

    if (filteredStudents.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-slate-400 flex flex-col items-center">
                <i class="fa-regular fa-folder-open text-2xl mb-2 opacity-50"></i>
                <p class="text-xs italic">Nenhum aluno confirmado nesta aula.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = filteredStudents.map(student => {
        const degreeText = student.degree && student.degree !== 'Nenhum' ? ` • ${student.degree}` : '';
        const beltStyle = getBeltStyle(student.belt);
        const checkInTime = student.checkInTime ? new Date(student.checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

        return `
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-400 text-lg">
                        ${student.name.charAt(0)}
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-800 tracking-tight">${student.name}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${beltStyle.bg} ${beltStyle.text} border ${beltStyle.border}">
                                ${student.belt}${degreeText}
                            </span>
                            <span class="text-[9px] uppercase font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-lg">
                                Presença às ${checkInTime}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="w-10 h-10 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center text-lg">
                    <i class="fa-solid fa-check"></i>
                </div>
            </div>
        `;
    }).join('');
}

function getBeltStyle(belt) {
    const styles = {
        'Branca': { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200' },
        'Cinza': { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500' },
        'Amarela': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
        'Laranja': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
        'Verde': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
        'Azul': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
        'Roxa': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
        'Marrom': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
        'Preta': { bg: 'bg-slate-900', text: 'text-white', border: 'border-black' },
        'Coral': { bg: 'bg-[repeating-linear-gradient(90deg,#F00_0,#F00_10px,#FFF_10px,#FFF_20px)]', text: 'text-black', border: 'border-red-600' },
        'Vermelha': { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' }
    };
    return styles[belt] || styles['Branca'];
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
        const degreeText = student.degree && student.degree !== 'Nenhum' ? ` • ${student.degree}` : '';
        const beltStyle = getBeltStyle(student.belt);
        const statusClass = student.paymentStatus === 'Paga' ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50';
        const statusText = student.paymentStatus === 'Paga' ? 'Em Dia' : 'Atrasada';

        return `
            <div class="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col gap-4 hover:shadow-lg transition-all group overflow-hidden relative">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400 text-xl transition-all group-hover:bg-white group-hover:scale-110">
                        ${student.name.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-base font-black text-slate-800 tracking-tight truncate">${student.name}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${beltStyle.bg} ${beltStyle.text} border ${beltStyle.border}">
                                ${student.belt}${degreeText}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div class="flex flex-col">
                        <span class="text-[9px] font-black uppercase text-slate-400">Financeiro</span>
                        <span class="text-[10px] font-bold ${statusClass} px-2 py-0.5 rounded-lg mt-1 inline-block w-fit">
                            ${statusText}
                        </span>
                    </div>
                    <button onclick="openAttendanceModal('${student._id}', '${student.name.replace(/'/g, "\\'")}')" class="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all">
                        <i class="fa-solid fa-user-check"></i>
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
        const response = await fetch(`${window.API_BASE_URL}/classes/franchise/${franchiseId}?view=week`);
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

            col.innerHTML += `
                <div class="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition group relative ${isMyClass ? 'ring-2 ring-orange-200' : ''}">
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-${categoryColor}-50 text-${categoryColor}-600 border border-${categoryColor}-100">
                            ${cls.category || 'Geral'}
                        </span>
                        ${isMyClass ? '<span class="text-[8px] font-bold uppercase text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">Minha</span>' : ''}
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
