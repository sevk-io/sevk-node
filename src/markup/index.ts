/**
 * Sevk Markup Renderer
 *
 * Converts Sevk markup tags into email-safe HTML with inline styles.
 * Supports: section, container, row, column, heading, paragraph, text,
 * button, image, divider, link, list, codeblock.
 */

import Prism from 'prismjs'
import { styleToString, extractStyleAttributes } from './utils/style-utils'
import { themes } from './utils/themes'

// Load Prism languages
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

// ============================================================================
// Types
// ============================================================================

export interface EmailHeadSettings {
  title?: string
  previewText?: string
  styles?: string
  fonts?: Array<{ id: string; name: string; url: string }>
  lang?: string
  dir?: string
}

export interface ParsedEmailContent {
  body: string
  headSettings: EmailHeadSettings
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FONT_FAMILY = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

// ============================================================================
// Core: Attribute Parsing
// ============================================================================

function parseAttributes(attrsStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /([\w-]+)=(?:"([^"]*)"|'([^']*)')/g
  let match
  while ((match = re.exec(attrsStr)) !== null) {
    attrs[match[1]] = match[2] ?? match[3]
  }
  return attrs
}

// ============================================================================
// Core: Tag Processing Engine
// ============================================================================

/**
 * Process tags using innermost-first approach.
 * Finds the deepest nested tag of a given name and processes it first,
 * working outward. This handles nested tags correctly without recursion.
 */
function processTag(
  content: string,
  tagName: string,
  processor: (attrs: Record<string, string>, inner: string) => string
): string {
  let result = content
  const openPattern = new RegExp(`<${tagName}([^>]*)>`, 'gi')
  const closePattern = new RegExp(`</${tagName}>`, 'gi')
  const nestedCheckPattern = new RegExp(`<${tagName}`, 'gi')

  let iterations = 0
  while (iterations++ < 10000) {
    // Collect all opening tags
    const openings: Array<{ index: number; fullMatch: string; attrs: string }> = []
    let match
    openPattern.lastIndex = 0
    while ((match = openPattern.exec(result)) !== null) {
      openings.push({ index: match.index, fullMatch: match[0], attrs: match[1] || '' })
    }
    if (openings.length === 0) break

    let didProcess = false

    // Process innermost first (iterate from last to first)
    for (let i = openings.length - 1; i >= 0; i--) {
      const opening = openings[i]
      const innerStart = opening.index + opening.fullMatch.length

      // Find matching close tag
      closePattern.lastIndex = innerStart
      const closeMatch = closePattern.exec(result)
      if (!closeMatch) continue

      const inner = result.substring(innerStart, closeMatch.index)

      // Skip if there's a nested same tag inside
      nestedCheckPattern.lastIndex = 0
      if (nestedCheckPattern.test(inner)) continue

      // Process this tag
      const attrs = parseAttributes(opening.attrs)
      const replacement = processor(attrs, inner)
      const end = closeMatch.index + closeMatch[0].length
      result = result.substring(0, opening.index) + replacement + result.substring(end)
      didProcess = true
      break
    }

    if (!didProcess) break
  }

  return result
}

// ============================================================================
// Tag Processors: Layout
// ============================================================================

function processSection(attrs: Record<string, string>, inner: string): string {
  const style = extractStyleAttributes(attrs)
  const tdStyle: Record<string, string> = {}

  // Padding and text-align belong on the <td>, not the <table>
  if (style['padding']) { tdStyle['padding'] = style['padding']; delete style['padding'] }
  if (style['text-align']) { tdStyle['text-align'] = style['text-align']; delete style['text-align'] }

  return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleToString(style)}">
