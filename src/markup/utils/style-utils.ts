/**
 * Attribute source type - Record<string, string>
 */
type AttributeSource = Record<string, string>

/**
 * Get attribute value from source (Record)
 */
function getAttribute(source: AttributeSource, name: string): string | null {
  return source[name] || null
}

/**
 * Extract all styling attributes from an element or attribute record
 */
export function extractStyleAttributes(source: AttributeSource): Record<string, string> {
  const style: Record<string, string> = {}

  // Typography attributes
  const textColor = getAttribute(source, 'text-color') || getAttribute(source, 'color')
  const backgroundColor = getAttribute(source, 'background-color')
  const fontSize = getAttribute(source, 'font-size')
  const fontFamily = getAttribute(source, 'font-family')
  const fontWeight = getAttribute(source, 'font-weight')
  const lineHeight = getAttribute(source, 'line-height')
  const textAlign = getAttribute(source, 'text-align')
  const textDecoration = getAttribute(source, 'text-decoration')

  // Dimensions
  const width = getAttribute(source, 'width')
  const height = getAttribute(source, 'height')
  const maxWidth = getAttribute(source, 'max-width')
  const maxHeight = getAttribute(source, 'max-height')
  const minWidth = getAttribute(source, 'min-width')
  const minHeight = getAttribute(source, 'min-height')

  // Spacing - Padding
  const padding = getAttribute(source, 'padding')
  const paddingTop = getAttribute(source, 'padding-top')
  const paddingRight = getAttribute(source, 'padding-right')
  const paddingBottom = getAttribute(source, 'padding-bottom')
  const paddingLeft = getAttribute(source, 'padding-left')

  // Spacing - Margin
  const margin = getAttribute(source, 'margin')
  const marginTop = getAttribute(source, 'margin-top')
  const marginRight = getAttribute(source, 'margin-right')
  const marginBottom = getAttribute(source, 'margin-bottom')
  const marginLeft = getAttribute(source, 'margin-left')

  // Borders
  const border = getAttribute(source, 'border')
  const borderTop = getAttribute(source, 'border-top')
  const borderRight = getAttribute(source, 'border-right')
  const borderBottom = getAttribute(source, 'border-bottom')
  const borderLeft = getAttribute(source, 'border-left')
  const borderColor = getAttribute(source, 'border-color')
  const borderWidth = getAttribute(source, 'border-width')
  const borderStyle = getAttribute(source, 'border-style')

  // Border Radius
  const borderRadius = getAttribute(source, 'border-radius')
  const borderTopLeftRadius = getAttribute(source, 'border-top-left-radius')
  const borderTopRightRadius = getAttribute(source, 'border-top-right-radius')
  const borderBottomLeftRadius = getAttribute(source, 'border-bottom-left-radius')
  const borderBottomRightRadius = getAttribute(source, 'border-bottom-right-radius')

  // Background image
  const backgroundImage = getAttribute(source, 'background-image')
  const backgroundSize = getAttribute(source, 'background-size')
  const backgroundPosition = getAttribute(source, 'background-position')
  const backgroundRepeat = getAttribute(source, 'background-repeat')

  // Apply all attributes conditionally
  if (textColor) style.color = textColor
  if (backgroundColor) style['background-color'] = backgroundColor
  if (backgroundImage) style['background-image'] = `url('${backgroundImage}')`
  if (backgroundSize) style['background-size'] = backgroundSize
  else if (backgroundImage) style['background-size'] = 'cover'
  if (backgroundPosition) style['background-position'] = backgroundPosition
  else if (backgroundImage) style['background-position'] = 'center'
  if (backgroundRepeat) style['background-repeat'] = backgroundRepeat
  else if (backgroundImage) style['background-repeat'] = 'no-repeat'
  if (fontSize) style['font-size'] = fontSize
  if (fontFamily) style['font-family'] = fontFamily
  if (fontWeight) style['font-weight'] = fontWeight
  if (lineHeight) style['line-height'] = lineHeight
  if (textAlign) style['text-align'] = textAlign
  if (textDecoration) style['text-decoration'] = textDecoration

  // Dimensions
  if (width) style.width = width
  if (height) style.height = height
  if (maxWidth) style['max-width'] = maxWidth
  if (maxHeight) style['max-height'] = maxHeight
  if (minWidth) style['min-width'] = minWidth
  if (minHeight) style['min-height'] = minHeight

  // Spacing - padding
  if (padding) {
    style.padding = padding
  } else {
    if (paddingTop) style['padding-top'] = paddingTop
    if (paddingRight) style['padding-right'] = paddingRight
    if (paddingBottom) style['padding-bottom'] = paddingBottom
    if (paddingLeft) style['padding-left'] = paddingLeft
  }

  // Spacing - margin
  if (margin) {
    style.margin = margin
  } else {
    if (marginTop) style['margin-top'] = marginTop
    if (marginRight) style['margin-right'] = marginRight
    if (marginBottom) style['margin-bottom'] = marginBottom
    if (marginLeft) style['margin-left'] = marginLeft
  }

  // Borders
  if (border) {
    style.border = border
  } else {
    if (borderTop) style['border-top'] = borderTop
    if (borderRight) style['border-right'] = borderRight
    if (borderBottom) style['border-bottom'] = borderBottom
    if (borderLeft) style['border-left'] = borderLeft
    if (borderColor) style['border-color'] = borderColor
    if (borderWidth) style['border-width'] = borderWidth
    if (borderStyle) style['border-style'] = borderStyle
  }

  // Border radius
  if (borderRadius) {
    style['border-radius'] = borderRadius
  } else {
    if (borderTopLeftRadius) style['border-top-left-radius'] = borderTopLeftRadius
    if (borderTopRightRadius) style['border-top-right-radius'] = borderTopRightRadius
    if (borderBottomLeftRadius) style['border-bottom-left-radius'] = borderBottomLeftRadius
    if (borderBottomRightRadius) style['border-bottom-right-radius'] = borderBottomRightRadius
  }

  return style
}

/**
 * Convert style object to inline style string
 */
export function styleToString(style: Record<string, string | undefined>): string {
  return Object.entries(style)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

/**
 * Process child nodes and return HTML strings
 */
export function processChildNodes(
  element: Element,
  processElement: (element: Element) => string | null
): string[] {
  const children: string[] = []

  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent
      if (text) {
        children.push(text)
      }
    } else if (node.nodeType === 1) {
      const tagName = (node as Element).tagName.toLowerCase()
      if ([
        'text', 'image', 'link', 'sevk-link', 'button', 'codeblock', 'divider',
        'list', 'li', 'paragraph',
        'strong', 'em', 'b', 'i', 'span', 'a', 'code'
      ].includes(tagName)) {
        const childElement = processElement(node as Element)
        if (childElement) {
          children.push(childElement)
        }
      } else {
        const childElement = processElement(node as Element)
        if (childElement) {
          children.push(childElement)
        } else {
          const text = node.textContent
          if (text) {
            children.push(text)
          }
        }
      }
    }
  })

  return children
}
