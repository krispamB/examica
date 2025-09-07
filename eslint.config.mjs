import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error', 
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_' 
        }
      ],
      
      // React Hooks rules
      'react-hooks/exhaustive-deps': 'error',
      
      // Next.js specific rules  
      '@next/next/no-img-element': 'error',
      
      // General code quality
      'no-unused-vars': 'off', // Turn off base rule in favor of @typescript-eslint version
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Prettier integration (these should match .prettierrc)
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      'comma-dangle': ['error', 'only-multiline'],
    },
  },
]

export default eslintConfig
