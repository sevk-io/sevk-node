import { extractStyleAttributes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Process sevk-section element
 * Creates a table-based section for email compatibility
 */
export function processSection(
  element: Element,
  processElement: (element: Element) => string | null
): string | null {
  const children: string[] = []

  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent?.trim()
      if (text) {
        children.push(text)
      }
    } else if (node.nodeType === 1) {
      const childElement = processElement(node as Element)
      if (childElement) {
        children.push(childElement)
      }
    }
  })

  if (children.length === 0) return null
  if (children.length === 1 && typeof children[0] === 'string' && !children[0].trim()) {
    return null
  }

  const style = extractStyleAttributes(element)
  const styleStr = styleToString(style)

  return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleStr}">
<tbody>
<tr>
<td>${children.join('')}</td>
</tr>
</tbody>
</table>`
}
