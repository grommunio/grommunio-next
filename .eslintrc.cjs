module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'indent': ['error', 2, { SwitchCase: 0 }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
  ignorePatterns: ['build', 'public', 'vendor', 'node_modules'],
};
