/**
 * Arena Hub - Teacher Portal Logic
 * Manages states, API calls, and UI updates for the instructor dashboard.
 */

// State Management
let currentTeacher = null;
let dashboardData = null;
let students = [];
let filteredStudents = [];

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
            fetchDashboardData(),
            fetchStudents()
        ]);

        renderDashboard();
        renderAgenda();
        renderStudents();
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Erro ao carregar dados do servidor', 'error');
    }
}

function updateHeaderAndProfile() {
    document.getElementById('teacher-name-header').textContent = currentTeacher.name;
    document.getElementById('profile-name').textContent = currentTeacher.name;
    document.getElementById('profile-belt').textContent = `${currentTeacher.belt} ${currentTeacher.degree !== 'Nenhum' ? currentTeacher.degree : ''}`;
    document.getElementById('profile-franchise').textContent = currentTeacher.franchiseId?.name || 'Unidade Arena';
    document.getElementById('profile-email').textContent = currentTeacher.email;
    document.getElementById('profile-hire-date').textContent = new Date(currentTeacher.createdAt).toLocaleDateString('pt-BR');

    // Avatar initial
    document.getElementById('profile-avatar').textContent = currentTeacher.name.charAt(0);
}

async function fetchDashboardData() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/teachers/${currentTeacher._id}/dashboard`);
        const result = await response.json();

        if (result.success) {
            dashboardData = result.data;
        }
    } catch (error) {
        console.error('Fetch dashboard error:', error);
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
    document.getElementById('stat-total-students').textContent = dashboardData.stats.totalStudents || 0;
    document.getElementById('stat-attendance-today').textContent = dashboardData.stats.attendanceToday || 0;

    // Active Class
    const activeClass = getActiveClass(dashboardData.agenda);
    const activeClassCard = document.getElementById('active-class-card');

    if (activeClass) {
        document.getElementById('active-class-name').textContent = activeClass.name;
        document.getElementById('active-class-category').textContent = activeClass.category;
        document.getElementById('active-class-time').textContent = `${activeClass.startTime} - ${activeClass.endTime}`;
        activeClassCard.classList.add('border-brand-500/50');
    }

    // Recent Attendance
    const recentList = document.getElementById('recent-attendance-list');
    if (dashboardData.recentAttendance && dashboardData.recentAttendance.length > 0) {
        recentList.innerHTML = dashboardData.recentAttendance.map(att => `
            <div class="flex items-center justify-between p-3 bg-zinc-900/30 rounded-xl border border-white/5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                        ${att.studentId?.name ? att.studentId.name.charAt(0) : '?'}
                    </div>
                    <div>
                        <p class="text-xs font-bold">${att.studentId?.name || 'Aluno Desconhecido'}</p>
                        <p class="text-[9px] text-zinc-500 uppercase">${new Date(att.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <span class="text-[9px] font-bold text-green-500 uppercase">Presente</span>
            </div>
        `).join('');
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
    if (!dashboardData || !dashboardData.agenda || dashboardData.agenda.length === 0) {
        agendaList.innerHTML = '<p class="text-xs text-zinc-600 italic">Sem aulas programadas para hoje.</p>';
        return;
    }

    agendaList.innerHTML = dashboardData.agenda.map(cls => `
        <div class="card bg-zinc-900/40 border-zinc-800">
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[9px] font-black bg-brand-500 text-white px-1.5 py-0.5 rounded uppercase">${cls.category}</span>
                        <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">${cls.startTime} - ${cls.endTime}</span>
                    </div>
                    <h3 class="font-bold text-zinc-200">${cls.name}</h3>
                </div>
                <div class="text-right">
                    <p class="text-[9px] text-zinc-500 uppercase font-black">Capacidade</p>
                    <p class="text-xs font-bold text-zinc-300">${cls.capacity} Vagas</p>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStudents() {
    const list = document.getElementById('students-attendance-list');
    if (filteredStudents.length === 0) {
        list.innerHTML = '<p class="text-xs text-zinc-600 italic text-center py-10">Nenhum aluno encontrado.</p>';
        return;
    }

    list.innerHTML = filteredStudents.map(student => `
        <div class="student-row">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                    ${student.name.charAt(0)}
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-bold">${student.name}</p>
                        ${getBeltBadge(student.belt)}
                    </div>
                    <p class="text-[10px] uppercase font-bold ${student.paymentStatus === 'Paga' ? 'text-green-500' : 'text-orange-500'}">
                        ${student.paymentStatus}
                    </p>
                </div>
            </div>
            <button onclick="openAttendanceModal('${student._id}', '${student.name.replace(/'/g, "\\'")}')" 
                class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all">
                <i class="fa-solid fa-user-check"></i>
            </button>
        </div>
    `).join('');
}

function getBeltBadge(belt) {
    const colors = {
        'Branca': 'bg-white text-black',
        'Azul': 'bg-blue-600 text-white',
        'Roxa': 'bg-purple-600 text-white',
        'Marrom': 'bg-amber-900 text-white',
        'Preta': 'bg-black text-white border border-zinc-700',
        'Coral': 'bg-red-600 border-2 border-white text-white',
        'Vermelha': 'bg-red-700 text-white'
    };
    return `<span class="belt-badge ${colors[belt] || 'bg-zinc-700'}">${belt}</span>`;
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`nav-${tabName}`).classList.add('active');

    window.scrollTo(0, 0);
}

// Search Logic
document.getElementById('student-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    filteredStudents = students.filter(s => s.name.toLowerCase().includes(term));
    renderStudents();
});

// Attendance Logic
let selectedStudentForAttendance = null;

function openAttendanceModal(studentId, studentName) {
    selectedStudentForAttendance = studentId;
    document.getElementById('attendance-student-name').textContent = studentName;

    // Populate class select
    const select = document.getElementById('attendance-class-select');
    if (dashboardData && dashboardData.agenda) {
        select.innerHTML = dashboardData.agenda.map(cls => `
            <option value="${cls._id}">${cls.name} (${cls.startTime})</option>
        `).join('');
    }

    document.getElementById('attendance-modal').classList.remove('hidden');
}

function closeAttendanceModal() {
    document.getElementById('attendance-modal').classList.add('hidden');
    selectedStudentForAttendance = null;
}

document.getElementById('confirm-attendance-btn').addEventListener('click', async () => {
    const classId = document.getElementById('attendance-class-select').value;

    if (!selectedStudentForAttendance || !classId) return;

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
    }
});

// Logout
function logout() {
    localStorage.removeItem('arena_teacher');
    window.location.href = 'teacher-login.html';
}

// Toast util
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');
    const icon = toastIcon.querySelector('i');

    toastMsg.textContent = message;

    if (type === 'success') {
        toastIcon.className = 'w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white';
        icon.className = 'fa-solid fa-check';
    } else {
        toastIcon.className = 'w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white';
        icon.className = 'fa-solid fa-xmark';
    }

    toast.classList.remove('translate-y-[-100px]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-100px]', 'opacity-0');
    }, 3000);
}
