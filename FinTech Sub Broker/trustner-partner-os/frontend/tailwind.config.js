/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f2f7',
          100: '#e1e5ee',
          200: '#c3cbdd',
          300: '#a5b1cc',
          400: '#5c6fa3',
          500: '#1a237e',
          600: '#172068',
          700: '#141a52',
          800: '#0f1135',
          900: '#0a0c23',
        },
        teal: {
          50: '#e0f2f1',
          100: '#b2dfdb',
          200: '#80cbc4',
          300: '#4db6ac',
          400: '#26a69a',
          500: '#00897b',
          600: '#00796b',
          700: '#00695c',
          800: '#004d40',
          900: '#003d33',
        },
        gold: {
          50: '#fffbf0',
          100: '#fef5e0',
          200: '#fce8c1',
          300: '#fada9f',
          400: '#f8c26c',
          500: '#f9a825',
          600: '#d6881b',
          700: '#b36914',
          800: '#8f500f',
          900: '#6b390a',
        },
      },
      backgroundColor: {
        light: '#f5f7fa',
      },
    },
  },
  plugins: [],
}