<tbody>
<tr>
<td style="${styleToString(tdStyle)}">${inner}</td>
</tr>
</tbody>
</table>`
}

function processContainer(attrs: Record<string, string>, inner: string): string {
  const style = extractStyleAttributes(attrs)
  const tdStyle: Record<string, string> = {}
  const tableStyle: Record<string, string> = {}

  // Visual styles go on <td>, layout styles stay on <table>
  for (const [key, value] of Object.entries(style)) {
    if (['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-color', 'border-width', 'border-style', 'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'].includes(key)) {
      tdStyle[key] = value
    } else {
      tableStyle[key] = value
    }
  }

  // Add border-collapse: separate when border-radius is used
  const hasBorderRadius = tdStyle['border-radius'] || tdStyle['border-top-left-radius'] || tdStyle['border-top-right-radius'] || tdStyle['border-bottom-left-radius'] || tdStyle['border-bottom-right-radius']
  if (hasBorderRadius) {
    tableStyle['border-collapse'] = 'separate'
  }

  // Make fixed widths responsive: width becomes max-width, width set to 100%
  if (tableStyle['width'] && tableStyle['width'] !== '100%' && tableStyle['width'] !== 'auto') {
    if (!tableStyle['max-width']) tableStyle['max-width'] = tableStyle['width']
    tableStyle['width'] = '100%'
  }

  return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleToString(tableStyle)}">
<tbody>
<tr style="width:100%">
<td style="${styleToString(tdStyle)}">${inner}</td>
</tr>
</tbody>
</table>`
}

function processColumn(attrs: Record<string, string>, inner: string): string {
  const style = extractStyleAttributes(attrs)
  if (!style['vertical-align']) style['vertical-align'] = 'top'
  return `<td class="sevk-column" style="${styleToString(style)}">${inner}</td>`
}

function processRow(
  attrs: Record<string, string>,
  inner: string,
  rowCounter: { value: number },
  gapStylesArr: string[]
): string {
  const gap = attrs['gap'] || '0'
  const style = extractStyleAttributes(attrs)
  delete style['gap']

  const gapPx = gap.replace('px', '')
  const gapNum = parseInt(gapPx) || 0
  const rowId = `sevk-row-${rowCounter.value++}`

  // Assign equal widths to columns if more than one
  const columnCount = (inner.match(/class="sevk-column"/g) || []).length
  if (columnCount > 1) {
    const equalWidth = `${Math.floor(100 / columnCount)}%`
    inner = inner.replace(/<td class="sevk-column" style="([^"]*)"/g, (match, existingStyle) => {
      if (existingStyle.includes('width:')) return match
      return `<td class="sevk-column" style="width:${equalWidth};${existingStyle}"`
    })
  }

  // Insert spacer <td> between each column for desktop gap
  let processedInner = inner
  if (gapNum > 0) {
    const spacerTd = `</td><td class="sevk-gap" style="width:${gapPx}px;min-width:${gapPx}px" width="${gapPx}"></td><td class="sevk-column"`
    processedInner = processedInner.replace(/<\/td>\s*<td class="sevk-column"/g, spacerTd)

    // Collect mobile responsive styles (will be placed in <head>)
    gapStylesArr.push(
      `.${rowId} .sevk-gap{display:none !important;}` +
      `.${rowId} > tbody > tr > td.sevk-column{display:block !important;width:100% !important;margin-bottom:${gapPx}px !important;}` +
      `.${rowId} > tbody > tr > td.sevk-column:last-of-type{margin-bottom:0 !important;}`
    )
  }

  return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" class="sevk-row-table ${rowId}" style="${styleToString(style)}">
<tbody style="width:100%">
<tr style="width:100%">${processedInner}</tr>
</tbody>
</table>`
}

// ============================================================================
// Tag Processors: Typography
// ============================================================================

function processHeading(attrs: Record<string, string>, inner: string): string {
  const level = attrs['level'] || '1'
  const style = extractStyleAttributes(attrs)
  if (!style['margin']) style['margin'] = '0'
  return `<h${level} style="${styleToString(style)}">${inner}</h${level}>`
}

function processParagraph(attrs: Record<string, string>, inner: string): string {
  const style = extractStyleAttributes(attrs)
  if (!style['margin']) style['margin'] = '0'
  return `<p style="${styleToString(style)}">${inner}</p>`
}

function processText(attrs: Record<string, string>, inner: string): string {
  const style = extractStyleAttributes(attrs)
  return `<span style="${styleToString(style)}">${inner}</span>`
}

function processLink(attrs: Record<string, string>, inner: string): string {
  const href = attrs['href'] || '#'
  const target = attrs['target'] || '_blank'
  const style = extractStyleAttributes(attrs)
  return `<a href="${href}" target="${target}" style="${styleToString(style)}">${inner}</a>`
}

// ============================================================================
// Tag Processors: Interactive
// ============================================================================

function processButton(attrs: Record<string, string>, inner: string): string {
  const href = attrs['href'] || '#'
  const style = extractStyleAttributes(attrs)
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = parsePadding(style)

  const textRaise = pxToPt(paddingTop + paddingBottom)
  const { fontWidth: plFontWidth, spaceCount: plSpaceCount } = computeMsoSpacing(paddingLeft)
  const { fontWidth: prFontWidth, spaceCount: prSpaceCount } = computeMsoSpacing(paddingRight)

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

  const leftSpaces = '&#8202;'.repeat(plSpaceCount)
  const rightSpaces = '&#8202;'.repeat(prSpaceCount)

  return `<a href="${href}" target="_blank" style="${styleToString(buttonStyle)}">` +
    `<!--[if mso]><i style="mso-font-width:${Math.round(plFontWidth * 100)}%;mso-text-raise:${textRaise}" hidden>${leftSpaces}</i><![endif]-->` +
    `<span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:${pxToPt(paddingBottom)}">${inner}</span>` +
    `<!--[if mso]><i style="mso-font-width:${Math.round(prFontWidth * 100)}%" hidden>${rightSpaces}&#8203;</i><![endif]-->` +
    `</a>`
}

