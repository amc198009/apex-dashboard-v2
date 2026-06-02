/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        apex: {
          red: '#E24B4A',
          'red-dim': 'rgba(226,75,74,0.12)',
          green: '#639922',
          'green-dim': 'rgba(99,153,34,0.12)',
          amber: '#BA7517',
          'amber-dim': 'rgba(186,117,23,0.12)',
          dark: '#0A0A0A',
          surface: '#111111',
          border: 'rgba(255,255,255,0.08)',
          muted: 'rgba(255,255,255,0.45)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        ticker: 'ticker 40s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
