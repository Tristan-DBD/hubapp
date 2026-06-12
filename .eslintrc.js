module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['import'],
  rules: {
    quotes: ['error', 'single'],
    semi: ['error', 'never'],

    // Type safety
    '@typescript-eslint/no-explicit-any': 'warn',

    // Cleanliness
    curly: ['error', 'all'],
    'no-console': 'warn',
    'react-native/no-unused-styles': 'error',

    // Consistency
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          { pattern: 'react', group: 'builtin', position: 'before' },
          { pattern: '@react-navigation/**', group: 'external', position: 'before' },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'never',
        alphabetize: { order: 'asc' },
      },
    ],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: {
          order: 'alphabetically',
        },
      },
    ],
  },
}
