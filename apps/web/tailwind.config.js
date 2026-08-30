/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0F0F0F',
        surface: '#1A1A1A',
        'surface-2': '#242424',
        'surface-3': '#2F2F2F',
        border: '#2E2E2E',
        'border-light': '#3E3E3E',
        'text-main': '#F5F5F5',
        'text-muted': '#888888',
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          subtle: 'rgba(99, 102, 241, 0.15)',
        },
        // Synapse Node Types
        node: {
          problem: '#EF4444',
          solution: '#EAB308',
          decision: '#22C55E',
          feature: '#3B82F6',
          component: '#6B7280',
          risk: '#F97316',
          test: '#A855F7',
          benchmark: '#06B6D4',
          note: '#E5E7EB',
          lesson: '#F59E0B',
          link: '#64748B',
          deployment: '#1D4ED8',
          log: '#374151',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px -2px rgba(99, 102, 241, 0.25)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
