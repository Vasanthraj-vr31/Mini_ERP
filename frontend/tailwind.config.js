/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core brand
        burgundy: { 950: '#240D12', 900: '#3A131A', 800: '#501B24', 700: '#6B2A35', 600: '#8B3A46', 500: '#A84F5C' },
        rose:     { 400: '#C9909A', 300: '#D9B3BA', 200: '#EAD5D8', 100: '#F3E5E8', 50: '#FBF4F5' },
        // Paper surfaces
        paper:    { 0: '#FCFAF8', 50: '#F7F4F0', 100: '#F0EAE4', 200: '#E4D9D0' },
        // Ink (text)
        ink:      { 900: '#1E1114', 700: '#3C2830', 600: '#5C4B50', 400: '#94838A', 300: '#B8ABAF', 200: '#D4CDD0' },
        // Semantic / ERP status colors
        line:     '#E7DED9',
        success:  { DEFAULT: '#5B7355', bg: '#E7EDE3', light: '#8FAB86' },
        warning:  { DEFAULT: '#B07B3E', bg: '#F4E9D8', light: '#D4A76A' },
        info:     { DEFAULT: '#4A6275', bg: '#E2E9EF', light: '#7A9AB0' },
        neutral:  { DEFAULT: '#8A7A72', bg: '#EFE9E4', light: '#B0A49F' },
        danger:   { DEFAULT: '#9B3B3B', bg: '#F1E0DD', light: '#C47070' },
        // Furniture accent palette
        teak:     { 900: '#2C1A0E', 800: '#4A2C14', 700: '#6B4019', 600: '#8C5622', 500: '#B06E2A', 400: '#C98B47' },
        amber:    { 900: '#1C1205', 800: '#332108', 700: '#4D3210', 600: '#6B4515', 500: '#8C5A1C', 400: '#B07830' },
        // Dark mode surfaces
        dark:     { 900: '#0E090A', 800: '#1A1012', 700: '#261618', 600: '#33201F', 500: '#42302F' },
      },
      fontFamily: {
        display: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px', DEFAULT: '12px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px', '3xl': '32px',
      },
      boxShadow: {
        'card':       '0 1px 2px rgba(30,17,20,0.04), 0 8px 24px rgba(30,17,20,0.06)',
        'card-hover': '0 2px 4px rgba(30,17,20,0.06), 0 16px 40px rgba(30,17,20,0.12)',
        'card-lg':    '0 4px 8px rgba(30,17,20,0.08), 0 24px 56px rgba(30,17,20,0.14)',
        'glow':       '0 0 0 3px rgba(80,27,36,0.15)',
        'glow-rose':  '0 0 0 3px rgba(217,179,186,0.4)',
        'inner':      'inset 0 2px 4px rgba(30,17,20,0.06)',
        'glass':      '0 8px 32px rgba(30,17,20,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      backdropBlur: { xs: '2px', sm: '4px', md: '8px', lg: '16px', xl: '24px' },
      animation: {
        'fade-in':         'fade-in 0.2s ease-out',
        'slide-up':        'slide-up 0.25s ease-out',
        'slide-in-right':  'slide-in-right 0.3s ease-out',
        'slide-in-left':   'slide-in-left 0.3s ease-out',
        'slide-down':      'slide-down 0.25s ease-out',
        'scale-in':        'scale-in 0.2s ease-out',
        'pulse-soft':      'pulse-soft 2s ease-in-out infinite',
        'shimmer':         'shimmer 1.5s infinite',
        'spin-slow':       'spin 3s linear infinite',
        'bounce-soft':     'bounce-soft 1s ease-in-out infinite',
        'notification-in': 'notification-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'float':           'float 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in':        { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up':       { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'slide-down':     { from: { transform: 'translateY(-12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-left':  { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'scale-in':       { from: { transform: 'scale(0.92)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'pulse-soft':     { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        'shimmer':        { from: { backgroundPosition: '-200px 0' }, to: { backgroundPosition: 'calc(200px + 100%) 0' } },
        'bounce-soft':    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
        'notification-in':{ from: { transform: 'scale(0.8) translateY(-8px)', opacity: '0' }, to: { transform: 'scale(1) translateY(0)', opacity: '1' } },
        'float':          { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      spacing: { '18': '4.5rem', '22': '5.5rem', '26': '6.5rem', '30': '7.5rem', '68': '17rem', '72': '18rem', '84': '21rem', '88': '22rem', '96': '24rem', '104': '26rem' },
      zIndex: { '60': '60', '70': '70', '80': '80', '90': '90', '100': '100' },
      transitionDuration: { '250': '250ms', '350': '350ms', '400': '400ms' },
    },
  },
  plugins: [],
}
