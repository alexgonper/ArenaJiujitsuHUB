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

        // Apply branding when franchise is selected
        select.addEventListener('change', async (e) => {
            const franchiseId = e.target.value;
            if (franchiseId) {
                try {
                    const franchiseResponse = await FranchiseAPI.getById(franchiseId);
                    if (franchiseResponse.success) {
                        applyLoginBranding(franchiseResponse.data);
                    }
                } catch (error) {
                    console.error('Error loading franchise branding:', error);
                }
            }
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

// --- WHITE LABEL / BRANDING ---
function applyLoginBranding(franchise) {
    if (!franchise) return;
    const b = franchise.branding || {};

    const primaryColor = b.primaryColor || '#3B82F6';
    const brandName = b.brandName || franchise.name;

    // 1. CSS Styles
    const styleEl = document.getElementById('branding-styles');
    if (styleEl) {
        styleEl.innerHTML = `
            :root {
                --brand-primary: ${primaryColor};
            }
            .from-blue-500 { --tw-gradient-from: ${primaryColor} !important; }
            .to-blue-600 { --tw-gradient-to: ${primaryColor}dd !important; }
            .text-blue-500 { color: ${primaryColor} !important; }
            .bg-blue-500 { background-color: ${primaryColor} !important; }
            .focus\\:ring-blue-500:focus { --tw-ring-color: ${primaryColor} !important; }
        `;
    }

    // 2. Logo
    const logoImg = document.getElementById('login-logo-img');
    const logoIcon = document.getElementById('login-logo-icon');
    const logoContainer = document.getElementById('login-logo-container');

    if (b.logoUrl && logoImg) {
        logoImg.src = b.logoUrl;
        logoImg.classList.remove('hidden');
        if (logoIcon) logoIcon.classList.add('hidden');
        logoContainer.classList.remove('bg-gradient-to-br', 'from-blue-500', 'to-blue-600');
        logoContainer.classList.add('bg-white');
    }

    // 3. Title
    const titleEl = document.getElementById('login-title');
    if (titleEl && brandName) {
        titleEl.textContent = brandName;
    }

    // 4. Favicon
    if (b.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = b.faviconUrl;
    }

    // 5. Document Title
    document.title = `${brandName} | Portal do Aluno`;

    // 6. Login Background
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen && b.loginBackground) {
        if (b.loginBackground.startsWith('http') || b.loginBackground.startsWith('data:')) {
            loginScreen.style.backgroundImage = `url(${b.loginBackground})`;
            loginScreen.style.backgroundSize = 'cover';
            loginScreen.style.backgroundPosition = 'center';
        } else {
            loginScreen.style.backgroundColor = b.loginBackground;
            loginScreen.style.backgroundImage = 'none';
        }
    }
}
