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
        // Extend Tailwind's default colors instead of replacing them
        ...require('tailwindcss/defaultTheme').colors,
        // Dynamic colors based on faculty theme (CSS variables)
        primary: 'var(--color-primary)',
        primaryLight: 'var(--color-primary-light)',
        secondary: 'var(--color-secondary)',
        secondaryLight: 'var(--color-secondary-light)',
        lightGray: 'var(--color-light-gray)',
        darkGray: 'var(--color-dark-gray)',
        red: 'var(--color-red)',
        green: 'var(--color-green)',
        strongDarkGray: 'var(--color-strong-dark-gray)',
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
