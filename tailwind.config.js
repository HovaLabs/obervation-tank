/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-deadfish': 'var(--bg-deadfish-primary)',

        // Surface colors
        'surface-primary': 'var(--surface-primary)',
        'surface-secondary': 'var(--surface-secondary)',
        'surface-tertiary': 'var(--surface-tertiary)',

        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-placeholder': 'var(--text-placeholder)',

        // Accent colors
        'accent-primary': 'var(--accent-primary)',
        'accent-hover': 'var(--accent-hover)',
        'accent-bg': 'var(--accent-bg)',
        'accent-bg-hover': 'var(--accent-bg-hover)',

        // Success colors
        'success': 'var(--success)',
        'success-bg': 'var(--success-bg)',
        'success-border': 'var(--success-border)',

        // Error colors
        'error': 'var(--error)',
        'error-light': 'var(--error-light)',
        'error-lighter': 'var(--error-lighter)',
        'error-bg': 'var(--error-bg)',
        'error-bg-hover': 'var(--error-bg-hover)',
        'error-border': 'var(--error-border)',

        // Border colors
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',

        // Misc
        'header-bg': 'var(--header-bg)',
        'pending-bg': 'var(--pending-bg)',
      },
      fontFamily: {
        sans: ['"Google Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        title: ['"Nurse Holiday"', 'cursive'],
      },
      animation: {
        'pulse-error': 'pulse-error 2s infinite',
      },
      keyframes: {
        'pulse-error': {
          '0%, 100%': { boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)' },
          '50%': { boxShadow: '0 4px 20px rgba(244, 67, 54, 0.7)' },
        },
      },
      screens: {
        'xs': '600px',
      },
    },
  },
  plugins: [],
}
