module.exports = {
  // TypeScript e TSX files
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
    () => 'tsc --noEmit --strict',
  ],

  // JavaScript files
  '**/*.{js,jsx}': ['eslint --fix --max-warnings 0', 'prettier --write'],

  // JSON, CSS, MD files
  '**/*.{json,css,scss,md,yaml,yml}': ['prettier --write'],

  // Package.json específico
  'package.json': ['prettier --write'],
}
