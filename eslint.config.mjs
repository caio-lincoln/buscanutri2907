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

  // Configuração básica para TypeScript
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General rules
      'no-console': 'error',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'eol-last': 'error',

      // React specific
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-key': 'error',
      'react/no-unescaped-entities': 'error',

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Configuração específica para arquivos de configuração
  {
    files: [
      '**/*.config.{js,mjs,ts}',
      '**/next.config.mjs',
      '**/tailwind.config.ts',
      '**/eslint.config.mjs',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },

  // Configuração específica para páginas Next.js
  {
    files: [
      '**/app/**/page.{ts,tsx}',
      '**/app/**/layout.{ts,tsx}',
      '**/app/**/loading.{ts,tsx}',
      '**/app/**/error.{ts,tsx}',
      '**/app/**/not-found.{ts,tsx}',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },

  // Configuração específica para API routes
  {
    files: ['**/app/api/**/route.{ts,tsx}'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
]

export default eslintConfig