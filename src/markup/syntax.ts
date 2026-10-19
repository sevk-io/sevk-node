import { MAX_CODEBLOCK_SIZE, MAX_TOTAL_CODEBLOCK_BYTES, type RenderBudget } from "./limits"
import { Prism } from "./prism"
import { extractStyleAttributes, styleToString } from "./utils/style-utils"
import { themes, type Theme } from "./utils/themes"

import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-java"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-csharp"
import "prismjs/components/prism-php"
import "prismjs/components/prism-ruby"
import "prismjs/components/prism-go"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-markdown"

const LANGUAGE_ALIASES: Record<string, string> = { jsx: "javascript", tsx: "typescript" }

const getTokenStyles = (
  token: Prism.Token,
  theme: Theme
): Record<string, string> => {
  const styles = theme[token.type] ? { ...theme[token.type] } : {}
  const aliases = Array.isArray(token.alias)
    ? token.alias
    : token.alias
      ? [token.alias]
      : []

  for (const alias of aliases) {
    if (theme[alias]) {
      Object.assign(styles, theme[alias])
    }
  }

  return styles
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const renderPrismToken = (
  token: string | Prism.Token,
  theme: Theme,
  inherited: Record<string, string> = {}
): string => {
  if (typeof token === "string") {
    const text = escapeHtml(token).replace(/ /g, "\u00a0\u200d\u200b")
    const style = styleToString(inherited)
    return style ? `<span style="${style}">${text}</span>` : text
  }

  if (!(token instanceof Prism.Token)) {
    return ""
  }

  const merged = { ...inherited, ...getTokenStyles(token, theme) }
  const style = styleToString(merged)

  if (typeof token.content === "string") {
    const content = escapeHtml(token.content).replace(
      / /g,
      "\u00a0\u200d\u200b"
    )
    return `<span style="${style}">${content}</span>`
  }
  if (token.content instanceof Prism.Token) {
    return `<span style="${style}">${renderPrismToken(token.content, theme, merged)}</span>`
  }
  if (Array.isArray(token.content)) {
    const content = token.content
      .map((part) => renderPrismToken(part, theme, merged))
      .join("")
    return `<span style="${style}">${content}</span>`
  }

  return ""
}

const camelToKebab = (value: string): string =>
  value.replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^ms-/, "-ms-")

const themeStyleToString = (style: Record<string, string>): string =>
  Object.entries(style)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${camelToKebab(key)}:${value}`)
    .join(";")

export const processCodeBlock = (
  attrs: Record<string, string>,
  code: string,
  budget: RenderBudget
): string => {
  const requested = (attrs["language"] || "javascript").toLowerCase()
  const language = LANGUAGE_ALIASES[requested] ?? requested
  const themeName = attrs["theme"] || "oneDark"
  const lineNumbers = attrs["line-numbers"] === "true"
  const fontFamily = attrs["font-family"]
  const customStyle = extractStyleAttributes(attrs)

  if (!code) {
    return "<pre><code></code></pre>"
  }

  const theme = themes[themeName] || themes.oneDark
  const grammar = Prism.languages[language]

  if (
    !grammar ||
    code.length > MAX_CODEBLOCK_SIZE ||
    budget.codeblockBytes + code.length > MAX_TOTAL_CODEBLOCK_BYTES
  ) {
    const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const baseStyle = { ...theme.base, width: "100%", ...customStyle }
    return `<pre style="${themeStyleToString(baseStyle)}"><code>${escaped}</code></pre>`
  }

  budget.codeblockBytes += code.length

  const inheritedStyles: Record<string, string> = {}
  if (fontFamily) {
    inheritedStyles["font-family"] = fontFamily
  }

  const tokens = Prism.tokenize(code, grammar)
  const fullHtml = tokens
    .map((token) => renderPrismToken(token, theme, inheritedStyles))
    .join("")
  const linesHtml = fullHtml.split("\n").map((line, index) => {
    const lineNumber = lineNumbers
      ? `<span style="width:2em;display:inline-block">${index + 1}</span>`
      : ""
    return `<p style="margin:0;min-height:1em">${lineNumber}${line || ""}</p>`
  })

  const baseStyle = {
    ...theme.base,
    width: "100%",
    "box-sizing": "border-box",
    ...customStyle
  }

  return `<pre style="${themeStyleToString(baseStyle)}"><code>${linesHtml.join("")}</code></pre>`
}
