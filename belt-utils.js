
/**
 * Helper: Get Belt Colors
 */
window.getBeltStyle = function(belt) {
    if(!belt) belt = 'Branca';
    // Normalize
    const b = belt.split(' ')[0]; // Take first word if "Preta 1º Dan"
    
    const map = {
        'Branca':  { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' }, // Slate-50/500/200
        'Cinza':   { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' }, // Gray-100/600/300
        'Amarela': { bg: '#FEF9C3', text: '#A16207', border: '#FDE047' }, // Yellow-100/700/300
        'Laranja': { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' }, // Orange-100/700/300
        'Verde':   { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' }, // Green-100/700/300
        'Azul':    { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' }, // Blue-100/700/300
        'Roxa':    { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' }, // Purple-100/700/300
        'Marrom':  { bg: '#713F12', text: '#FFFFFF', border: '#713F12' }, // Custom Brown
        'Preta':   { bg: '#0F172A', text: '#FFFFFF', border: '#0F172A' }, // Slate-900
        'Coral':   { bg: '#EF4444', text: '#FFFFFF', border: '#991B1B' }, // Red-500/Red-800
        'Vermelha':{ bg: '#991B1B', text: '#FFFFFF', border: '#991B1B' }  // Red-800
    };

    return map[b] || map['Branca'];
};
