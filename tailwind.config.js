/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EE5E53',
          50: '#FEF2F2',
          100: '#FEE2E1',
          200: '#FECAC8',
          300: '#FDA8A4',
          400: '#FB7871',
          500: '#EE5E53',
          600: '#DC3730',
          700: '#B92822',
          800: '#99241F',
          900: '#7F231F',
        },
        dark: {
          DEFAULT: '#1D1D1D',
          50: '#3A3A3A',
          100: '#2D2D2D',
          200: '#252525',
          300: '#1D1D1D',
          400: '#151515',
          500: '#0D0D0D',
          600: '#050505',
        }
      },
      fontFamily: {
        sans: ['Google Sans', 'Poppins', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

