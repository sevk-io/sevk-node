import Prism from 'prismjs'
import { processButton } from './processors/button'
import { processHeading } from './processors/heading'
import { processText } from './processors/text'
import { processParagraph } from './processors/paragraph'
import { processSection } from './processors/section'
import { processRow } from './processors/row'
import { processColumn } from './processors/column'
import { processContainer } from './processors/container'
import { processImage } from './processors/image'
import { processLink } from './processors/link'
import { processCodeBlock } from './processors/codeblock'
import { processDivider } from './processors/divider'
import { processList } from './processors/list'
import { processListItem } from './processors/list-item'
import { styleToString, extractStyleAttributes } from './utils/style-utils'
import { themes } from './utils/themes'

// Load common languages for Prism
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

export { styleToString }

/**
 * Head settings for email generation
 */
export interface EmailHeadSettings {
  title?: string
  previewText?: string
  styles?: string
  fonts?: Array<{
    id: string
    name: string
    url: string
  }>
}

/**
 * Parse result from email HTML
 */
export interface ParsedEmailContent {
  body: string
  headSettings: EmailHeadSettings
}

/**
 * Normalize markup by wrapping content if needed
 */
function normalizeMarkup(htmlContent: string): string {
  let content = htmlContent

  // Replace <link> with <sevk-link> to avoid parsing issues with void elements
  if (content.includes('<link')) {
    content = content.replace(/<link\s+href=/gi, '<sevk-link href=')
    content = content.replace(/<\/link>/gi, '</sevk-link>')
  }

  if (content.includes('<sevk-email') || content.includes('<email') || content.includes('<mail')) {
    return content
  }
  return `<mail><body>${content}</body></mail>`
}

/**
 * Generate font link tags for web fonts
 */
function generateFontLinks(fonts?: EmailHeadSettings['fonts']): string {
  if (!fonts || fonts.length === 0) return ''

  return fonts.map(font =>
    `<link href="${font.url}" rel="stylesheet" type="text/css" />`
  ).join('\n')
}

/**
 * Generate preview text (hidden preheader)
 */
function generatePreviewText(previewText?: string): string {
  if (!previewText) return ''

  // Hidden preview text that shows in email clients
  return `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>`
}

/**
 * Parse attributes from an attribute string
 */
function parseAttributes(attrsStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /([\w-]+)=["']([^"']*)["']/g
  let match
  while ((match = re.exec(attrsStr)) !== null) {
    attrs[match[1]] = match[2]
  }
  return attrs
}

/**
 * Process a tag with regex-based parsing (innermost-first approach like other SDKs)
 */
function processTag(
  content: string,
  tagName: string,
  processor: (attrs: Record<string, string>, inner: string) => string
): string {
  let result = content
  const openPattern = new RegExp(`<${tagName}([^>]*)>`, 'gi')
  const closeTag = `</${tagName}>`
  const openTagStart = `<${tagName}`

  const maxIterations = 10000
  let iterations = 0

  while (iterations < maxIterations) {
    iterations++

    // Find all opening tags
    const matches: Array<{ index: number; fullMatch: string; attrs: string }> = []
    let match
    openPattern.lastIndex = 0
    while ((match = openPattern.exec(result)) !== null) {
      matches.push({
        index: match.index,
        fullMatch: match[0],
        attrs: match[1] || ''
      })
    }

    if (matches.length === 0) break

    let processed = false

    // Find the innermost tag (one that has no nested same tags)
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i]
      const start = m.index
      const innerStart = start + m.fullMatch.length

      // Find the next close tag after this opening tag
      const closePos = result.toLowerCase().indexOf(closeTag.toLowerCase(), innerStart)
      if (closePos === -1) continue

      const inner = result.substring(innerStart, closePos)

      // Check if there's another opening tag inside
      if (inner.toLowerCase().includes(openTagStart.toLowerCase())) {
        // This tag has nested same tags, skip it
        continue
      }

      // This is an innermost tag, process it
      const attrs = parseAttributes(m.attrs)
      const replacement = processor(attrs, inner)
      const end = closePos + closeTag.length

      result = result.substring(0, start) + replacement + result.substring(end)
      processed = true
      break
    }

    if (!processed) break
  }

  return result
}

/**
 * Process markup content using regex-based parsing (no DOM required)
 * No recursive calls - processTag handles nested tags with innermost-first approach
 */
