import { normalizeMarkup } from "./parser"
import {
  findHiddenPreviewDiv,
  getAllTagContents,
  getFirstTagContent,
  getTagAttributes,
  replaceSelfClosing,
  stripTagPairs
} from "./tag-scan"
import { processMarkup } from "./transform"
import type { EmailHeadSettings, ParsedEmailContent } from "./types"

const DEFAULT_FONT_FAMILY =
  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

const generateFontLinks = (fonts?: EmailHeadSettings["fonts"]): string => {
  if (!fonts?.length) {
    return ""
  }

  return fonts
    .map((font) => {
      return `<link href="${font.url}" rel="stylesheet" type="text/css" />`
    })
    .join("\n")
}

const generatePreviewText = (text?: string): string => {
  if (!text) {
    return ""
  }

  return `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${text}</div>`
}

const emptyHeadSettings = (): EmailHeadSettings => ({
  title: "",
  previewText: "",
  styles: "",
  fonts: []
})

const parseSevkMarkup = (markup: string): ParsedEmailContent => {
  const headSettings = emptyHeadSettings()
  const rootAttributes = getTagAttributes(markup, "email")[0] ?? getTagAttributes(markup, "mail")[0]

  if (rootAttributes !== undefined) {
    const langMatch = rootAttributes.match(/lang=["']([^"']*)["']/i)
    const dirMatch = rootAttributes.match(/dir=["']([^"']*)["']/i)

    if (langMatch) {
      headSettings.lang = langMatch[1]
    }
    if (dirMatch) {
      headSettings.dir = dirMatch[1]
    }
  }

  const extract = (tag: string) => getFirstTagContent(markup, tag)?.trim() || ""

  headSettings.title = extract("title")
  headSettings.previewText = extract("preview")
  headSettings.styles = extract("style")

  const fonts: NonNullable<EmailHeadSettings["fonts"]> = []
  const seenFontUrls = new Set<string>()

  for (const attributes of getTagAttributes(markup, "font")) {
    const name = attributes.match(/name=["']([^"']*)["']/i)?.[1]
    const url = attributes.match(/url=["']([^"']*)["']/i)?.[1]

    if (name === undefined || url === undefined || seenFontUrls.has(url)) {
      continue
    }

    seenFontUrls.add(url)
    fonts.push({
      id: `font-${Date.now()}-${fonts.length}`,
      name,
      url
    })
  }
  headSettings.fonts = fonts

  let body = getFirstTagContent(markup, "body")?.trim() || ""

  if (!body) {
    let stripped = replaceSelfClosing(markup, "email", false, () => "")
    stripped = replaceSelfClosing(stripped, "mail", false, () => "").replace(/<\/(?:email|mail)>/gi, "")
    stripped = stripTagPairs(stripped, "head")
    stripped = stripTagPairs(stripped, "title")
    stripped = stripTagPairs(stripped, "preview")
    stripped = stripTagPairs(stripped, "style")
    body = replaceSelfClosing(stripped, "font", false, () => "")
      .replace(/<\/font>/gi, "")
      .trim()
  }

  return { body, headSettings }
}

const parseHtmlDocument = (html: string): ParsedEmailContent => {
  const headSettings = emptyHeadSettings()
  headSettings.title = getFirstTagContent(html, "title")?.trim() || ""
  headSettings.styles = getAllTagContents(html, "style").join("\n")

  const fonts: NonNullable<EmailHeadSettings["fonts"]> = []
  let index = 0
  for (const attributes of getTagAttributes(html, "link")) {
    const href = attributes.match(/href=["']([^"']*)["']/i)?.[1]

    if (href === undefined || !href.toLowerCase().includes("fonts")) {
      continue
    }

    const familyMatch = href.match(/family=([^:&]+)/)
    fonts.push({
      id: `font-${Date.now()}-${index}`,
      name: familyMatch?.[1]?.replace(/\+/g, " ") || `Font ${index + 1}`,
      url: href
    })
    index++
  }
  headSettings.fonts = fonts

  const preview = findHiddenPreviewDiv(html)

  if (preview) {
    headSettings.previewText = preview.inner.trim()
  }

  const bodyContent = getFirstTagContent(html, "body")
  let body = bodyContent !== null ? bodyContent : html

  if (preview) {
    body = body.replace(preview.full, "")
  }

  return { body: body.trim(), headSettings }
}

export const parseEmailHTML = (content: string): ParsedEmailContent =>
  /<(?:email|mail)[\s>]/i.test(content)
    ? parseSevkMarkup(content)
    : parseHtmlDocument(content)

export const render = (
  htmlContent: string,
  headSettings?: EmailHeadSettings
): string => {
  const parsed = parseEmailHTML(htmlContent)
  const settings = headSettings || parsed.headSettings
  const { html: body, gapStyles } = processMarkup(
    normalizeMarkup(parsed.body)
  )

  const titleTag = settings.title ? `<title>${settings.title}</title>` : ""
  const fontLinks = generateFontLinks(settings.fonts)
  const gapStyleTag = gapStyles
    ? `<style type="text/css">${gapStyles}</style>`
    : ""
  const customStyles = settings.styles
    ? `<style type="text/css">${settings.styles}</style>`
    : ""
  const previewText = generatePreviewText(settings.previewText)
  const lang = settings.lang || "en"
  const dir = settings.dir || "ltr"

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="${lang}" dir="${dir}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta content="IE=edge" http-equiv="X-UA-Compatible"/>
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style type="text/css">
#outlook a { padding: 0; }
body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
.sevk-row-table { border-collapse: separate !important; }
img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
@media only screen and (max-width: 479px) {
  .sevk-row-table { width: 100% !important; }
  .sevk-column { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
}
</style>
${gapStyleTag}
${titleTag}
${fontLinks}
${customStyles}
</head>
<body style="margin:0;padding:0;word-spacing:normal;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:${DEFAULT_FONT_FAMILY};">
<div aria-roledescription="email" role="article">
${previewText}
${body}
</div>
</body>
</html>`
}
