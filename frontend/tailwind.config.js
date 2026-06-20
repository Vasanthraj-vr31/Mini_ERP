/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: { 900: '#3A131A', 800: '#501B24', 700: '#6B2A35' },
        rose: { 300: '#D9B3BA', 200: '#EAD5D8', 100: '#F3E5E8' },
        paper: { 50: '#F7F4F0', 0: '#FCFAF8' },
        ink: { 900: '#1E1114', 600: '#5C4B50', 400: '#94838A' },
        line: '#E7DED9',
        success: { DEFAULT: '#5B7355', bg: '#E7EDE3' },
        warning: { DEFAULT: '#B07B3E', bg: '#F4E9D8' },
        info: { DEFAULT: '#4A6275', bg: '#E2E9EF' },
        neutral: { DEFAULT: '#8A7A72', bg: '#EFE9E4' },
        danger: { DEFAULT: '#9B3B3B', bg: '#F1E0DD' },
      },
      fontFamily: {
        display: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { lg: '16px', xl: '20px', '2xl': '24px' },
      boxShadow: {
        card: '0 1px 2px rgba(30,17,20,0.04), 0 8px 24px rgba(30,17,20,0.06)',
        'card-hover': '0 2px 4px rgba(30,17,20,0.06), 0 16px 40px rgba(30,17,20,0.10)',
      },
    },
  },
  plugins: [],
}
