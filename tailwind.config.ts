import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tan: {
          50: '#faf6f1',
          100: '#f5ede3',
          200: '#ead9c7',
          300: '#dfc5ab',
          400: '#d4b18f',
          500: '#c99d73',
          600: '#be8957',
          700: '#b3753b',
          800: '#a8611f',
          900: '#9d4d03',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      // Better default form styles
      backgroundColor: {
        'form-input': '#ffffff',
      },
      textColor: {
        'form-label': '#374151', // gray-700
        'form-input': '#111827', // gray-900
        'form-placeholder': '#6b7280', // gray-500
      },
      borderColor: {
        'form-input': '#d1d5db', // gray-300
        'form-input-focus': '#3b82f6', // blue-500
      },
    },
  },
  plugins: [
    // Add custom form input styles
    function({ addComponents, theme }: any) {
      addComponents({
        '.form-input': {
          backgroundColor: theme('backgroundColor.form-input'),
          color: theme('textColor.form-input'),
          borderColor: theme('borderColor.form-input'),
          '&::placeholder': {
            color: theme('textColor.form-placeholder'),
          },
          '&:focus': {
            borderColor: theme('borderColor.form-input-focus'),
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.blue.100')}`,
          },
        },
        '.form-label': {
          color: theme('textColor.form-label'),
          fontWeight: '500',
        },
        '.btn-primary': {
          backgroundColor: theme('colors.accent.600'),
          color: '#ffffff',
          '&:hover': {
            backgroundColor: theme('colors.accent.700'),
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
      })
    },
  ],
}

export default config 