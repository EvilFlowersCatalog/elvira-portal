import { light } from '@mui/material/styles/createPalette';

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
        mdlg: '768px',
        lg: '959px',
        xl: '1240px',
        xxl: '1440px',
      },
      colors: {
        primary: '#0077CC',
        primaryLight: '#E6F3FF',
        secondary: '#15384E',
        secondaryLight: '#A8D0E6',
        lightGray: "#F5F7FA",
        darkGray: '#333333',
        identity: {
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
