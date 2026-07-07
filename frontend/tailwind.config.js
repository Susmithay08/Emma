/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // RoboOps Console — orange on near-black. `mint`/`lime`/`deep` keep their
        // names (used app-wide) but now hold orange values = brand accent.
        em: {
          void: '#08090b',
          coal: '#0d0f12',
          panel: '#15171b',
          mint: '#ff9a5a', // light orange (accent text)
          lime: '#ff6a1a', // primary orange (buttons / glow)
          deep: '#e5551a', // deep orange
          orange: '#ff6a1a',
          amber: '#ffb020',
          grn: '#22c55e', // healthy / running status
          sky: '#7cc4ff',
          violet: '#b9a3ff',
          ink: '#eceef2',
          muted: '#8b909a',
        },
        ava: { orange: '#ff6a1a', amber: '#ffb020' },
        steel: {
          950: '#08090b',
          900: '#0d0f12',
          850: '#15171b',
          800: '#1b1e23',
          700: 'rgba(255,255,255,0.06)',
          600: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        display: ['Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Jost', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 12px 40px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 28px rgba(255,106,26,0.35)',
        glowOrange: '0 0 28px rgba(255,106,26,0.45)',
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        sheen: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        riseIn: 'riseIn 0.5s cubic-bezier(0.2,0.7,0.2,1) both',
        scan: 'scan 4s linear infinite',
      },
    },
  },
  plugins: [],
};
