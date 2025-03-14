# Migration

## Migration from `vue-jsx`

1. Doesn't support hyphenated prop name and hyphenated component name.
2. `v-model` doesn't support Array Expression, use `v-model:$name$_trim={foo}` instead.
3. Doesn't support `v-models` directive.