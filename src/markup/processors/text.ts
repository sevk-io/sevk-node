import { extractStyleAttributes, processChildNodes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Process sevk-text element
 * Creates an inline text span
 */
export function processText(
  element: Element,
  processElement: (element: Element) => string | null
): string | null {
  const children = processChildNodes(element, processElement)
  const style = extractStyleAttributes(element)

  if (children.length === 0) {
    const textContent = element.textContent?.trim()
    if (textContent) {
      children.push(textContent)
    }
  }

  if (children.length === 0) return null

  const styleStr = styleToString(style)

  return `<span style="${styleStr}">${children.join('')}</span>`
}
