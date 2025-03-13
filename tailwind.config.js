/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#42a5f5',
          DEFAULT: '#1976d2',
          dark: '#0d47a1',
        },
        secondary: {
          light: '#ff7961',
          DEFAULT: '#f44336',
          dark: '#ba000d',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} 