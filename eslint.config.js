import { sxzz } from '@sxzz/eslint-config'

export default sxzz()
  .removeRules(
    'unicorn/filename-case',
    'import/no-default-export',
    'unicorn/no-new-array',
  )
  .append([
    {
      name: 'warn',
      rules: {
        'unused-imports/no-unused-vars': 'warn',
      },
    },
  ])
