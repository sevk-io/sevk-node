export const parsePadding = (style: Record<string, string>) => {
  let paddingTop = 0
  let paddingRight = 0
  let paddingBottom = 0
  let paddingLeft = 0

  if (style["padding"]) {
    const values = style["padding"].trim().split(/\s+/)
    const pixelValue = (index: number) =>
      parseInt(values[index]?.replace("px", "") || "0", 10) || 0

    if (values.length === 1) {
      paddingTop = pixelValue(0)
      paddingRight = pixelValue(0)
      paddingBottom = pixelValue(0)
      paddingLeft = pixelValue(0)
    } else if (values.length === 2) {
      paddingTop = pixelValue(0)
      paddingRight = pixelValue(1)
      paddingBottom = pixelValue(0)
      paddingLeft = pixelValue(1)
    } else if (values.length === 3) {
      paddingTop = pixelValue(0)
      paddingRight = pixelValue(1)
      paddingBottom = pixelValue(2)
      paddingLeft = pixelValue(1)
    } else if (values.length === 4) {
      paddingTop = pixelValue(0)
      paddingRight = pixelValue(1)
      paddingBottom = pixelValue(2)
      paddingLeft = pixelValue(3)
    }
  }

  const sideValue = (key: string) =>
    parseInt((style[key] || "0").replace("px", ""), 10) || 0

  if (style["padding-top"]) {
    paddingTop = sideValue("padding-top")
  }
  if (style["padding-right"]) {
    paddingRight = sideValue("padding-right")
  }
  if (style["padding-bottom"]) {
    paddingBottom = sideValue("padding-bottom")
  }
  if (style["padding-left"]) {
    paddingLeft = sideValue("padding-left")
  }

  return { paddingTop, paddingRight, paddingBottom, paddingLeft }
}

export const pxToPt = (px: number): number => Math.round((px * 3) / 4)

export const computeMsoSpacing = (
  width: number
): { fontWidth: number; spaceCount: number } => {
  if (!Number.isFinite(width) || width <= 0) {
    return { fontWidth: 0, spaceCount: 0 }
  }

  const spaceCount = Math.min(1000, Math.max(1, Math.ceil(width / 10)))

  return { fontWidth: width / spaceCount / 2.0, spaceCount }
}
