/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#12304A',
          light: '#1B476C',
          dark: '#0B1E2E',
          soft: '#E8EFF5',
        },
        yellow: {
          DEFAULT: '#F4B942',
          light: '#F8CE75',
          dark: '#DB9E24',
          soft: '#FEF8EC',
        },
        offwhite: {
          DEFAULT: '#F7F5EF',
          light: '#FCFBF8',
          dark: '#EBE8DF',
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 30px -5px rgba(18, 48, 74, 0.08)',
        'card': '0 4px 20px -2px rgba(18, 48, 74, 0.06)',
        'glow': '0 0 25px rgba(244, 185, 66, 0.35)',
      }
    },
  },
  plugins: [],
}