function processMarkup(content: string): string {
  let result = content

  // Process section tags
  result = processTag(result, 'section', (attrs, inner) => {
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleStr}">
<tbody>
<tr>
<td>${inner}</td>
</tr>
</tbody>
</table>`
  })

  // Process row tags
  result = processTag(result, 'row', (attrs, inner) => {
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleStr}">
<tbody style="width:100%">
<tr style="width:100%">${inner}</tr>
</tbody>
</table>`
  })

  // Process column tags
  result = processTag(result, 'column', (attrs, inner) => {
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    return `<td style="${styleStr}">${inner}</td>`
  })

  // Process container tags
  result = processTag(result, 'container', (attrs, inner) => {
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleStr}">
<tbody>
<tr style="width:100%">
<td>${inner}</td>
</tr>
</tbody>
</table>`
  })

  // Process heading tags
  result = processTag(result, 'heading', (attrs, inner) => {
    const level = attrs['level'] || '1'
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    return `<h${level} style="${styleStr}">${inner}</h${level}>`
  })

  // Process paragraph tags
  result = processTag(result, 'paragraph', (attrs, inner) => {
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    return `<p style="${styleStr}">${inner}</p>`
  })

  // Process text tags
  result = processTag(result, 'text', (attrs, inner) => {
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    return `<span style="${styleStr}">${inner}</span>`
  })

  // Process button tags with MSO compatibility
  result = processTag(result, 'button', (attrs, inner) => {
    return processButtonTag(attrs, inner)
  })

  // Process image tags (self-closing) - also remove any </image> closing tags
  result = result.replace(/<image([^>]*)\/?>/gi, (_, attrsStr) => {
    const attrs = parseAttributes(attrsStr)
    const src = attrs['src'] || ''
    const alt = attrs['alt'] || ''
    const width = attrs['width']
    const height = attrs['height']

    const style = extractStyleAttributes(attrs)
    if (!style['outline']) style['outline'] = 'none'
    if (!style['border']) style['border'] = 'none'
    if (!style['text-decoration']) style['text-decoration'] = 'none'

    const styleStr = styleToString(style)
    const widthAttr = width ? ` width="${width}"` : ''
    const heightAttr = height ? ` height="${height}"` : ''

    return `<img src="${src}" alt="${alt}"${widthAttr}${heightAttr} style="${styleStr}" />`
  })
  // Remove any stray </image> closing tags
  result = result.replace(/<\/image>/gi, '')

  // Process divider tags (self-closing)
  result = result.replace(/<divider([^>]*)\/?>/gi, (_, attrsStr) => {
    const attrs = parseAttributes(attrsStr)
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    const classAttr = attrs['class'] || attrs['className']
    const classStr = classAttr ? ` class="${classAttr}"` : ''
    return `<hr style="${styleStr}"${classStr} />`
  })

  // Process link tags
  result = processTag(result, 'sevk-link', (attrs, inner) => {
    const href = attrs['href'] || '#'
    const target = attrs['target'] || '_blank'
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    return `<a href="${href}" target="${target}" style="${styleStr}">${inner}</a>`
  })

  // Process list tags
  result = processTag(result, 'list', (attrs, inner) => {
    const listType = attrs['type']
    const tag = listType === 'ordered' ? 'ol' : 'ul'
    const style = extractStyleAttributes(attrs)
    if (attrs['list-style-type']) {
      style['list-style-type'] = attrs['list-style-type']
    }
    const styleStr = styleToString(style)
    const classAttr = attrs['class'] || attrs['className']
    const classStr = classAttr ? ` class="${classAttr}"` : ''
    return `<${tag} style="${styleStr}"${classStr}>${inner}</${tag}>`
  })

  // Process list item tags
  result = processTag(result, 'li', (attrs, inner) => {
    const style = extractStyleAttributes(attrs)
    const styleStr = styleToString(style)
    const classAttr = attrs['class'] || attrs['className']
    const classStr = classAttr ? ` class="${classAttr}"` : ''
    return `<li style="${styleStr}"${classStr}>${inner}</li>`
  })

  // Process codeblock tags with Prism syntax highlighting
  result = processTag(result, 'codeblock', (attrs, inner) => {
    return processCodeBlockTag(attrs, inner)
  })

  // Clean up wrapper tags
  const wrapperPatterns = [
    /<sevk-email[^>]*>/gi, /<\/sevk-email>/gi,
    /<sevk-body[^>]*>/gi, /<\/sevk-body>/gi,
    /<email[^>]*>/gi, /<\/email>/gi,
    /<mail[^>]*>/gi, /<\/mail>/gi,
    /<body[^>]*>/gi, /<\/body>/gi,
  ]
  for (const pattern of wrapperPatterns) {
    result = result.replace(pattern, '')
  }

  return result.trim()
}

/**
 * Process button with MSO compatibility
 */
function processButtonTag(attrs: Record<string, string>, inner: string): string {
  const href = attrs['href'] || '#'
  const style = extractStyleAttributes(attrs)

  // Parse padding
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = parsePadding(style)

  const y = paddingTop + paddingBottom
  const textRaise = pxToPt(y)

  const { fontWidth: plFontWidth, spaceCount: plSpaceCount } = computeFontWidthAndSpaceCount(paddingLeft)
  const { fontWidth: prFontWidth, spaceCount: prSpaceCount } = computeFontWidthAndSpaceCount(paddingRight)

  const buttonStyle: Record<string, string> = {
    'line-height': '100%',
    'text-decoration': 'none',
    'display': 'inline-block',
    'max-width': '100%',
    'mso-padding-alt': '0px',
    ...style,
    'padding-top': `${paddingTop}px`,
    'padding-right': `${paddingRight}px`,
    'padding-bottom': `${paddingBottom}px`,
    'padding-left': `${paddingLeft}px`,
  }

  const styleStr = styleToString(buttonStyle)

  const leftMsoSpaces = '&#8202;'.repeat(plSpaceCount)
  const rightMsoSpaces = '&#8202;'.repeat(prSpaceCount)

  return `<a href="${href}" target="_blank" style="${styleStr}"><!--[if mso]><i style="mso-font-width:${Math.round(plFontWidth * 100)}%;mso-text-raise:${textRaise}" hidden>${leftMsoSpaces}</i><![endif]--><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:${pxToPt(paddingBottom)}">${inner}</span><!--[if mso]><i style="mso-font-width:${Math.round(prFontWidth * 100)}%" hidden>${rightMsoSpaces}&#8203;</i><![endif]--></a>`
}

