/** Configuración ESLint (flat config) para el backend de PracHub. */
const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Estilo: apunta a código limpio sin ser excesivamente estricto.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'smart'],
    },
  },
  {
    // Tests: relajar reglas que chocan con patrones de Jest (mocks, etc.)
    files: ['tests/**/*.test.js', 'tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'coverage/', 'src/migrations/'],
  },
];
