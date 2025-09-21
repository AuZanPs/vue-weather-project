/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chromepunk Color Palette
        'terminal-bg': '#011173',
        'terminal-red': '#dd0101',
        'terminal-white': '#ffffff',
        'terminal-blue': '#419bfb',
      },
      fontFamily: {
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s infinite',
        'typewriter': 'typewriter 2s steps(20) forwards',
        'glitch': 'glitch 0.2s ease-in-out',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        glitch: {
          '0%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-2px)' },
          '40%': { transform: 'translateX(2px)' },
          '60%': { transform: 'translateX(-2px)' },
          '80%': { transform: 'translateX(2px)' },
          '100%': { transform: 'translateX(0)' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      dropShadow: {
        'glow': '0 0 10px rgba(243, 112, 30, 0.5)',
      },
    },
  },
  plugins: [],
}