/**
 * Parse padding values from style
 */
function parsePadding(style: Record<string, string>): { paddingTop: number; paddingRight: number; paddingBottom: number; paddingLeft: number } {
  if (style['padding']) {
    const parts = style['padding'].split(/\s+/)
    switch (parts.length) {
      case 1: {
        const val = parsePx(parts[0])
        return { paddingTop: val, paddingRight: val, paddingBottom: val, paddingLeft: val }
      }
      case 2: {
        const vertical = parsePx(parts[0])
        const horizontal = parsePx(parts[1])
        return { paddingTop: vertical, paddingRight: horizontal, paddingBottom: vertical, paddingLeft: horizontal }
      }
      case 4:
        return {
          paddingTop: parsePx(parts[0]),
          paddingRight: parsePx(parts[1]),
          paddingBottom: parsePx(parts[2]),
          paddingLeft: parsePx(parts[3])
        }
    }
  }

  return {
    paddingTop: parsePx(style['padding-top'] || '0'),
    paddingRight: parsePx(style['padding-right'] || '0'),
    paddingBottom: parsePx(style['padding-bottom'] || '0'),
    paddingLeft: parsePx(style['padding-left'] || '0'),
  }
}

function parsePx(s: string): number {
  return parseInt(s.replace('px', ''), 10) || 0
}

function pxToPt(px: number): number {
  return Math.round((px * 3) / 4)
}

function computeFontWidthAndSpaceCount(expectedWidth: number): { fontWidth: number; spaceCount: number } {
  if (expectedWidth === 0) {
    return { fontWidth: 0, spaceCount: 0 }
  }

  let smallestSpaceCount = 0
  const maxFontWidth = 5.0

  while (true) {
    const requiredFontWidth = smallestSpaceCount > 0
      ? expectedWidth / smallestSpaceCount / 2.0
      : Infinity

    if (requiredFontWidth <= maxFontWidth) {
      return { fontWidth: requiredFontWidth, spaceCount: smallestSpaceCount }
    }
    smallestSpaceCount++
  }
}

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
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Convert theme style object to CSS string (handles camelCase)
 */
