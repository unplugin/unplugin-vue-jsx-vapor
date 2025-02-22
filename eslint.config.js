import { sxzz } from '@sxzz/eslint-config'

export default sxzz([
  {
    rules: {
      'unicorn/filename-case': 'off',
      'import/no-default-export': 'off',
      'unused-imports/no-unused-vars': 'warn',
      'unicorn/no-new-array': 'off',
    },
  },
  {
    ignores: ['**/patched'],
  },
])
