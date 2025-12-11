import { extractStyleAttributes, processChildNodes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Parse padding values from style
 */
function parsePadding(style: Record<string, string>) {
  const padding = style.padding
  const paddingTop = style.paddingTop
  const paddingRight = style.paddingRight
  const paddingBottom = style.paddingBottom
  const paddingLeft = style.paddingLeft

  if (padding) {
    const parts = padding.split(' ')
    if (parts.length === 1) {
      const val = parseInt(parts[0])
      return { paddingTop: val, paddingRight: val, paddingBottom: val, paddingLeft: val }
    } else if (parts.length === 2) {
      const vertical = parseInt(parts[0])
      const horizontal = parseInt(parts[1])
      return { paddingTop: vertical, paddingRight: horizontal, paddingBottom: vertical, paddingLeft: horizontal }
    } else if (parts.length === 4) {
      return {
        paddingTop: parseInt(parts[0]),
        paddingRight: parseInt(parts[1]),
        paddingBottom: parseInt(parts[2]),
        paddingLeft: parseInt(parts[3])
      }
    }
  }

  return {
    paddingTop: paddingTop ? parseInt(paddingTop) : 0,
    paddingRight: paddingRight ? parseInt(paddingRight) : 0,
    paddingBottom: paddingBottom ? parseInt(paddingBottom) : 0,
    paddingLeft: paddingLeft ? parseInt(paddingLeft) : 0
  }
}

/**
 * Convert px to pt for MSO
 */
function pxToPt(px: number): number {
  return Math.round((px * 3) / 4)
}

/**
 * Compute font width and space count for MSO padding
 */
function computeFontWidthAndSpaceCount(expectedWidth: number): [number, number] {
  if (expectedWidth === 0) return [0, 0]

  let smallestSpaceCount = 0
  const maxFontWidth = 5

  const computeRequiredFontWidth = () => {
    if (smallestSpaceCount > 0) {
      return expectedWidth / smallestSpaceCount / 2
    }
    return Number.POSITIVE_INFINITY
  }

  while (computeRequiredFontWidth() > maxFontWidth) {
    smallestSpaceCount++
  }

  return [computeRequiredFontWidth(), smallestSpaceCount]
}

/**
 * Process sevk-button element
 * Creates a button/link element with MSO compatibility
 */
export function processButton(
  element: Element,
  processElement: (element: Element) => string | null
): string | null {
  const href = element.getAttribute('href')
  const children = processChildNodes(element, processElement)
  const style = extractStyleAttributes(element)

  if (!href || children.length === 0) return null

  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = parsePadding(style)

  const y = paddingTop + paddingBottom
  const textRaise = pxToPt(y)

  const [plFontWidth, plSpaceCount] = computeFontWidthAndSpaceCount(paddingLeft)
  const [prFontWidth, prSpaceCount] = computeFontWidthAndSpaceCount(paddingRight)

  const buttonStyle: Record<string, string> = {
    lineHeight: '100%',
    textDecoration: 'none',
    display: 'inline-block',
    maxWidth: '100%',
    msoPaddingAlt: '0px',
    ...style,
    paddingTop: `${paddingTop}px`,
    paddingRight: `${paddingRight}px`,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: `${paddingLeft}px`,
  }

  const styleStr = styleToString(buttonStyle)

  const leftMsoSpaces = '&#8202;'.repeat(plSpaceCount)
  const rightMsoSpaces = '&#8202;'.repeat(prSpaceCount)

  return `<a href="${href}" target="_blank" style="${styleStr}"><!--[if mso]><i style="mso-font-width:${plFontWidth * 100}%;mso-text-raise:${textRaise}" hidden>${leftMsoSpaces}</i><![endif]--><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:${pxToPt(paddingBottom)}">${children.join('')}</span><!--[if mso]><i style="mso-font-width:${prFontWidth * 100}%" hidden>${rightMsoSpaces}&#8203;</i><![endif]--></a>`
}
