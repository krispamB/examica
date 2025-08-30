export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#dbeafe',
      100: '#bfdbfe',
      200: '#93c5fd',
      300: '#60a5fa',
      400: '#3b82f6',
      500: '#2563eb', // Main primary
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#1e3a8a',
    },

    // Secondary colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b', // Main secondary
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },

    // Status colors
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#059669', // Main success
      600: '#047857',
    },

    warning: {
      50: '#fefbf2',
      100: '#fef3c7',
      500: '#d97706', // Main warning
      600: '#b45309',
    },

    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#dc2626', // Main error
      600: '#b91c1c',
    },

    info: {
      50: '#f0fdfa',
      100: '#cffafe',
      500: '#0891b2', // Main info
      600: '#0e7490',
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  radius: {
    none: '0',
    sm: '0.25rem',
    default: '0.5rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

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

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },

  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export type Theme = typeof theme

// Helper function to get theme values
export function getThemeValue(path: string): string {
  return (
    (path.split('.').reduce((obj: unknown, key: string) => {
      if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key]
      }
      return undefined
    }, theme as unknown) as string) || path
  )
}
