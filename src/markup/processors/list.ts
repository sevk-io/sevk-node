import { extractStyleAttributes, processChildNodes, styleToString } from '../utils/style-utils'

/**
 * Process <list> element
 * Creates a ul or ol element
 */
export function processList(
  element: Element,
  processElement: (element: Element) => string | null
): string | null {
  const type = element.getAttribute('type') || 'unordered'
  const listStyleType = element.getAttribute('list-style-type')
  const className = element.getAttribute('class') || element.getAttribute('className')
  const children = processChildNodes(element, processElement)
  const style = extractStyleAttributes(element)

  if (children.length === 0) return null

  const tag = type === 'ordered' ? 'ol' : 'ul'

  const listStyle: Record<string, string> = {
    ...style,
  }

  if (listStyleType) {
    listStyle.listStyleType = listStyleType
  }

  const styleStr = styleToString(listStyle)
  const classAttr = className ? ` class="${className}"` : ''

  return `<${tag} style="${styleStr}"${classAttr}>${children.join('')}</${tag}>`
}
