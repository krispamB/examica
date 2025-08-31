import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        // Examica Brand Colors
        primary: {
          DEFAULT: 'rgb(37, 99, 235)', // #2563eb
          hover: 'rgb(29, 78, 216)', // #1d4ed8
          light: 'rgb(219, 234, 254)', // #dbeafe
          50: 'rgb(239, 246, 255)',
          100: 'rgb(219, 234, 254)',
          500: 'rgb(37, 99, 235)',
          600: 'rgb(29, 78, 216)',
          700: 'rgb(29, 78, 216)',
        },
        secondary: {
          DEFAULT: 'rgb(100, 116, 139)', // #64748b
          hover: 'rgb(71, 85, 105)', // #475569
        },
        success: {
          DEFAULT: 'rgb(5, 150, 105)', // #059669
          light: 'rgb(209, 250, 229)', // #d1fae5
        },
        warning: {
          DEFAULT: 'rgb(217, 119, 6)', // #d97706
          light: 'rgb(254, 243, 199)', // #fef3c7
        },
        error: {
          DEFAULT: 'rgb(220, 38, 38)', // #dc2626
          light: 'rgb(254, 226, 226)', // #fee2e2
        },
        info: {
          DEFAULT: 'rgb(8, 145, 178)', // #0891b2
          light: 'rgb(207, 250, 254)', // #cffafe
        },
        // Semantic colors using CSS variables
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
        'border-light': 'var(--border-light)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem', // --radius-sm
        DEFAULT: '0.5rem', // --radius
        lg: '0.75rem', // --radius-lg
        xl: '1rem', // --radius-xl
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT:
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
