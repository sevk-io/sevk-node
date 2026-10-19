import { extractStyleAttributes, styleToString } from "../utils/style-utils"

export const processSection = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const style = extractStyleAttributes(attrs)
  const cellStyle: Record<string, string> = {}

  if (style["padding"]) {
    cellStyle["padding"] = style["padding"]
    delete style["padding"]
  }
  if (style["text-align"]) {
    cellStyle["text-align"] = style["text-align"]
    delete style["text-align"]
  }

  const hasBorderRadius =
    style["border-radius"] ||
    style["border-top-left-radius"] ||
    style["border-top-right-radius"] ||
    style["border-bottom-left-radius"] ||
    style["border-bottom-right-radius"]
  if (hasBorderRadius) {
    style["border-collapse"] = "separate"
  }

  return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleToString(style)}">
<tbody>
<tr>
<td style="${styleToString(cellStyle)}">${inner}</td>
</tr>
</tbody>
</table>`
}

const CELL_STYLE_KEYS = new Set([
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-color",
  "border-width",
  "border-style",
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left"
])

export const processContainer = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const style = extractStyleAttributes(attrs)
  const cellStyle: Record<string, string> = {}
  const tableStyle: Record<string, string> = {}

  for (const [key, value] of Object.entries(style)) {
    if (CELL_STYLE_KEYS.has(key)) {
      cellStyle[key] = value
    } else {
      tableStyle[key] = value
    }
  }

  const hasBorderRadius =
    cellStyle["border-radius"] ||
    cellStyle["border-top-left-radius"] ||
    cellStyle["border-top-right-radius"] ||
    cellStyle["border-bottom-left-radius"] ||
    cellStyle["border-bottom-right-radius"]
  if (hasBorderRadius) {
    tableStyle["border-collapse"] = "separate"
  }

  if (
    tableStyle["width"] &&
    tableStyle["width"] !== "100%" &&
    tableStyle["width"] !== "auto"
  ) {
    if (!tableStyle["max-width"]) {
      tableStyle["max-width"] = tableStyle["width"]
    }
    tableStyle["width"] = "100%"
  }

  return `<table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="${styleToString(tableStyle)}">
<tbody>
<tr style="width:100%">
<td style="${styleToString(cellStyle)}">${inner}</td>
</tr>
</tbody>
</table>`
}

export const processColumn = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const style = extractStyleAttributes(attrs)
  if (!style["vertical-align"]) {
    style["vertical-align"] = "top"
  }
  return `<td class="sevk-column" style="${styleToString(style)}">${inner}</td>`
}

export const processRow = (
  attrs: Record<string, string>,
  inner: string,
  rowCounter: { value: number },
  gapStyles: string[]
): string => {
  const gap = attrs["gap"] || "0"
  const style = extractStyleAttributes(attrs)
  delete style["gap"]

  const gapPixels = gap.replace("px", "")
  const gapSize = parseInt(gapPixels) || 0
  const rowId = `sevk-row-${rowCounter.value++}`

  const columnCount = (inner.match(/class="sevk-column"/g) || []).length
  if (columnCount > 1) {
    const equalWidth = `${Math.floor(100 / columnCount)}%`
    inner = inner.replace(
      /<td class="sevk-column" style="([^"]*)"/g,
      (match, existingStyle: string) => {
        if (existingStyle.includes("width:")) {
          return match
        }
        return `<td class="sevk-column" style="width:${equalWidth};${existingStyle}"`
      }
    )
  }

  if (gapSize > 0) {
    const spacer = `</td><td class="sevk-gap" style="width:${gapPixels}px;min-width:${gapPixels}px" width="${gapPixels}"></td><td class="sevk-column"`
    inner = inner.replace(/<\/td>\s*<td class="sevk-column"/g, spacer)

    gapStyles.push(
      `.${rowId} .sevk-gap{display:none !important;}` +
        `.${rowId} > tbody > tr > td.sevk-column{display:block !important;width:100% !important;margin-bottom:${gapPixels}px !important;}` +
        `.${rowId} > tbody > tr > td.sevk-column:last-of-type{margin-bottom:0 !important;}`
    )
  }

  return `<table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" class="sevk-row-table ${rowId}" style="${styleToString(style)}">
<tbody style="width:100%">
<tr style="width:100%">${inner}</tr>
</tbody>
</table>`
}
