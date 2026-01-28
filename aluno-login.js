// Student Login Logic

document.addEventListener('DOMContentLoaded', async () => {
    await loadFranchises();
    setupLoginForm();
});

async function loadFranchises() {
    try {
        console.log('Iniciando carregamento de franquias...');
        const response = await FranchiseAPI.getAll();
        console.log('Resposta API:', response);
        
        const franchises = response.data;

        if (!franchises || franchises.length === 0) {
            console.error('Nenhuma franquia retornada pela API');
            showError('Nenhuma academia disponível no momento.');
            return;
        }

        const select = document.getElementById('franchise-select');
        select.innerHTML = '<option value="">Selecione sua academia...</option>';

        franchises.forEach(f => {
            const option = document.createElement('option');
            option.value = f._id || f.id;
            option.textContent = f.name;
            select.appendChild(option);
        });
        
        console.log(`Carregadas ${franchises.length} franquias.`);

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
    
    // Belt Color Magic
    const emailInput = document.getElementById('email-input');
    const franchiseSelect = document.getElementById('franchise-select');
    let debounceTimer;

    emailInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const email = emailInput.value.trim();
        const franchiseId = franchiseSelect.value;

        if (email.length > 5 && email.includes('@')) {
            debounceTimer = setTimeout(async () => {
                try {
                    console.log(`Checking belt for email: ${email} in franchise: ${franchiseId}`);
                    const response = await fetch(`${appConfig.apiBaseUrl}/students/quick-check?email=${encodeURIComponent(email)}&franchiseId=${franchiseId}`);
                    const result = await response.json();
                    console.log('Belt check result:', result);

                    if (result.success && result.data.belt) {
                        console.log('Updating widget for belt:', result.data.belt);
                        updateWidgetForBelt(result.data.belt);
                    } else {
                        console.log('Belt check returned no success or no belt');
                        resetWidgetBranding();
                    }
                } catch (error) {
                    console.error('Belt check error:', error);
                }
            }, 500);
        } else if (email.length === 0) {
            resetWidgetBranding();
        }
    });

    franchiseSelect.addEventListener('change', () => {
        const email = emailInput.value.trim();
        if (email) {
            // Trigger check if franchise changes but email is already there
            emailInput.dispatchEvent(new Event('input'));
        }
    });
}

function updateWidgetForBelt(belt) {
    const style = window.getBeltStyle(belt);
    const loginCard = document.getElementById('login-card');
    
    if (loginCard) {
        console.log('Applying belt style to login card:', style);
        // Smooth transition
        loginCard.style.transition = 'all 0.5s ease-in-out';
        
        // Apply a subtle gradient background with the belt color
        loginCard.style.background = `linear-gradient(135deg, ${style.bg} 0%, white 50%, ${style.bg} 100%)`;
        loginCard.style.borderLeft = `6px solid ${style.border}`;
        loginCard.style.boxShadow = `0 20px 60px -10px ${style.border}40, 0 0 0 1px ${style.border}20`;
    }
}

function resetWidgetBranding() {
    const loginCard = document.getElementById('login-card');
    
    // Reset login card only
    if (loginCard) {
        loginCard.style.background = '';
        loginCard.style.borderLeft = '';
        loginCard.style.boxShadow = '';
    }
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

    const primaryColor = b.primaryColor || '#FF6B00';
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
