import {
  MAX_RENDER_OUTPUT,
  MAX_TAG_ITERATIONS,
  chargeScanWork,
  type RenderBudget
} from "./limits"

export const parseAttributes = (attrsStr: string): Record<string, string> => {
  const attrs: Record<string, string> = {}
  const pattern = /([\w-]+)=(?:"([^"]*)"|'([^']*)')/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(attrsStr)) !== null) {
    attrs[match[1]] = match[2] ?? match[3]
  }

  return attrs
}

export const processTag = (
  content: string,
  tagName: string,
  processor: (attrs: Record<string, string>, inner: string) => string,
  budget: RenderBudget = { scanWork: 0, codeblockBytes: 0 }
): string => {
  let result = content
  const openPattern = new RegExp(`<${tagName}([^>]*)>`, "gi")
  const closePattern = new RegExp(`</${tagName}>`, "gi")
  const nestedCheckPattern = new RegExp(`<${tagName}`, "gi")

  let iterations = 0
  while (iterations++ < MAX_TAG_ITERATIONS) {
    chargeScanWork(budget, result.length)

    const openings: Array<{
      index: number
      fullMatch: string
      attrs: string
    }> = []
    let match: RegExpExecArray | null

    openPattern.lastIndex = 0
    while ((match = openPattern.exec(result)) !== null) {
      openings.push({
        index: match.index,
        fullMatch: match[0],
        attrs: match[1] || ""
      })
    }
    if (openings.length === 0) {
      break
    }

    const replacements: Array<{ start: number, end: number, text: string }> = []
    for (const opening of openings) {
      if (
        replacements.length > 0 &&
        opening.index < replacements[replacements.length - 1].end
      ) {
        continue
      }

      const innerStart = opening.index + opening.fullMatch.length
      closePattern.lastIndex = innerStart
      const closeMatch = closePattern.exec(result)
      chargeScanWork(budget, (closeMatch ? closeMatch.index : result.length) - innerStart)
      if (!closeMatch) {
        continue
      }

      const inner = result.substring(innerStart, closeMatch.index)
      nestedCheckPattern.lastIndex = 0
      if (nestedCheckPattern.test(inner)) {
        continue
      }

      replacements.push({
        start: opening.index,
        end: closeMatch.index + closeMatch[0].length,
        text: processor(parseAttributes(opening.attrs), inner)
      })
    }

    if (replacements.length === 0) {
      break
    }

    let rebuilt = ""
    let cursor = 0
    for (const replacement of replacements) {
      rebuilt +=
        result.substring(cursor, replacement.start) + replacement.text
      cursor = replacement.end
      if (rebuilt.length > MAX_RENDER_OUTPUT) {
        throw new Error(`Email markup expands beyond the maximum size of ${MAX_RENDER_OUTPUT} bytes`)
      }
    }
    rebuilt += result.substring(cursor)
    if (rebuilt === result) {
      break
    }
    result = rebuilt
  }

  return result
}

export const normalizeMarkup = (content: string): string => {
  let result = content
  result = result.replace(/<link(\s+(?:[\w-]+=(?:"[^"]*"|'[^']*')\s+)*)href=/gi, "<sevk-link$1href=")
  result = result.replace(/<\/link>/gi, "</sevk-link>")

  if (
    !result.includes("<email") &&
    !result.includes("<mail") &&
    !result.includes("<sevk-email")
  ) {
    result = `<mail><body>${result}</body></mail>`
  }

  return result
}
