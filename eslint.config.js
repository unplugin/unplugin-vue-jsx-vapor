import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'style/object-property-newline': 'off',
    'style/jsx-max-props-per-line': 'off',
    'style/jsx-curly-newline': 'off',
    'style/jsx-self-closing-comp': 'error',
    'style/jsx-one-expression-per-line': [
      'error',
      {
        allow: 'literal',
      },
    ],
  },
})
