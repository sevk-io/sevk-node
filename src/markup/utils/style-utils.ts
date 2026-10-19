type AttributeSource = Record<string, string>

const getAttribute = (source: AttributeSource, name: string): string | null => {
  return source[name] || null
}

const setStyleAttribute = (
  style: Record<string, string>,
  name: string,
  value: string | null
): void => {
  if (value) {
    style[name] = value
  }
}

export const extractStyleAttributes = (
  source: AttributeSource
): Record<string, string> => {
  const style: Record<string, string> = {}

  const textColor =
    getAttribute(source, "text-color") || getAttribute(source, "color")
  const backgroundColor = getAttribute(source, "background-color")
  const fontSize = getAttribute(source, "font-size")
  const fontFamily = getAttribute(source, "font-family")
  const fontWeight = getAttribute(source, "font-weight")
  const lineHeight = getAttribute(source, "line-height")
  const textAlign = getAttribute(source, "text-align")
  const textDecoration = getAttribute(source, "text-decoration")

  const width = getAttribute(source, "width")
  const height = getAttribute(source, "height")
  const maxWidth = getAttribute(source, "max-width")
  const maxHeight = getAttribute(source, "max-height")
  const minWidth = getAttribute(source, "min-width")
  const minHeight = getAttribute(source, "min-height")

  const padding = getAttribute(source, "padding")
  const paddingTop = getAttribute(source, "padding-top")
  const paddingRight = getAttribute(source, "padding-right")
  const paddingBottom = getAttribute(source, "padding-bottom")
  const paddingLeft = getAttribute(source, "padding-left")

  const margin = getAttribute(source, "margin")
  const marginTop = getAttribute(source, "margin-top")
  const marginRight = getAttribute(source, "margin-right")
  const marginBottom = getAttribute(source, "margin-bottom")
  const marginLeft = getAttribute(source, "margin-left")

  const border = getAttribute(source, "border")
  const borderTop = getAttribute(source, "border-top")
  const borderRight = getAttribute(source, "border-right")
  const borderBottom = getAttribute(source, "border-bottom")
  const borderLeft = getAttribute(source, "border-left")
  const borderColor = getAttribute(source, "border-color")
  const borderWidth = getAttribute(source, "border-width")
  const borderStyle = getAttribute(source, "border-style")

  const borderRadius = getAttribute(source, "border-radius")
  const borderTopLeftRadius = getAttribute(source, "border-top-left-radius")
  const borderTopRightRadius = getAttribute(source, "border-top-right-radius")
  const borderBottomLeftRadius = getAttribute(
    source,
    "border-bottom-left-radius"
  )
  const borderBottomRightRadius = getAttribute(
    source,
    "border-bottom-right-radius"
  )

  const backgroundImage = getAttribute(source, "background-image")
  const backgroundSize = getAttribute(source, "background-size")
  const backgroundPosition = getAttribute(source, "background-position")
  const backgroundRepeat = getAttribute(source, "background-repeat")

  setStyleAttribute(style, "color", textColor)
  setStyleAttribute(style, "background-color", backgroundColor)
  setStyleAttribute(
    style,
    "background-image",
    backgroundImage ? `url('${backgroundImage}')` : null
  )
  setStyleAttribute(
    style,
    "background-size",
    backgroundSize || (backgroundImage ? "cover" : null)
  )
  setStyleAttribute(
    style,
    "background-position",
    backgroundPosition || (backgroundImage ? "center" : null)
  )
  setStyleAttribute(
    style,
    "background-repeat",
    backgroundRepeat || (backgroundImage ? "no-repeat" : null)
  )

  setStyleAttribute(style, "font-size", fontSize)
  setStyleAttribute(style, "font-family", fontFamily)
  setStyleAttribute(style, "font-weight", fontWeight)
  setStyleAttribute(style, "line-height", lineHeight)
  setStyleAttribute(style, "text-align", textAlign)
  setStyleAttribute(style, "text-decoration", textDecoration)

  setStyleAttribute(style, "width", width)
  setStyleAttribute(style, "height", height)
  setStyleAttribute(style, "max-width", maxWidth)
  setStyleAttribute(style, "max-height", maxHeight)
  setStyleAttribute(style, "min-width", minWidth)
  setStyleAttribute(style, "min-height", minHeight)

  setStyleAttribute(style, "padding", padding)
  setStyleAttribute(style, "padding-top", paddingTop)
  setStyleAttribute(style, "padding-right", paddingRight)
  setStyleAttribute(style, "padding-bottom", paddingBottom)
  setStyleAttribute(style, "padding-left", paddingLeft)

  setStyleAttribute(style, "margin", margin)
  setStyleAttribute(style, "margin-top", marginTop)
  setStyleAttribute(style, "margin-right", marginRight)
  setStyleAttribute(style, "margin-bottom", marginBottom)
  setStyleAttribute(style, "margin-left", marginLeft)

  setStyleAttribute(style, "border", border)
  setStyleAttribute(style, "border-color", borderColor)
  setStyleAttribute(style, "border-width", borderWidth)
  setStyleAttribute(style, "border-style", borderStyle)
  setStyleAttribute(style, "border-top", borderTop)
  setStyleAttribute(style, "border-right", borderRight)
  setStyleAttribute(style, "border-bottom", borderBottom)
  setStyleAttribute(style, "border-left", borderLeft)

  setStyleAttribute(style, "border-radius", borderRadius)
  setStyleAttribute(style, "border-top-left-radius", borderTopLeftRadius)
  setStyleAttribute(style, "border-top-right-radius", borderTopRightRadius)
  setStyleAttribute(style, "border-bottom-left-radius", borderBottomLeftRadius)
  setStyleAttribute(style, "border-bottom-right-radius", borderBottomRightRadius)

  return style
}

const STYLE_ORDER = [
  "color",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "font-size",
  "font-family",
  "font-weight",
  "line-height",
  "text-align",
  "text-decoration",
  "width",
  "height",
  "max-width",
  "max-height",
  "min-width",
  "min-height",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "border",
  "border-color",
  "border-width",
  "border-style",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-collapse",
  "list-style-type",
  "vertical-align"
] as const

export const styleToString = (
  style: Record<string, string | undefined>
): string => {
  const seen = new Set<string>()
  const parts: string[] = []
  for (const key of STYLE_ORDER) {
    const value = style[key]
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${key}:${value}`)
      seen.add(key)
    }
  }
  for (const key of Object.keys(style)) {
    if (seen.has(key)) {
      continue
    }

    const value = style[key]
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${key}:${value}`)
    }
  }
  return parts.join(";")
}
