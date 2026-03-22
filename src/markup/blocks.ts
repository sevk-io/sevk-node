/**
 * Sevk Block System
 *
 * Blocks are reusable templates built from existing sevk components.
 * Template syntax uses {%...%} to avoid conflict with {{...}} variable system.
 *
 * Template syntax:
 *   {%variable%}                          - inject config value
 *   {%variable ?? fallback%}             - inject with fallback
 *   {%#each array as alias%}...{%/each%} - iterate arrays
 *   {%alias.key%}                        - access current item in loop
 *   {%#if key%}...{%/if%}               - conditional (truthy check)
 *   {%#if key%}...{%else%}...{%/if%}    - conditional with else
 *   {%#if a && b%}                       - logical AND
 *   {%#if a || b%}                       - logical OR
 *   {%#if key == "value"%}               - string equality
 *   {%#if key != "value"%}               - string inequality
 *
 * Variable syntax {{...}} is preserved untouched for send-time replacement.
 */

function isTruthy(val: unknown): boolean {
  if (val === undefined || val === null || val === '' || val === false || val === 0) return false
  if (Array.isArray(val) && val.length === 0) return false
  return true
}

function evaluateCondition(expr: string, config: Record<string, unknown>): boolean {
  const trimmed = expr.trim()

  // OR: split on ||, return true if any part is true
  if (trimmed.includes('||')) {
    return trimmed.split('||').some(part => evaluateCondition(part, config))
  }

  // AND: split on &&, return true if all parts are true
  if (trimmed.includes('&&')) {
    return trimmed.split('&&').every(part => evaluateCondition(part, config))
  }

  // Equality: key == "value"
  const eqMatch = trimmed.match(/^(\w+)\s*==\s*"([^"]*)"$/)
  if (eqMatch) {
    return String(config[eqMatch[1]] ?? '') === eqMatch[2]
  }

  // Inequality: key != "value"
  const neqMatch = trimmed.match(/^(\w+)\s*!=\s*"([^"]*)"$/)
  if (neqMatch) {
    return String(config[neqMatch[1]] ?? '') !== neqMatch[2]
  }

  // Simple truthy check
  return isTruthy(config[trimmed])
}

export function renderTemplate(template: string, config: Record<string, unknown>): string {
  let result = template

  // 1. Process {%#if condition%}...{%else%}...{%/if%} conditionals
  // Process innermost first (body must not contain another {%#if)
  let prev = ''
  while (prev !== result) {
    prev = result
    result = result.replace(
      /\{%#if\s+([^%]+)%\}((?:(?!\{%#if\s)[\s\S])*?)\{%\/if%\}/,
      (_, condition, body) => {
        const condResult = evaluateCondition(condition, config)
        const elseIdx = body.indexOf('{%else%}')
        const trueBranch = elseIdx >= 0 ? body.slice(0, elseIdx) : body
        const falseBranch = elseIdx >= 0 ? body.slice(elseIdx + 8) : ''
        return condResult ? trueBranch : falseBranch
      }
    )
  }

  // 2. Process {%#each key as alias%}...{%/each%} loops (alias is optional, defaults to "this")
  result = result.replace(
    /\{%#each\s+(\w+)(?:\s+as\s+(\w+))?%\}([\s\S]*?)\{%\/each%\}/g,
    (_, key, alias, body) => {
      const arr = config[key]
      if (!Array.isArray(arr) || arr.length === 0) return ''
      const itemName = alias || 'this'
      return arr.map(item => {
        let itemResult = body
        // Replace {%alias.prop%} with item values
        const itemRe = new RegExp(`\\{%${itemName}\\.(\\w+)%\\}`, 'g')
        itemResult = itemResult.replace(
          itemRe,
          (__: string, prop: string) => String((item as Record<string, unknown>)[prop] ?? '')
        )
        // Replace {%variable%} with config values (parent scope)
        itemResult = itemResult.replace(
          /\{%(\w+)%\}/g,
          (__: string, k: string) => String(config[k] ?? '')
        )
        return itemResult
      }).join('')
    }
  )

  // 3. Process {%variable ?? fallback%} with fallback
  result = result.replace(
    /\{%(\w+)\s*\?\?\s*([^%]+)%\}/g,
    (_, key, fallback) => {
      const val = config[key]
      if (val !== undefined && val !== null && val !== '') return String(val)
      return fallback.trim()
    }
  )

  // 4. Process {%variable%} simple injection
  result = result.replace(
    /\{%(\w+)%\}/g,
    (_, key) => String(config[key] ?? '')
  )

  return result
}

/**
 * Process a <block> tag.
 * Reads template and config from attributes, renders template with config.
 * Returns sevk markup that the existing renderer will process.
 */
export function processBlockTag(attrs: Record<string, string>, inner?: string): string {
  const template = inner?.trim() || attrs['template']
  if (!template) return ''

  const configStr = (attrs['config'] || '{}').replace(/'/g, '"').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  let config: Record<string, unknown>
  try {
    config = JSON.parse(configStr)
  } catch {
    config = {}
  }

  return renderTemplate(template, config)
}
