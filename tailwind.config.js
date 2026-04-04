/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: '#0D2B1F',
        'navy-mid': '#1A4A30',
        'navy-light': '#2D6E4E',
        teal: '#00897B',
        'teal-light': '#4DB6AC',
        gold: '#E8A020',
        'gold-light': '#FFC84A',
        coral: '#E8572A',
        success: '#059669',
        danger: '#DC2626',
        muted: '#64748B',
        'muted-light': '#94A3B8',
        card: '#FFFFFF',
        surface: '#F4F3EF',
        border: '#E8E6E0',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