function themeStyleToString(style: Record<string, string>): string {
  return Object.entries(style)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${camelToKebab(key)}:${value}`)
    .join(';')
}

/**
 * Process codeblock tag with Prism syntax highlighting
 */
function processCodeBlockTag(attrs: Record<string, string>, code: string): string {
  const language = attrs['language'] || 'javascript'
  const themeName = attrs['theme'] || 'oneDark'
  const lineNumbers = attrs['line-numbers'] === 'true'
  const fontFamily = attrs['font-family']
  const customStyle = extractStyleAttributes(attrs)

  if (!code) {
    return '<pre><code></code></pre>'
  }

  // Get theme
  const theme = themes[themeName] || themes.oneDark

  // Get language grammar
  const languageGrammar = Prism.languages[language]
  if (!languageGrammar) {
    // Fallback to plain text if language not found
    const baseStyle = { ...theme.base, width: '100%', ...customStyle }
    const styleStr = themeStyleToString(baseStyle)
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre style="${styleStr}"><code>${escapedCode}</code></pre>`
  }

  // Tokenize code
  const lines = code.split(/\r\n|\r|\n/gm)
  const linesHTML: string[] = []

  // Inherited styles for all tokens (fontFamily)
  const inheritedStyles: Record<string, string> = {}
  if (fontFamily) {
    inheritedStyles['font-family'] = fontFamily
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
  const baseStyle: Record<string, string> = {
    ...theme.base,
    width: '100%',
    'box-sizing': 'border-box',
    ...customStyle
  }
  const styleStr = themeStyleToString(baseStyle)

  return `<pre style="${styleStr}"><code>${linesHTML.join('')}</code></pre>`
}

/**
 * Main email generator
 * Converts custom sevk markup to HTML string
 */
