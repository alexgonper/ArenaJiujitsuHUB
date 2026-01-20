/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#FF6B00',
          600: '#e66000',
          50: '#fff7ed',
        },
        arena: {
          orange: '#FF6B00',
          dark: '#1e293b'
        }
      },
      borderRadius: {
        'card': '2rem',
        'input': '0.75rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Eurostile Bold Extended', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = tailwindConfig;
} else {
  tailwind.config = tailwindConfig;
}
