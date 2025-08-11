/**
 * Regra ESLint customizada para detectar padrões de risco com JSON duplo
 * Previne JSON.stringify(JSON.stringify()) e JSON.parse(JSON.parse())
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Previne uso de JSON.stringify ou JSON.parse aninhados que podem causar múltiplos escapes',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    /**
     * Verifica se uma expressão é uma chamada para JSON.stringify ou JSON.parse
     */
    function isJsonMethod(node, methodName) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object.name === 'JSON' &&
        node.callee.property.name === methodName
      )
    }

    /**
     * Verifica se há aninhamento de métodos JSON
     */
    function checkForNestedJsonCalls(node, methodName) {
      if (!isJsonMethod(node, methodName)) {
        return
      }

      // Verificar argumentos para chamadas aninhadas
      node.arguments.forEach(arg => {
        if (isJsonMethod(arg, methodName)) {
          context.report({
            node,
            message: `Evite ${methodName} aninhado: ${methodName}(${methodName}()) pode causar múltiplos escapes. Use utilitários centralizados.`,
          })
        }

        // Verificar se o argumento é uma expressão que pode conter JSON aninhado
        if (arg.type === 'CallExpression' && isJsonMethod(arg, methodName)) {
          context.report({
            node,
            message: `Detectado ${methodName} aninhado. Isso pode causar problemas de escape. Use normalizeStringArray() ou normalizeJsonObject().`,
          })
        }
      })
    }

    /**
     * Verifica padrões de risco em strings literais
     */
    function checkStringLiterals(node) {
      if (node.type === 'Literal' && typeof node.value === 'string') {
        const value = node.value

        // Detectar strings com múltiplos escapes
        if (/\\\\+["'\[\]{}]/g.test(value)) {
          context.report({
            node,
            message:
              'String contém múltiplos escapes que podem indicar dados corrompidos. Verifique a origem dos dados.',
          })
        }

        // Detectar strings que parecem JSON escapado
        if (
          /^"?\[.*\]"?$/.test(value.trim()) ||
          /^"?\{.*\}"?$/.test(value.trim())
        ) {
          if (value.includes('\\"') || value.includes('\\\\')) {
            context.report({
              node,
              message:
                'String parece ser JSON escapado. Use arrays/objetos diretamente em vez de strings JSON.',
            })
          }
        }
      }
    }

    /**
     * Verifica uso de replace para limpar escapes
     */
    function checkReplacePatterns(node) {
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'replace'
      ) {
        node.arguments.forEach(arg => {
          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            // Detectar padrões de limpeza de escape manual
            if (arg.value.includes('\\\\') || arg.value.includes('\\"')) {
              context.report({
                node,
                message:
                  'Limpeza manual de escapes detectada. Use normalizeStringArray() ou normalizeLanguages() para tratamento consistente.',
              })
            }
          }
        })
      }
    }

    return {
      CallExpression(node) {
        checkForNestedJsonCalls(node, 'stringify')
        checkForNestedJsonCalls(node, 'parse')
        checkReplacePatterns(node)
      },

      Literal(node) {
        checkStringLiterals(node)
      },

      // Verificar template literals também
      TemplateLiteral(node) {
        node.quasis.forEach(quasi => {
          if (quasi.value && quasi.value.raw) {
            if (/\\\\+["'\[\]{}]/g.test(quasi.value.raw)) {
              context.report({
                node: quasi,
                message:
                  'Template literal contém múltiplos escapes. Verifique se os dados não estão corrompidos.',
              })
            }
          }
        })
      },
    }
  },
}