export function generateEmailFromMarkup(htmlContent: string, headSettings?: EmailHeadSettings): string {
  let contentToProcess = htmlContent

  // If headSettings is not provided, try to parse them from content
  if (!headSettings) {
    const parsed = parseEmailHTML(htmlContent)
    headSettings = parsed.headSettings
    // Use the extracted body content to ensure clean processing
    contentToProcess = parsed.body
  }

  const normalizedContent = normalizeMarkup(contentToProcess)
  const processed = processMarkup(normalizedContent)

  // Build head content
  const titleTag = headSettings?.title ? `<title>${headSettings.title}</title>` : ''
  const fontLinks = generateFontLinks(headSettings?.fonts)
  const customStyles = headSettings?.styles ? `<style type="text/css">${headSettings.styles}</style>` : ''
  const previewText = generatePreviewText(headSettings?.previewText)

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" dir="ltr">
<head>
<meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
${titleTag}
${fontLinks}
${customStyles}
</head>
<body style="margin:0;padding:0;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;background-color:#ffffff">
${previewText}
${processed}
</body>
</html>`
}

/**
 * Complete email HTML generator
 */
export async function generateEmailHTML(htmlContent: string, headSettings?: EmailHeadSettings): Promise<string> {
  return generateEmailFromMarkup(htmlContent, headSettings)
}

/**
 * Parse Sevk markup format and extract body content and head settings
 * Supports both Sevk markup format (<email><head>...</head><body>...</body></email>)
 * and HTML format (for backwards compatibility)
 */
export function parseEmailHTML(content: string): ParsedEmailContent {
  // Check if it's Sevk markup format
  if (content.includes('<email>') || content.includes('<email ') || content.includes('<mail>') || content.includes('<mail ')) {
    return parseSevkMarkup(content)
  }

  // Otherwise parse as HTML (backwards compatibility)
  return parseHTMLFormat(content)
}

/**
 * Parse Sevk markup format: <email><head>...</head><body>...</body></email>
 * Uses regex-based parsing to avoid DOM parser issues with <font> tag
 */
function parseSevkMarkup(markupContent: string): ParsedEmailContent {
  const headSettings: EmailHeadSettings = {
    title: '',
    previewText: '',
    styles: '',
    fonts: []
  }

  // Extract title using regex
  const titleMatch = markupContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch) {
    headSettings.title = titleMatch[1].trim()
  }

  // Extract preview using regex
  const previewMatch = markupContent.match(/<preview[^>]*>([\s\S]*?)<\/preview>/i)
  if (previewMatch) {
    headSettings.previewText = previewMatch[1].trim()
  }

  // Extract styles using regex
  const styleMatch = markupContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  if (styleMatch) {
    headSettings.styles = styleMatch[1].trim()
  }

  // Extract font information using regex
  const fontRegex = /<font[^>]*name=["']([^"']*)["'][^>]*url=["']([^"']*)["'][^>]*\/?>/gi
  const fontRegex2 = /<font[^>]*url=["']([^"']*)["'][^>]*name=["']([^"']*)["'][^>]*\/?>/gi
  let fontMatch
  const fonts: EmailHeadSettings['fonts'] = []

  while ((fontMatch = fontRegex.exec(markupContent)) !== null) {
    fonts.push({
      id: `font-${Date.now()}-${fonts.length}`,
      name: fontMatch[1],
      url: fontMatch[2]
    })
  }
  // Try alternate order (url before name)
  while ((fontMatch = fontRegex2.exec(markupContent)) !== null) {
    const url = fontMatch[1]
    if (!fonts.some(f => f.url === url)) {
      fonts.push({
        id: `font-${Date.now()}-${fonts.length}`,
        name: fontMatch[2],
        url: fontMatch[1]
      })
    }
  }
  headSettings.fonts = fonts

  // Extract body content using regex - NO DOM PARSING
  let bodyContent = ''
  const bodyMatch = markupContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    bodyContent = bodyMatch[1].trim()
  } else {
    // If no body tag, remove email, head, and meta tags
    bodyContent = markupContent
      .replace(/<email[^>]*>/gi, '')
      .replace(/<\/email>/gi, '')
      .replace(/<mail[^>]*>/gi, '')
      .replace(/<\/mail>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<preview[^>]*>[\s\S]*?<\/preview>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<font[^>]*>[\s\S]*?<\/font>/gi, '')
      .replace(/<font[^>]*\/?>/gi, '')
      .replace(/<\/font>/gi, '')
      .trim()
  }

  return {
    body: bodyContent,
    headSettings
  }
}

/**
 * Parse HTML format (backwards compatibility) - using regex instead of DOM
 */
function parseHTMLFormat(htmlContent: string): ParsedEmailContent {
  const headSettings: EmailHeadSettings = {
    title: '',
    previewText: '',
    styles: '',
    fonts: []
  }

  // Get title
  const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch) {
    headSettings.title = titleMatch[1].trim()
  }

  // Get custom styles
  const styleMatches = htmlContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)
  const styles: string[] = []
  for (const match of styleMatches) {
    styles.push(match[1])
  }
  headSettings.styles = styles.join('\n')

  // Get font links
  const linkMatches = htmlContent.matchAll(/<link[^>]*href=["']([^"']*fonts[^"']*)["'][^>]*>/gi)
  const fonts: EmailHeadSettings['fonts'] = []
  let index = 0
  for (const match of linkMatches) {
    const href = match[1]
    // Extract font name from Google Fonts URL
    const familyMatch = href.match(/family=([^:&]+)/)
    const fontName = familyMatch ? familyMatch[1].replace(/\+/g, ' ') : `Font ${index + 1}`
    fonts.push({
      id: `font-${Date.now()}-${index}`,
      name: fontName,
      url: href
    })
    index++
  }
  headSettings.fonts = fonts

  // Get preview text (hidden div at the start of body)
  const previewMatch = htmlContent.match(/<div[^>]*style=["'][^"']*display:\s*none[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
  if (previewMatch) {
    headSettings.previewText = previewMatch[1].trim()
  }

  // Get body content
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let bodyContent = bodyMatch ? bodyMatch[1] : htmlContent

  // Remove preview text div from body
  if (previewMatch) {
    bodyContent = bodyContent.replace(previewMatch[0], '')
  }

  return {
    body: bodyContent.trim(),
    headSettings
  }
}

export {
  processButton,
  processHeading,
  processText,
  processParagraph,
  processSection,
  processRow,
  processColumn,
  processContainer,
  processImage,
  processLink,
  processCodeBlock,
  processDivider,
  processList,
  processListItem,
}

/**
 * Synchronous render function for markup
 */
export function renderSync(markup: string): string {
  return generateEmailFromMarkup(markup)
}
