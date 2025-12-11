import { extractStyleAttributes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Process sevk-row element
 * Creates a table-based row for email compatibility
 */
export function processRow(
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

  return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleStr}">
<tbody style="width:100%">
<tr style="width:100%">${children.join('')}</tr>
</tbody>
</table>`
}
