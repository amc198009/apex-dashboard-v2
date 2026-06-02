/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        apex: {
          // brand + semantic accents (modern fintech palette)
          red: '#F2555A',
          'red-dim': 'rgba(242,85,90,0.12)',
          green: '#22C55E',
          'green-dim': 'rgba(34,197,94,0.12)',
          amber: '#F59E0B',
          'amber-dim': 'rgba(245,158,11,0.12)',
          blue: '#5B9DFF',
          // surfaces
          dark: '#0B0D12',
          surface: '#14161D',
          'surface-2': '#1B1E27',
          border: 'rgba(255,255,255,0.07)',
          muted: 'rgba(255,255,255,0.45)',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -18px rgba(0,0,0,0.85)',
        'card-hover': '0 1px 0 0 rgba(255,255,255,0.07) inset, 0 20px 44px -20px rgba(0,0,0,0.95)',
        glow: '0 0 0 1px rgba(242,85,90,0.30), 0 12px 36px -12px rgba(242,85,90,0.30)',
        'glow-green': '0 0 0 1px rgba(34,197,94,0.28), 0 12px 36px -12px rgba(34,197,94,0.28)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Consolas', 'monospace'],
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.35s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
