export const MAX_MARKUP_DEPTH = 64
export const MAX_TAG_ITERATIONS = 200
export const MAX_RENDER_OUTPUT = 5_000_000
export const MAX_TAG_SCAN_WORK = 30_000_000
export const MAX_CODEBLOCK_SIZE = 2_500
export const MAX_TOTAL_CODEBLOCK_BYTES = 2_500

const MARKUP_TAG_NAMES = new Set([
  "block",
  "section",
  "column",
  "row",
  "container",
  "heading",
  "paragraph",
  "text",
  "button",
  "link",
  "sevk-link",
  "list",
  "li",
  "codeblock"
])

export interface RenderBudget {
  scanWork: number
  codeblockBytes: number
}

export const chargeScanWork = (budget: RenderBudget, work: number): void => {
  budget.scanWork += work
  if (budget.scanWork > MAX_TAG_SCAN_WORK) {
    throw new Error("Email markup is too complex to render")
  }
}

const isTagNameCode = (code: number): boolean =>
  (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 45

export const assertMarkupDepth = (content: string): void => {
  const depths = new Map<string, number>()
  let index = 0

  while (index < content.length) {
    const open = content.indexOf("<", index)
    if (open === -1) {
      break
    }
    const close = content.indexOf(">", open + 1)
    if (close === -1) {
      break
    }
    index = close + 1

    let position = open + 1
    const closing = content.charCodeAt(position) === 47
    if (closing) {
      position++
    }
    let nameEnd = position
    while (nameEnd < close && isTagNameCode(content.charCodeAt(nameEnd))) {
      nameEnd++
    }
    const name = content.substring(position, nameEnd).toLowerCase()
    if (!MARKUP_TAG_NAMES.has(name)) {
      continue
    }

    if (closing) {
      const current = depths.get(name) ?? 0
      if (current > 0) {
        depths.set(name, current - 1)
      }
    } else if (content.charCodeAt(close - 1) !== 47) {
      const next = (depths.get(name) ?? 0) + 1
      if (next > MAX_MARKUP_DEPTH) {
        throw new Error(`Email markup nesting exceeds the maximum depth of ${MAX_MARKUP_DEPTH}`)
      }
      depths.set(name, next)
    }
  }
}
