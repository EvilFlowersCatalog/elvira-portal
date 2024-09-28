/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,js,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        flyRight: {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        flyLeft: {
          '0%': {
            transform: 'translateX(-100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
      },
      animation: {
        'fly-right': 'flyRight 0.5s ease-out forwards',
        'fly-left': 'flyLeft 0.5s ease-out forwards',
      },
      screens: {
        sm: '321px',
        md: '599px',
        lg: '959px',
        xl: '1240px',
        xxl: '1440px',
      },
      colors: {
        primary: {
          fiit: '#01a9e0',
          mtf: '#e62b1e',
          svf: '#e5722a',
          sjf: '#4c5b60',
          fei: '#0c4a8e',
          fchpt: '#ffda1c',
          fad: '#009d4a',
        },
        red: '#ff2129',
        green: '#77dd77',
        darkGray: '#1f1f1f',
        strongDarkGray: '#141414',
        gray: '#2e2e2e',
      },
      flex: {
        2: '2 2 0%',
        3: '3 3 0%',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
