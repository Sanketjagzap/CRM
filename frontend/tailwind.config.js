/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07111f',
        surface: 'rgba(10, 19, 35, 0.72)',
        panel: 'rgba(12, 24, 43, 0.78)',
        line: 'rgba(148, 163, 184, 0.18)',
        text: '#e5eefb',
        muted: '#8ea2bf',
        accent: {
          50: '#ecf8ff',
          100: '#d8f0ff',
          200: '#b3e3ff',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      boxShadow: {
        glass: '0 20px 80px rgba(2, 8, 23, 0.45)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at top left, rgba(14,165,233,0.28), transparent 28%), radial-gradient(circle at top right, rgba(168,85,247,0.18), transparent 24%), linear-gradient(135deg, rgba(8,15,30,0.98), rgba(11,18,34,0.92))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};