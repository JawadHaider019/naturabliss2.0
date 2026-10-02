/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#587a3b',
          dark: '#3b5327',
          hover: '#486530',
          light: '#6e964b',
        },
        olive: {
          50: '#F5F8F2',
          100: '#E8EFE2',
          200: '#D2DEC5',
          300: '#B2C79E',
          400: '#8FAe72',
          500: '#6E964B',
          600: '#587A3B',
          700: '#486530',
          800: '#3B5327',
          900: '#2F4220',
          950: '#17220E',
        }
      },
    },
  },
  plugins: [],
};
