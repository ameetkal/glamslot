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
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffadad',
          400: '#ff9393',
          500: '#ff7979',
          600: '#ff5f5f',
          700: '#ff4545',
          800: '#ff2b2b',
          900: '#ff1111',
        },
      },
    },
  },
  plugins: [],
}

export default config 