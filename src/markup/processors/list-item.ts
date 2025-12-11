import { extractStyleAttributes, processChildNodes, styleToString } from '../utils/style-utils'

/**
 * Process <li> element
 * Creates a li element
 */
export function processListItem(
  element: Element,
  processElement: (element: Element) => string | null
): string | null {
  const children = processChildNodes(element, processElement)
  const className = element.getAttribute('class') || element.getAttribute('className')
  const style = extractStyleAttributes(element)

  if (children.length === 0) {
    const text = element.textContent?.trim()
    if (text) {
      children.push(text)
    }
  }

  const styleStr = styleToString(style)
  const classAttr = className ? ` class="${className}"` : ''

  return `<li style="${styleStr}"${classAttr}>${children.join('')}</li>`
}
