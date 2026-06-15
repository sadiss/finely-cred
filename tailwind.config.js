/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '2rem',
        xl: '2.5rem',
      },
      screens: {
        '2xl': '1600px',
      },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
        },
        fc: {
          shell: 'var(--fc-bg)',
          deep: 'var(--fc-bg-deep)',
          section: 'var(--fc-bg-section)',
          'section-alt': 'var(--fc-bg-section-alt)',
          chrome: 'var(--fc-bg-chrome)',
          elevated: 'var(--fc-bg-elevated)',
          input: 'var(--fc-bg-input)',
          ink: 'var(--fc-ink-on-gold)',
        },
        surface: {
          1: 'rgba(255,255,255,0.03)',
          2: 'rgba(0,0,0,0.30)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 0 40px rgba(var(--brand-primary-rgb), 0.18)',
        'glow-strong': '0 0 60px rgba(var(--brand-primary-rgb), 0.28)',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

