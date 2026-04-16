/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0f',
          900: '#111118',
          800: '#1a1a24',
          700: '#24242f',
          600: '#33333f',
          500: '#4a4a55',
          400: '#7a7a82',
          300: '#a8a8b0',
          200: '#d0d0d5',
          100: '#eaeaee',
        },
        accent: {
          DEFAULT: '#c9a96a',
          hover: '#dbbe85',
          muted: '#8a7048',
        },
        panel: 'rgba(26, 26, 36, 0.72)',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
