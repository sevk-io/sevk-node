import Prism from 'prismjs'
import { extractStyleAttributes, styleToString } from '../utils/style-utils'
import { themes } from '../utils/themes'

// Load common languages
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-markdown'

/**
 * Get styles for a token based on theme
 */
function getTokenStyles(token: Prism.Token, theme: Record<string, Record<string, string>>): Record<string, string> {
  const styles = theme[token.type] ? { ...theme[token.type] } : {}

  const aliases = Array.isArray(token.alias) ? token.alias : token.alias ? [token.alias] : []
  for (const alias of aliases) {
    if (theme[alias]) {
      Object.assign(styles, theme[alias])
    }
  }

  return styles
}

/**
 * Render a token to HTML string
 */
function renderToken(
  token: string | Prism.Token,
  theme: Record<string, Record<string, string>>,
  inheritedStyles: Record<string, string> = {}
): string {
  if (typeof token === 'string') {
    const text = token.replace(/ /g, '\xA0\u200D\u200B')
    const styleStr = styleToString(inheritedStyles)
    return styleStr ? `<span style="${styleStr}">${text}</span>` : text
  }

  if (token instanceof Prism.Token) {
    const tokenStyles = { ...inheritedStyles, ...getTokenStyles(token, theme) }
    const styleStr = styleToString(tokenStyles)

    if (typeof token.content === 'string') {
      const text = token.content.replace(/ /g, '\xA0\u200D\u200B')
      return `<span style="${styleStr}">${text}</span>`
    }

    if (token.content instanceof Prism.Token) {
      return `<span style="${styleStr}">${renderToken(token.content, theme, tokenStyles)}</span>`
    }

    if (Array.isArray(token.content)) {
      const renderedContent = token.content.map((t: string | Prism.Token) => renderToken(t, theme, tokenStyles)).join('')
      return `<span style="${styleStr}">${renderedContent}</span>`
    }
  }

  return ''
}

/**
 * Process sevk-codeblock element
 * Creates a pre/code element with Prism.js syntax highlighting
 */
export function processCodeBlock(element: Element): string | null {
  const code = element.textContent
  const language = element.getAttribute('language') || 'javascript'
  const themeName = element.getAttribute('theme') || 'oneDark'
  const lineNumbers = element.getAttribute('line-numbers') === 'true'
  const fontFamily = element.getAttribute('font-family')
  const customStyle = extractStyleAttributes(element)

  if (!code) return null

  // Get theme
  const theme = themes[themeName] || themes.oneDark

  // Get language grammar
  const languageGrammar = Prism.languages[language]
  if (!languageGrammar) {
    // Fallback to plain text if language not found
    const baseStyle = { ...theme.base, width: '100%', ...customStyle }
    const styleStr = styleToString(baseStyle)
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre style="${styleStr}"><code>${escapedCode}</code></pre>`
  }

  // Tokenize code
  const lines = code.split(/\r\n|\r|\n/gm)
  const linesHTML: string[] = []

  // Inherited styles for all tokens (fontFamily)
  const inheritedStyles: Record<string, string> = {}
  if (fontFamily) {
    inheritedStyles.fontFamily = fontFamily
  }

  lines.forEach((line, lineIndex) => {
    const tokens = Prism.tokenize(line, languageGrammar)

    const lineNumberHTML = lineNumbers
      ? `<span style="width:2em;display:inline-block">${lineIndex + 1}</span>`
      : ''

    // Tokens for this line
    const tokensHTML = tokens.map((token: string | Prism.Token) => renderToken(token, theme, inheritedStyles)).join('')

    // Wrap each line in a <p> tag like React Email
    linesHTML.push(`<p style="margin:0;min-height:1em">${lineNumberHTML}${tokensHTML}</p>`)
  })

  // Combine base styles with custom styles
  const baseStyle = {
    ...theme.base,
    width: '100%',
    boxSizing: 'border-box',
    ...customStyle
  }
  const styleStr = styleToString(baseStyle)

  return `<pre style="${styleStr}"><code>${linesHTML.join('')}</code></pre>`
}