// ============================================================================
// Tag Processors: Media
// ============================================================================

function processImage(attrsStr: string): string {
  const attrs = parseAttributes(attrsStr)
  const src = attrs['src'] || ''
  const alt = attrs['alt'] || ''
  const width = attrs['width']
  const height = attrs['height']

  const style = extractStyleAttributes(attrs)
  if (!style['outline']) style['outline'] = 'none'
  if (!style['border']) style['border'] = 'none'
  if (!style['text-decoration']) style['text-decoration'] = 'none'
  if (!style['vertical-align']) style['vertical-align'] = 'middle'
  if (!style['max-width']) style['max-width'] = '100%'

  const widthVal = width ? width.replace('px', '') : ''
  const heightVal = height ? height.replace('px', '') : ''
  const widthAttr = widthVal ? ` width="${widthVal}"` : ''
  const heightAttr = heightVal ? ` height="${heightVal}"` : ''

  return `<img src="${src}" alt="${alt}"${widthAttr}${heightAttr} style="${styleToString(style)}" />`
}

function processDivider(attrsStr: string): string {
  const attrs = parseAttributes(attrsStr)
  const style = extractStyleAttributes(attrs)
  const classAttr = attrs['class'] || attrs['className']
  const classStr = classAttr ? ` class="${classAttr}"` : ''
  return `<hr style="${styleToString(style)}"${classStr} />`
}

// ============================================================================
// Tag Processors: Lists
// ============================================================================

function processList(attrs: Record<string, string>, inner: string): string {
  const tag = attrs['type'] === 'ordered' ? 'ol' : 'ul'
  const style = extractStyleAttributes(attrs)
  if (!style['margin']) style['margin'] = '0'
  if (attrs['list-style-type']) style['list-style-type'] = attrs['list-style-type']
  const classAttr = attrs['class'] || attrs['className']
  const classStr = classAttr ? ` class="${classAttr}"` : ''
  return `<${tag} style="${styleToString(style)}"${classStr}>${inner}</${tag}>`
}

function processListItem(attrs: Record<string, string>, inner: string): string {
  const style = extractStyleAttributes(attrs)
  const classAttr = attrs['class'] || attrs['className']
  const classStr = classAttr ? ` class="${classAttr}"` : ''
  return `<li style="${styleToString(style)}"${classStr}>${inner}</li>`
}

// ============================================================================
// Tag Processors: Code Block (Prism)
// ============================================================================

// Block processing - template based (see blocks.ts)
import { processBlockTag } from './blocks'

// ============================================================================
// Tag Processors: Code Block (Prism)
// ============================================================================

