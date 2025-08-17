module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Suppress CSS-related warnings
    'no-unused-vars': 'warn',
    'no-console': 'warn'
  },
  overrides: [
    {
      files: ['*.css'],
      rules: {
        // Disable CSS-specific rules that conflict with Tailwind
        'at-rule-no-unknown': 'off',
        'property-no-vendor-prefix': 'off',
        'value-no-vendor-prefix': 'off'
      }
    }
  ]
};
