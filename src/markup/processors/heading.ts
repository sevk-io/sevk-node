import { extractStyleAttributes, processChildNodes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Process sevk-heading element
 * Creates a heading element (h1-h6)
 */
export function processHeading(
  element: Element,
  processElement: (element: Element) => string | null
): string | null {
  const level = element.getAttribute('level') || '1'
  const children = processChildNodes(element, processElement)
  const style = extractStyleAttributes(element)

  if (children.length === 0) {
    const textContent = element.textContent?.trim()
    if (textContent) {
      children.push(textContent)
    }
  }

  if (children.length === 0) return null

  const tag = `h${level}`
  const styleStr = styleToString(style)

  return `<${tag} style="${styleStr}">${children.join('')}</${tag}>`
}
