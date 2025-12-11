import { extractStyleAttributes } from '../utils/style-utils'
import { styleToString } from '../index'

/**
 * Process sevk-image element
 * Creates an img element
 */
export function processImage(element: Element): string | null {
  const src = element.getAttribute('src')
  const alt = element.getAttribute('alt')
  const width = element.getAttribute('width')
  const height = element.getAttribute('height')
  const style = extractStyleAttributes(element)

  if (!src) return null

  const imgStyle: Record<string, string> = {
    outline: 'none',
    border: 'none',
    textDecoration: 'none',
    ...style,
  }

  const styleStr = styleToString(imgStyle)
  const widthAttr = width ? ` width="${width}"` : ''
  const heightAttr = height ? ` height="${height}"` : ''

  return `<img src="${src}" alt="${alt || ''}"${widthAttr}${heightAttr} style="${styleStr}" />`
}
