// Student Login Logic

document.addEventListener('DOMContentLoaded', async () => {
    await loadFranchises();
    setupLoginForm();
});

async function loadFranchises() {
    try {
        const response = await FranchiseAPI.getAll();
        const franchises = response.data;

        const select = document.getElementById('franchise-select');
        select.innerHTML = '<option value="">Selecione sua academia...</option>';

        franchises.forEach(f => {
            const option = document.createElement('option');
            option.value = f._id || f.id;
            option.textContent = f.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading franchises:', error);
        showError('Erro ao carregar academias. Verifique sua conexão.');
    }
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    const btn = document.getElementById('login-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const franchiseId = document.getElementById('franchise-select').value;
        const email = document.getElementById('email-input').value.trim();
        const phone = document.getElementById('phone-input').value.trim();

        // Validation
        if (!franchiseId) {
            showError('Por favor, selecione sua academia');
            return;
        }

        if (!email && !phone) {
            showError('Informe seu email ou telefone');
            return;
        }

        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Entrando...';
        hideError();

        try {
            const response = await fetch(`${appConfig.apiBaseUrl}/auth/student/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ franchiseId, email, phone })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Erro ao fazer login');
            }

            // Store student data in localStorage
            localStorage.setItem('studentData', JSON.stringify(result.data));

            // Redirect to dashboard
            window.location.href = 'aluno.html';

        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Erro ao fazer login. Verifique seus dados.');

            // Reset button
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span>Acessar Minha Área</span>';
        }
    });
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.classList.add('hidden');
}
