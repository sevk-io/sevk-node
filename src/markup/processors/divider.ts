import { extractStyleAttributes, styleToString } from '../utils/style-utils'

/**
 * Process <divider> element
 * Converts to horizontal rule
 */
export function processDivider(element: Element): string {
  const className = element.getAttribute('class') || element.getAttribute('className')
  const style = extractStyleAttributes(element)

  const dividerStyle: Record<string, string> = {
    ...style,
  }

  const styleStr = styleToString(dividerStyle)
  const classAttr = className ? ` class="${className}"` : ''

  return `<hr style="${styleStr}"${classAttr} />`
}