function processCodeBlock(attrs: Record<string, string>, code: string): string {
  const language = attrs['language'] || 'javascript'
  const themeName = attrs['theme'] || 'oneDark'
  const lineNumbers = attrs['line-numbers'] === 'true'
  const fontFamily = attrs['font-family']
  const customStyle = extractStyleAttributes(attrs)

  if (!code) return '<pre><code></code></pre>'

  const theme = themes[themeName] || themes.oneDark
  const grammar = Prism.languages[language]

  // Fallback: no grammar found
  if (!grammar) {
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const baseStyle = { ...theme.base, width: '100%', ...customStyle }
    return `<pre style="${themeStyleToString(baseStyle)}"><code>${escaped}</code></pre>`
  }

  // Tokenize entire code at once (faster than line-by-line)
  const inheritedStyles: Record<string, string> = {}
  if (fontFamily) inheritedStyles['font-family'] = fontFamily

  const tokens = Prism.tokenize(code, grammar)
  const fullHTML = tokens.map(t => renderPrismToken(t, theme, inheritedStyles)).join('')
  const linesHTML = fullHTML.split('\n').map((line, i) => {
    const lineNum = lineNumbers ? `<span style="width:2em;display:inline-block">${i + 1}</span>` : ''
    return `<p style="margin:0;min-height:1em">${lineNum}${line || ''}</p>`
  })

  const baseStyle = { ...theme.base, width: '100%', 'box-sizing': 'border-box', ...customStyle }
  return `<pre style="${themeStyleToString(baseStyle)}"><code>${linesHTML.join('')}</code></pre>`
}

// ============================================================================
// Prism Token Renderer
// ============================================================================

function getTokenStyles(token: Prism.Token, theme: Record<string, Record<string, string>>): Record<string, string> {
  const styles = theme[token.type] ? { ...theme[token.type] } : {}
  const aliases = Array.isArray(token.alias) ? token.alias : token.alias ? [token.alias] : []
  for (const alias of aliases) {
    if (theme[alias]) Object.assign(styles, theme[alias])
  }
  return styles
}

function renderPrismToken(
  token: string | Prism.Token,
  theme: Record<string, Record<string, string>>,
  inherited: Record<string, string> = {}
): string {
  if (typeof token === 'string') {
    const text = token.replace(/ /g, '\xA0\u200D\u200B')
    const s = styleToString(inherited)
    return s ? `<span style="${s}">${text}</span>` : text
  }

  if (token instanceof Prism.Token) {
    const merged = { ...inherited, ...getTokenStyles(token, theme) }
    const s = styleToString(merged)

    if (typeof token.content === 'string') {
      return `<span style="${s}">${token.content.replace(/ /g, '\xA0\u200D\u200B')}</span>`
    }
    if (token.content instanceof Prism.Token) {
      return `<span style="${s}">${renderPrismToken(token.content, theme, merged)}</span>`
    }
    if (Array.isArray(token.content)) {
      return `<span style="${s}">${token.content.map(t => renderPrismToken(t, theme, merged)).join('')}</span>`
    }
  }

  return ''
}

// ============================================================================
// Helpers: Padding & MSO
// ============================================================================

function parsePadding(style: Record<string, string>) {
  if (style['padding']) {
    const p = style['padding'].split(/\s+/)
    const v = (i: number) => parseInt(p[i]?.replace('px', '') || '0', 10) || 0
    if (p.length === 1) return { paddingTop: v(0), paddingRight: v(0), paddingBottom: v(0), paddingLeft: v(0) }
    if (p.length === 2) return { paddingTop: v(0), paddingRight: v(1), paddingBottom: v(0), paddingLeft: v(1) }
    if (p.length === 4) return { paddingTop: v(0), paddingRight: v(1), paddingBottom: v(2), paddingLeft: v(3) }
  }
  const px = (k: string) => parseInt((style[k] || '0').replace('px', ''), 10) || 0
  return { paddingTop: px('padding-top'), paddingRight: px('padding-right'), paddingBottom: px('padding-bottom'), paddingLeft: px('padding-left') }
}

function pxToPt(px: number): number {
  return Math.round((px * 3) / 4)
}

function computeMsoSpacing(width: number): { fontWidth: number; spaceCount: number } {
  if (width === 0) return { fontWidth: 0, spaceCount: 0 }
  let count = 0
  while (true) {
    const fw = count > 0 ? width / count / 2.0 : Infinity
    if (fw <= 5.0) return { fontWidth: fw, spaceCount: count }
    count++
  }
}

