/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B3A6B', dim: '#2E5299', pale: '#E8EEF8' },
        emerald: { DEFAULT: '#0A7C4E' },
        crimson: { DEFAULT: '#B91C1C' },
        amber: { DEFAULT: '#92400E' },
        violet: { DEFAULT: '#5B21B6' },
        ink: { DEFAULT: '#111827', 2: '#1F2937', 3: '#374151' },
        bg: { 0: '#FFFFFF', 1: '#FAFBFC', 2: '#F4F6F9', 3: '#EDF0F5' },
      },
    },
  },
  plugins: [],
}
