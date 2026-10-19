const MAX_EACH_ITEMS = 1000
const MAX_EACH_OUTPUT = 2_000_000
const MAX_TEMPLATE_WORK = 20_000_000
const MAX_IF_ITERATIONS = 2000

const isTruthy = (val: unknown): boolean => {
  if (
    val === undefined ||
    val === null ||
    val === "" ||
    val === false ||
    val === 0
  )
    return false
  if (Array.isArray(val) && val.length === 0) {
    return false
  }
  return true
}

const evaluateCondition = (
  expr: string,
  config: Record<string, unknown>
): boolean => {
  const trimmed = expr.trim()

  if (trimmed.includes("||")) {
    return trimmed.split("||").some((part) => evaluateCondition(part, config))
  }

  if (trimmed.includes("&&")) {
    return trimmed.split("&&").every((part) => evaluateCondition(part, config))
  }

  const eqMatch = trimmed.match(/^(\w+)\s*==\s*"([^"]*)"$/)
  if (eqMatch) {
    return String(config[eqMatch[1]] ?? "") === eqMatch[2]
  }

  const neqMatch = trimmed.match(/^(\w+)\s*!=\s*"([^"]*)"$/)
  if (neqMatch) {
    return String(config[neqMatch[1]] ?? "") !== neqMatch[2]
  }

  return isTruthy(config[trimmed])
}

const tooComplex = (): Error => new Error("Email markup is too complex to render")
const outputExceeded = (): Error => new Error("Email block exceeds the maximum template output size")

export const renderTemplate = (
  template: string,
  config: Record<string, unknown>
): string => {
  let result = template
  let rendered = 0

  let prev = ""
  let ifIterations = 0
  let ifWork = 0
  while (prev !== result && ifIterations++ < MAX_IF_ITERATIONS) {
    ifWork += result.length
    if (ifWork > MAX_TEMPLATE_WORK) {
      throw tooComplex()
    }

    prev = result
    result = result.replace(
      /\{%#if\s+([^%]+)%\}((?:(?!\{%#if\s)[\s\S])*?)\{%\/if%\}/,
      (_, condition, body) => {
        const condResult = evaluateCondition(condition, config)
        const elseIdx = body.indexOf("{%else%}")
        const trueBranch = elseIdx >= 0 ? body.slice(0, elseIdx) : body
        const falseBranch = elseIdx >= 0 ? body.slice(elseIdx + 8) : ""
        return condResult ? trueBranch : falseBranch
      }
    )
  }

  if (result.includes("{%/each%}")) {
    const openRe = /\{%#each\s+(\w+)(?:\s+as\s+(\w+))?%\}/g
    let out = ""
    let from = 0
    let eachWork = 0

    while (from <= result.length) {
      openRe.lastIndex = from
      const om = openRe.exec(result)
      if (!om) {
        out += result.substring(from)
        break
      }

      const bodyStart = openRe.lastIndex
      const closeIdx = result.indexOf("{%/each%}", bodyStart)
      if (closeIdx === -1) {
        out += result.substring(from)
        break
      }

      out += result.substring(from, om.index)
      const arr = config[om[1]]

      if (Array.isArray(arr) && arr.length > 0) {
        if (arr.length > MAX_EACH_ITEMS) {
          throw new Error(`Email block exceeds the maximum of ${MAX_EACH_ITEMS} loop items`)
        }

        const itemName = om[2] || "this"
        const itemRe = new RegExp(`\\{%${itemName}\\.(\\w+)%\\}`, "g")
        const body = result.substring(bodyStart, closeIdx)
        const parts: string[] = []

        for (const item of arr) {
          eachWork += body.length + 16
          if (eachWork > MAX_TEMPLATE_WORK) {
            throw tooComplex()
          }

          let itemOut = 0
          const chargeItem = (value: string): string => {
            if (rendered + itemOut + value.length > MAX_EACH_OUTPUT) {
              throw outputExceeded()
            }
            itemOut += value.length
            return value
          }
          const itemResult = body
            .replace(itemRe, (__: string, prop: string) =>
              chargeItem(String((item as Record<string, unknown>)[prop] ?? ""))
            )
            .replace(/\{%(\w+)%\}/g, (__: string, key: string) =>
              chargeItem(String(config[key] ?? ""))
            )

          parts.push(itemResult)
          rendered += itemResult.length
          if (rendered > MAX_EACH_OUTPUT) {
            throw outputExceeded()
          }
        }

        out += parts.join("")
      }

      from = closeIdx + 9
    }

    result = out
  }

  const charge = (value: string): string => {
    if (rendered + value.length > MAX_EACH_OUTPUT) {
      throw outputExceeded()
    }
    rendered += value.length
    return value
  }

  result = result.replace(
    /\{%(\w+)\s*\?\?([^%]+)%\}/g,
    (_, key, fallback) => {
      const val = config[key]
      if (val !== undefined && val !== null && val !== "") {
        return charge(String(val))
      }
      return charge(fallback.trim())
    }
  )

  result = result.replace(/\{%(\w+)%\}/g, (_, key) => charge(String(config[key] ?? "")))

  return result
}

export const processBlockTag = (
  attrs: Record<string, string>,
  inner?: string
): string => {
  const template = inner?.trim() || attrs["template"]
  if (!template) {
    return ""
  }

  const configStr = (attrs["config"] || "{}").replace(
    /&(?:amp|quot|apos|lt|gt|#39|#x27|#34|#x22);/gi,
    entity => {
      switch (entity.toLowerCase()) {
        case "&amp;": return "&"
        case "&quot;":
        case "&#34;":
        case "&#x22;": return '"'
        case "&apos;":
        case "&#39;":
        case "&#x27;": return "'"
        case "&lt;": return "<"
        case "&gt;": return ">"
        default: return entity
      }
    }
  )
  let config: Record<string, unknown>
  try {
    config = JSON.parse(configStr)
  } catch {
    try {
      config = JSON.parse(configStr.replace(/'/g, '"'))
    } catch {
      config = {}
    }
  }

  return renderTemplate(template, config)
}
