tailwind.config = {
    theme: {
        extend: {
            colors: {
                brand: {
                    500: '#FF6B00',
                    600: '#e66000', // Darker shade for hover states
                    50: '#fff7ed', // Light background tint
                }
            },
            borderRadius: {
                'card': '2rem', // Standardized card radius
                'input': '0.75rem',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Eurostile Bold Extended', 'sans-serif'],
            }
        }
    }
}
