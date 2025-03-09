import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import { standard } from './eslint.standard.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

const eslintConfig = [
  js.configs.recommended,
  {
    plugins: {
      import: importPlugin
    }
  },
  {
    ignores: [
      '.history/**'
    ]
  },
  ...compat.config({
    extends: [
      'prettier'
    ],
    rules: {
      ...standard.rules
    },
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    env: {
      node: true,
      es6: true
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.mjs']
        }
      }
    }
  })
]

export default eslintConfig
