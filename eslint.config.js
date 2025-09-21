import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import vueeslint from 'eslint-plugin-vue'
import vueparser from 'vue-eslint-parser'

export default [
  js.configs.recommended,
  ...vueeslint.configs['flat/recommended'],
  {
    files: ['**/*.{js,jsx,ts,tsx,vue}'],
    languageOptions: {
      parser: vueparser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 2021,
        sourceType: 'module'
      },
      globals: {
        console: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      vue: vueeslint
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'vue/no-unused-vars': 'warn'
    }
  },
  {
    ignores: ['dist/', 'node_modules/', 'postcss.config.cjs']
  }
]