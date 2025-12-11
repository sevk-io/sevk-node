import { extractStyleAttributes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Process sevk-column element
 * Creates a table cell (td) for email compatibility
 */
export function processColumn(
  element: Element,
  processElement: (element: Element) => string | null
): string | null {
  const children: string[] = []

  Array.from(element.children).forEach((child) => {
    const childElement = processElement(child)
    if (childElement) {
      children.push(childElement)
    }
  })

  if (children.length === 0) return null

  const style = extractStyleAttributes(element)
  const styleStr = styleToString(style)

  return `<td style="${styleStr}">${children.join('')}</td>`
}
