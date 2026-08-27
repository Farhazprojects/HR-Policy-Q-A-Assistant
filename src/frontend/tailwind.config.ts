import type { Config } from 'tailwindcss';

/** Tokens sampled directly from the approved Figma prototype. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: { DEFAULT: '#141A29', item: '#1F2436', hover: '#28304A', label: '#7C879E' },
        brand: {
          50: '#F1EEFC', 100: '#E4DEFA', 200: '#C9BDF5', 300: '#A797ED',
          DEFAULT: '#5440CC', dark: '#4232A6', light: '#6E5CD9', wash: '#EDE9FE',
        },
        ink: { DEFAULT: '#1A1F2E', muted: '#5B6478', subtle: '#8A93A6' },
        canvas: '#F5F7FA',
        line: '#E4E8EF',
        positive: { DEFAULT: '#1F8C59', wash: '#E8F5EE' },
        caution: { DEFAULT: '#B7791F', wash: '#FDF6E7' },
        danger: { DEFAULT: '#C2453C', wash: '#FCEDEC' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '12px' },
      boxShadow: {
        card: '0 1px 2px rgba(20, 26, 41, 0.04), 0 1px 3px rgba(20, 26, 41, 0.06)',
        lift: '0 4px 12px rgba(20, 26, 41, 0.08), 0 2px 4px rgba(20, 26, 41, 0.04)',
        modal: '0 20px 50px rgba(20, 26, 41, 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-dot': { '0%,60%,100%': { opacity: '0.25' }, '30%': { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 260ms cubic-bezier(0.16,1,0.3,1)',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
