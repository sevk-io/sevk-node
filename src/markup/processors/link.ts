import { extractStyleAttributes, processChildNodes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Process sevk-link element
 * Creates an anchor element
 */
export function processLink(
  element: Element,
  processElement: (element: Element) => string | null
): string | null {
  const href = element.getAttribute('href')
  const target = element.getAttribute('target')
  const children = processChildNodes(element, processElement)
  const style = extractStyleAttributes(element)

  if (!href || children.length === 0) return null

  const linkStyle: Record<string, string> = {
    ...style,
  }

  const styleStr = styleToString(linkStyle)
  const targetAttr = target || '_blank'

  return `<a href="${href}" target="${targetAttr}" style="${styleStr}">${children.join('')}</a>`
}
