/**
 * Plugin ESLint customizado para regras específicas do projeto
 */

const noDoubleJson = require('./no-double-json')

module.exports = {
  rules: {
    'no-double-json': noDoubleJson
  }
}