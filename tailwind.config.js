/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#FF6B00',
          600: '#e66000',
          50: '#fff7ed',
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
}
