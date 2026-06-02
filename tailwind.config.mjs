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
    },
  },
  plugins: [],
};

export default config;
