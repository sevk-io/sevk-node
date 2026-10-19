import { processBlockTag } from "./blocks"
import { assertMarkupDepth, type RenderBudget } from "./limits"
import { processTag, parseAttributes } from "./parser"
import {
  processButton,
  processDivider,
  processHeading,
  processImage,
  processLink,
  processList,
  processListItem,
  processParagraph,
  processText
} from "./processors/content"
import {
  processColumn,
  processContainer,
  processRow,
  processSection
} from "./processors/layout"
import { processCodeBlock } from "./syntax"

export interface ProcessedMarkup {
  html: string
  gapStyles: string
}

export const processMarkup = (content: string): ProcessedMarkup => {
  assertMarkupDepth(content)
  let result = content
  const gapStyles: string[] = []
  const rowCounter = { value: 0 }
  const budget: RenderBudget = { scanWork: 0, codeblockBytes: 0 }

  result = processTag(result, "block", (attrs, inner) =>
    processBlockTag(attrs, inner), budget
  )
  result = result.replace(/<block([^>]*)\/>/gi, (_, attrsStr: string) =>
    processBlockTag(parseAttributes(attrsStr))
  )
  assertMarkupDepth(result)

  result = result.replace(/<link(\s+(?:[\w-]+=(?:"[^"]*"|'[^']*')\s+)*)href=/gi, "<sevk-link$1href=")
  result = result.replace(/<\/link>/gi, "</sevk-link>")

  result = processTag(result, "section", processSection, budget)
  result = processTag(result, "column", processColumn, budget)
  result = processTag(result, "row", (attrs, inner) =>
    processRow(attrs, inner, rowCounter, gapStyles), budget
  )
  result = processTag(result, "container", processContainer, budget)

  result = processTag(result, "heading", processHeading, budget)
  result = processTag(result, "paragraph", processParagraph, budget)
  result = processTag(result, "text", processText, budget)
  result = processTag(result, "button", processButton, budget)

  result = result.replace(/<image([^>]*)\/?>/gi, (_, attrs: string) =>
    processImage(attrs)
  )
  result = result.replace(/<\/image>/gi, "")
  result = result.replace(/<divider([^>]*)\/?>/gi, (_, attrs: string) =>
    processDivider(attrs)
  )
  result = result.replace(/<\/divider>/gi, "")

  result = processTag(result, "sevk-link", processLink, budget)
  result = processTag(result, "list", processList, budget)
  result = processTag(result, "li", processListItem, budget)
  result = processTag(result, "codeblock", (attrs, inner) =>
    processCodeBlock(attrs, inner, budget), budget
  )

  result = result.replace(
    /<\/(?:container|section|row|column|heading|paragraph|text|button|sevk-link)>/gi,
    ""
  )

  for (const tag of ["sevk-email", "sevk-body", "email", "mail", "body"]) {
    result = result.replace(new RegExp(`<${tag}[^>]*>`, "gi"), "")
    result = result.replace(new RegExp(`</${tag}>`, "gi"), "")
  }

  return {
    html: result.trim(),
    gapStyles:
      gapStyles.length > 0
        ? `@media only screen and (max-width:479px){${gapStyles.join("")}}`
        : ""
  }
}
