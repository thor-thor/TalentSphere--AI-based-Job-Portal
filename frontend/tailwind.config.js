/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#07090E',
        'bg-panel': 'rgba(18, 22, 31, 0.6)',
        'primary': '#8a2be2',
        'primary-light': '#b05cff',
        'secondary': '#00e5ff',
        'accent': '#ff007f',
        'success': '#00ff88',
        'warning': '#ffb800',
        'error': '#ff3366',
        'text-main': '#f0f4f8',
        'text-muted': '#9ba3af',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
