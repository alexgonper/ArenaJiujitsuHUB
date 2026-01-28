
window.applyUnitBranding = (franchise) => {
    const styleId = 'unit-branding-style';
    let styleEl = document.getElementById(styleId);

    if (!franchise || !franchise.branding) {
        if (styleEl) styleEl.remove();
        return;
    }

    const { primaryColor, secondaryColor } = franchise.branding;
    if (!primaryColor) {
        if (styleEl) styleEl.remove();
        return;
    }

    const pColor = primaryColor;
    const sColor = secondaryColor || primaryColor;

    // Helper to generate CSS
    const css = `
        /* Scope: Unit Detail Content */
        #section-unit-detail .text-orange-500,
        #section-unit-detail .text-orange-600,
        #section-unit-detail .text-orange-700 {
            color: ${pColor} !important;
        }
        
        #section-unit-detail .bg-orange-500,
        #section-unit-detail .bg-orange-600 {
            background-color: ${pColor} !important;
        }

        #section-unit-detail .bg-orange-50,
        #section-unit-detail .bg-orange-100 {
            background-color: ${pColor}1A !important; /* 10% opacity */
        }
        
        #section-unit-detail .border-orange-100,
        #section-unit-detail .border-orange-200 {
            border-color: ${pColor}33 !important; /* 20% opacity */
        }
        
        #section-unit-detail .border-orange-500 {
            border-color: ${pColor} !important;
        }

        #section-unit-detail .orange-gradient {
            background: linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%) !important;
        }
        
        #section-unit-detail .focus\\:ring-orange-500:focus {
            --tw-ring-color: ${pColor} !important;
        }

        /* Hover states in detail view */
        #section-unit-detail .hover\\:text-orange-600:hover {
            color: ${pColor} !important;
        }
        
        #section-unit-detail .hover\\:bg-orange-50:hover {
            background-color: ${pColor}1A !important;
        }
        
        #section-unit-detail .hover\\:border-orange-500:hover {
            border-color: ${pColor} !important;
        }

        /* Scope: Submenu Sidebar Items */
        #network-submenu .text-orange-600 {
            color: ${pColor} !important;
        }
        
        #network-submenu .bg-orange-50 {
            background-color: ${pColor}1A !important;
        }

        #network-submenu .hover\\:text-orange-500:hover {
            color: ${pColor} !important;
        }

        #network-submenu .hover\\:bg-orange-50:hover {
            background-color: ${pColor}1A !important;
        }
        
        /* Specific overrides for buttons if needed */
        #section-unit-detail button.orange-gradient {
             background: linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%) !important;
        }
    `;

    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }

    styleEl.textContent = css;
};
