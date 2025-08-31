/**
 * Examica Design System - Brand Tokens
 * Centralized design tokens for consistent branding across the application
 */

export const designTokens = {
  // Brand Colors
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#2563eb',
      600: '#1d4ed8',
      700: '#1e40af',
      hover: '#1d4ed8',
      light: '#dbeafe',
    },
    secondary: {
      DEFAULT: '#64748b',
      hover: '#475569',
    },
    semantic: {
      success: '#059669',
      successLight: '#d1fae5',
      warning: '#d97706',
      warningLight: '#fef3c7',
      error: '#dc2626',
      errorLight: '#fee2e2',
      info: '#0891b2',
      infoLight: '#cffafe',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing Scale
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },

  // Border Radius
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    lg: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    xl: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  // Animation & Transitions
  animation: {
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Component Variants
  components: {
    button: {
      sizes: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
      variants: {
        primary: 'bg-primary hover:bg-primary-hover text-white',
        secondary: 'bg-secondary hover:bg-secondary-hover text-white',
        outline:
          'border-2 border-primary text-primary hover:bg-primary hover:text-white',
        ghost: 'text-primary hover:bg-primary-light',
      },
    },
    card: {
      base: 'bg-white border border-border rounded-lg shadow-sm',
      elevated:
        'bg-white border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow',
    },
  },
} as const

// Utility function to get design token values
export const getToken = (path: string): unknown => {
  return path
    .split('.')
    .reduce(
      (obj: Record<string, unknown>, key) =>
        obj?.[key] as Record<string, unknown>,
      designTokens as Record<string, unknown>
    )
}

// Brand guidelines
export const brandGuidelines = {
  logo: {
    minWidth: '120px',
    clearSpace: '16px', // Minimum clear space around logo
  },
  colors: {
    accessibility: {
      // WCAG AA compliant color combinations
      primaryOnWhite: '4.5:1', // Contrast ratio
      secondaryOnWhite: '4.5:1',
    },
  },
  typography: {
    headingScale: [
      { level: 'h1', size: '3xl', weight: 'bold' },
      { level: 'h2', size: '2xl', weight: 'semibold' },
      { level: 'h3', size: 'xl', weight: 'semibold' },
      { level: 'h4', size: 'lg', weight: 'medium' },
    ],
  },
}