// ============================================================================
// Helpers: Style Conversion
// ============================================================================

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function themeStyleToString(style: Record<string, string>): string {
  return Object.entries(style)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${camelToKebab(k)}:${v}`)
    .join(';')
}

// ============================================================================
// Markup Processing Pipeline
// ============================================================================

function normalizeMarkup(content: string): string {
  let result = content
  // Convert <link> to <sevk-link> to avoid HTML void element issues
  result = result.replace(/<link\s+href=/gi, '<sevk-link href=')
  result = result.replace(/<\/link>/gi, '</sevk-link>')
  if (!result.includes('<email') && !result.includes('<mail') && !result.includes('<sevk-email')) {
    result = `<mail><body>${result}</body></mail>`
  }
  return result
}

function processMarkup(content: string): { html: string; gapStyles: string } {
  let result = content
  const gapStylesArr: string[] = []
  const rowCounter = { value: 0 }

  // Expand blocks - template is inner content, config is attribute
  result = processTag(result, 'block', (attrs, inner) => processBlockTag(attrs, inner))
  result = result.replace(/<block([^>]*)\/>/gi, (_, attrsStr) => {
    const attrs = parseAttributes(attrsStr)
    return processBlockTag(attrs)
  })

  // Ensure <link> → <sevk-link>
  result = result.replace(/<link\s+href=/gi, '<sevk-link href=')
  result = result.replace(/<\/link>/gi, '</sevk-link>')

  // Layout tags (order matters: column before row)
  result = processTag(result, 'section', processSection)
  result = processTag(result, 'column', processColumn)
  result = processTag(result, 'row', (attrs, inner) => processRow(attrs, inner, rowCounter, gapStylesArr))
  result = processTag(result, 'container', processContainer)

  // Typography
  result = processTag(result, 'heading', processHeading)
  result = processTag(result, 'paragraph', processParagraph)
  result = processTag(result, 'text', processText)

  // Interactive
  result = processTag(result, 'button', processButton)

  // Media (self-closing tags, handled with regex)
  result = result.replace(/<image([^>]*)\/?>/gi, (_, a) => processImage(a))
  result = result.replace(/<\/image>/gi, '')
  result = result.replace(/<divider([^>]*)\/?>/gi, (_, a) => processDivider(a))
  result = result.replace(/<\/divider>/gi, '')

  // Links
  result = processTag(result, 'sevk-link', processLink)

  // Lists
  result = processTag(result, 'list', processList)
  result = processTag(result, 'li', processListItem)

  // Components
  result = processTag(result, 'codeblock', processCodeBlock)


  // Clean up stray closing tags
  result = result.replace(/<\/(?:container|section|row|column|heading|paragraph|text|button|sevk-link)>/gi, '')

  // Clean up wrapper tags
  for (const tag of ['sevk-email', 'sevk-body', 'email', 'mail', 'body']) {
    result = result.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '')
    result = result.replace(new RegExp(`</${tag}>`, 'gi'), '')
  }

  const gapStyles = gapStylesArr.length > 0
    ? `@media only screen and (max-width:479px){${gapStylesArr.join('')}}`
    : ''

  return { html: result.trim(), gapStyles }
}

// ============================================================================
// Email HTML Generator
// ============================================================================

function generateFontLinks(fonts?: EmailHeadSettings['fonts']): string {
  if (!fonts?.length) return ''
  return fonts.map(f => `<link href="${f.url}" rel="stylesheet" type="text/css" />`).join('\n')
}

function generatePreviewText(text?: string): string {
  if (!text) return ''
  return `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${text}</div>`
}

export function generateEmailFromMarkup(htmlContent: string, headSettings?: EmailHeadSettings): string {
  const parsed = parseEmailHTML(htmlContent)
  if (!headSettings) headSettings = parsed.headSettings

  const normalized = normalizeMarkup(parsed.body)
  const { html: body, gapStyles } = processMarkup(normalized)

  const titleTag = headSettings?.title ? `<title>${headSettings.title}</title>` : ''
  const fontLinks = generateFontLinks(headSettings?.fonts)
  const gapStyleTag = gapStyles ? `<style type="text/css">${gapStyles}</style>` : ''
  const customStyles = headSettings?.styles ? `<style type="text/css">${headSettings.styles}</style>` : ''
  const previewText = generatePreviewText(headSettings?.previewText)

  const lang = headSettings?.lang || 'en'
  const dir = headSettings?.dir || 'ltr'

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="${lang}" dir="${dir}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta content="IE=edge" http-equiv="X-UA-Compatible"/>
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style type="text/css">
#outlook a { padding: 0; }
body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
.sevk-row-table { border-collapse: separate !important; }
img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
@media only screen and (max-width: 479px) {
  .sevk-row-table { width: 100% !important; }
  .sevk-column { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
}
</style>
${gapStyleTag}
${titleTag}
${fontLinks}
${customStyles}
</head>
<body style="margin:0;padding:0;word-spacing:normal;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:${DEFAULT_FONT_FAMILY};">
<div aria-roledescription="email" role="article">
${previewText}
${body}
</div>
</body>
</html>`
}

