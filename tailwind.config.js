/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface2) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primary2: 'rgb(var(--color-primary2) / <alpha-value>)',
        onprimary: 'rgb(var(--color-on-primary) / <alpha-value>)',
        needs: 'rgb(var(--color-needs) / <alpha-value>)',
        wants: 'rgb(var(--color-wants) / <alpha-value>)',
        savings: 'rgb(var(--color-savings) / <alpha-value>)',
        income: 'rgb(var(--color-income) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        num: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        app: '480px',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.05), 0 8px 20px -10px rgb(0 0 0 / 0.14)',
        softer: '0 1px 2px rgb(0 0 0 / 0.04), 0 3px 10px -6px rgb(0 0 0 / 0.08)',
        glow: '0 0 0 1px rgb(var(--color-primary) / 0.35)',
        glass: '0 1px 1px rgb(255 255 255 / 0.06) inset, 0 10px 34px -14px rgb(0 0 0 / 0.4)',
      },
      borderRadius: {
        '2.5xl': '0.875rem',
        '3xl': '1.125rem',
      },
      keyframes: {
        'pop-in': { '0%': { opacity: 0, transform: 'scale(0.92) translateY(6px)' }, '100%': { opacity: 1, transform: 'scale(1) translateY(0)' } },
        'slide-up': { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'pop-in': 'pop-in 0.28s cubic-bezier(0.2,0.8,0.2,1) both',
        'slide-up': 'slide-up 0.32s cubic-bezier(0.2,0.8,0.2,1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
