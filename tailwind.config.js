/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,js,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        sm: '321px',
        md: '599px',
        lg: '959px',
        xl: '1240px',
        xxl: '1440px',
      },
      colors: {
        STUColor: '#00abe1',
        white: '#ffffff',
        black: '#000000',
        red: '#ff2129',
        green: '#77dd77',
        darkGray: '#1f1f1f',
        strongDarkGray: '#141414',
        gray: '#2e2e2e',
      },
      flex: {
        2: '2 2 0%',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
