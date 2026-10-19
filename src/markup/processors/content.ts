import { parseAttributes } from "../parser"
import { computeMsoSpacing, parsePadding, pxToPt } from "../mso"
import { extractStyleAttributes, styleToString } from "../utils/style-utils"

export const processHeading = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const level = attrs["level"] || "1"
  const style = extractStyleAttributes(attrs)
  if (!style["margin"]) {
    style["margin"] = "0"
  }
  return `<h${level} style="${styleToString(style)}">${inner}</h${level}>`
}

export const processParagraph = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const style = extractStyleAttributes(attrs)
  if (!style["margin"]) {
    style["margin"] = "0"
  }
  return `<p style="${styleToString(style)}">${inner}</p>`
}

export const processText = (
  attrs: Record<string, string>,
  inner: string
): string =>
  `<span style="${styleToString(extractStyleAttributes(attrs))}">${inner}</span>`

export const processLink = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const href = attrs["href"] || "#"
  const target = attrs["target"] || "_blank"
  const style = styleToString(extractStyleAttributes(attrs))
  return `<a href="${href}" target="${target}" style="${style}">${inner}</a>`
}

// Outlook ignores normal anchor padding, so conditional MSO spacing mirrors it.
export const processButton = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const href = attrs["href"] || "#"
  const style = extractStyleAttributes(attrs)
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } =
    parsePadding(style)

  const textRaise = pxToPt(paddingTop + paddingBottom)
  const { fontWidth: leftFontWidth, spaceCount: leftSpaceCount } =
    computeMsoSpacing(paddingLeft)
  const { fontWidth: rightFontWidth, spaceCount: rightSpaceCount } =
    computeMsoSpacing(paddingRight)

  const buttonStyle: Record<string, string> = {
    "line-height": "100%",
    "text-decoration": "none",
    display: "inline-block",
    "max-width": "100%",
    "mso-padding-alt": "0px",
    ...style,
    "padding-top": `${paddingTop}px`,
    "padding-right": `${paddingRight}px`,
    "padding-bottom": `${paddingBottom}px`,
    "padding-left": `${paddingLeft}px`
  }

  const leftSpaces = "&#8202;".repeat(leftSpaceCount)
  const rightSpaces = "&#8202;".repeat(rightSpaceCount)

  return (
    `<a href="${href}" target="_blank" style="${styleToString(buttonStyle)}">` +
    `<!--[if mso]><i style="mso-font-width:${Math.round(leftFontWidth * 100)}%;mso-text-raise:${textRaise}" hidden>${leftSpaces}</i><![endif]-->` +
    `<span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:${pxToPt(paddingBottom)}">${inner}</span>` +
    `<!--[if mso]><i style="mso-font-width:${Math.round(rightFontWidth * 100)}%" hidden>${rightSpaces}&#8203;</i><![endif]-->` +
    `</a>`
  )
}

export const processImage = (attrsStr: string): string => {
  const attrs = parseAttributes(attrsStr)
  const src = attrs["src"] || ""
  const alt = attrs["alt"] || ""
  const width = attrs["width"]
  const height = attrs["height"]

  const style = extractStyleAttributes(attrs)
  if (!style["vertical-align"]) {
    style["vertical-align"] = "middle"
  }
  if (!style["max-width"]) {
    style["max-width"] = "100%"
  }

  const widthValue = width ? width.replace("px", "") : ""
  const heightValue = height ? height.replace("px", "") : ""
  const widthAttribute = widthValue ? ` width="${widthValue}"` : ""
  const heightAttribute = heightValue ? ` height="${heightValue}"` : ""

  return `<img src="${src}" alt="${alt}"${widthAttribute}${heightAttribute} style="${styleToString(style)}" />`
}

export const processDivider = (attrsStr: string): string => {
  const attrs = parseAttributes(attrsStr)
  const style = extractStyleAttributes(attrs)
  const className = attrs["class"] || attrs["className"]
  const classAttribute = className ? ` class="${className}"` : ""
  return `<hr style="${styleToString(style)}"${classAttribute} />`
}

export const processList = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const tag = attrs["type"] === "ordered" ? "ol" : "ul"
  const style = extractStyleAttributes(attrs)
  if (!style["margin"]) {
    style["margin"] = "0"
  }
  if (attrs["list-style-type"]) {
    style["list-style-type"] = attrs["list-style-type"]
  }
  const className = attrs["class"] || attrs["className"]
  const classAttribute = className ? ` class="${className}"` : ""
  return `<${tag} style="${styleToString(style)}"${classAttribute}>${inner}</${tag}>`
}

export const processListItem = (
  attrs: Record<string, string>,
  inner: string
): string => {
  const style = extractStyleAttributes(attrs)
  const className = attrs["class"] || attrs["className"]
  const classAttribute = className ? ` class="${className}"` : ""
  return `<li style="${styleToString(style)}"${classAttribute}>${inner}</li>`
}
