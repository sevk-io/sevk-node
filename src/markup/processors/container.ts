import { extractStyleAttributes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Process sevk-container element
 * Creates a table-based container for email compatibility
 */
export function processContainer(
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

  const containerStyle: Record<string, string> = {
    ...style,
  }

  const styleStr = styleToString(containerStyle)

  return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleStr}">
<tbody>
<tr style="width:100%">
<td>${children.join('')}</td>
</tr>
</tbody>
</table>`
}
