import { sxzz } from '@sxzz/eslint-config'

export default sxzz({
  ignores: ['playground'],
  rules: {
    'unicorn/filename-case': 'off',
    'import/no-default-export': 'off',
    'unused-imports/no-unused-vars': 'warn',
  },
})