export function generateEmailHTML(htmlContent: string, headSettings?: EmailHeadSettings): string {
  return generateEmailFromMarkup(htmlContent, headSettings)
}

// ============================================================================
// Markup Parser
// ============================================================================

export function parseEmailHTML(content: string): ParsedEmailContent {
  if (/<(?:email|mail)[\s>]/i.test(content)) {
    return parseSevkMarkup(content)
  }
  return parseHTMLFormat(content)
}

function parseSevkMarkup(markup: string): ParsedEmailContent {
  const headSettings: EmailHeadSettings = { title: '', previewText: '', styles: '', fonts: [] }

  // Parse lang and dir from <mail> or <email> root tag
  const rootMatch = markup.match(/<(?:email|mail)([^>]*)>/i)
  if (rootMatch) {
    const rootAttrs = rootMatch[1]
    const langMatch = rootAttrs.match(/lang=["']([^"']*)["']/i)
    const dirMatch = rootAttrs.match(/dir=["']([^"']*)["']/i)
    if (langMatch) headSettings.lang = langMatch[1]
    if (dirMatch) headSettings.dir = dirMatch[1]
  }

  const extract = (tag: string) => markup.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1]?.trim() || ''

  headSettings.title = extract('title')
  headSettings.previewText = extract('preview')
  headSettings.styles = extract('style')

  // Parse font tags
  const fonts: EmailHeadSettings['fonts'] = []
  const fontRe = /<font[^>]*name=["']([^"']*)["'][^>]*url=["']([^"']*)["'][^>]*\/?>/gi
  const fontRe2 = /<font[^>]*url=["']([^"']*)["'][^>]*name=["']([^"']*)["'][^>]*\/?>/gi
  let m
  while ((m = fontRe.exec(markup)) !== null) {
    fonts.push({ id: `font-${Date.now()}-${fonts.length}`, name: m[1], url: m[2] })
  }
  while ((m = fontRe2.exec(markup)) !== null) {
    if (!fonts.some(f => f.url === m![1])) {
      fonts.push({ id: `font-${Date.now()}-${fonts.length}`, name: m[2], url: m[1] })
    }
  }
  headSettings.fonts = fonts

  // Extract body
  const bodyMatch = markup.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let body = bodyMatch?.[1]?.trim() || ''
  if (!body) {
    body = markup
      .replace(/<(?:email|mail)[^>]*>/gi, '').replace(/<\/(?:email|mail)>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<preview[^>]*>[\s\S]*?<\/preview>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<font[^>]*\/?>/gi, '').replace(/<\/font>/gi, '')
      .trim()
  }

  return { body, headSettings }
}

function parseHTMLFormat(html: string): ParsedEmailContent {
  const headSettings: EmailHeadSettings = { title: '', previewText: '', styles: '', fonts: [] }

  headSettings.title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || ''

  const styles: string[] = []
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) styles.push(m[1])
  headSettings.styles = styles.join('\n')

  const fonts: EmailHeadSettings['fonts'] = []
  let idx = 0
  for (const m of html.matchAll(/<link[^>]*href=["']([^"']*fonts[^"']*)["'][^>]*>/gi)) {
    const familyMatch = m[1].match(/family=([^:&]+)/)
    fonts.push({ id: `font-${Date.now()}-${idx}`, name: familyMatch?.[1]?.replace(/\+/g, ' ') || `Font ${idx + 1}`, url: m[1] })
    idx++
  }
  headSettings.fonts = fonts

  const previewMatch = html.match(/<div[^>]*style=["'][^"']*display:\s*none[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
  if (previewMatch) headSettings.previewText = previewMatch[1].trim()

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let body = bodyMatch ? bodyMatch[1] : html
  if (previewMatch) body = body.replace(previewMatch[0], '')

  return { body: body.trim(), headSettings }
}

// ============================================================================
// Public API
// ============================================================================

export function render(markup: string): string {
  return generateEmailFromMarkup(markup)
}
