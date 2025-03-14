import { sxzz } from '@sxzz/eslint-config'

export default sxzz()
  .removeRules(
    'unicorn/filename-case',
    'import/no-default-export',
    'unicorn/no-new-array',
  )
  .append([
    {
      name: 'docs',
      files: ['**/*.md/*.tsx'],
      rules: {
        'no-var': 'off',
        'no-mutable-exports': 'off',
        'no-duplicate-imports': 'off',
        'import/first': 'off',
        'unused-imports/no-unused-vars': 'off',
      },
    },
  ])
