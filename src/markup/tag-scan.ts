export const replaceSelfClosing = (
  source: string,
  tag: string,
  selfCloseOnly: boolean,
  processor: (attributes: string) => string
): string => {
  const openPattern = new RegExp(`<${tag}`, "gi")
  const tagNameLength = tag.length + 1
  let output = ""
  let lastIndex = 0

  while (true) {
    const openingMatch = openPattern.exec(source)

    if (!openingMatch) {
      break
    }

    const closingBracket = source.indexOf(">", openingMatch.index + tagNameLength)

    if (closingBracket === -1) {
      break
    }

    openPattern.lastIndex = closingBracket + 1

    if (selfCloseOnly && source.charCodeAt(closingBracket - 1) !== 47) {
      continue
    }

    const attributesEnd = selfCloseOnly ? closingBracket - 1 : closingBracket
    const attributes = source.substring(openingMatch.index + tagNameLength, attributesEnd)

    output += source.substring(lastIndex, openingMatch.index) + processor(attributes)
    lastIndex = closingBracket + 1
  }

  return output + source.substring(lastIndex)
}

export const getFirstTagContent = (source: string, tag: string): string | null => {
  const openingMatch = new RegExp(`<${tag}`, "gi").exec(source)

  if (!openingMatch) {
    return null
  }

  const closingBracket = source.indexOf(">", openingMatch.index + tag.length + 1)

  if (closingBracket === -1) {
    return null
  }

  const closingPattern = new RegExp(`</${tag}>`, "gi")
  closingPattern.lastIndex = closingBracket + 1
  const closingMatch = closingPattern.exec(source)

  if (!closingMatch) {
    return null
  }

  return source.substring(closingBracket + 1, closingMatch.index)
}

export const getAllTagContents = (source: string, tag: string): string[] => {
  const openingPattern = new RegExp(`<${tag}`, "gi")
  const closingPattern = new RegExp(`</${tag}>`, "gi")
  const contents: string[] = []

  while (true) {
    const openingMatch = openingPattern.exec(source)

    if (!openingMatch) {
      break
    }

    const closingBracket = source.indexOf(">", openingMatch.index + tag.length + 1)

    if (closingBracket === -1) {
      break
    }

    closingPattern.lastIndex = closingBracket + 1
    const closingMatch = closingPattern.exec(source)

    if (!closingMatch) {
      break
    }

    contents.push(source.substring(closingBracket + 1, closingMatch.index))
    openingPattern.lastIndex = closingMatch.index + closingMatch[0].length
  }

  return contents
}

export const stripTagPairs = (source: string, tag: string): string => {
  const openingPattern = new RegExp(`<${tag}`, "gi")
  const closingPattern = new RegExp(`</${tag}>`, "gi")
  let output = ""
  let lastIndex = 0

  while (true) {
    const openingMatch = openingPattern.exec(source)

    if (!openingMatch) {
      break
    }

    const closingBracket = source.indexOf(">", openingMatch.index + tag.length + 1)

    if (closingBracket === -1) {
      break
    }

    closingPattern.lastIndex = closingBracket + 1
    const closingMatch = closingPattern.exec(source)

    if (!closingMatch) {
      break
    }

    output += source.substring(lastIndex, openingMatch.index)
    lastIndex = closingMatch.index + closingMatch[0].length
    openingPattern.lastIndex = lastIndex
  }

  return output + source.substring(lastIndex)
}

export const getTagAttributes = (source: string, tag: string): string[] => {
  const openingPattern = new RegExp(`<${tag}`, "gi")
  const attributes: string[] = []

  while (true) {
    const openingMatch = openingPattern.exec(source)

    if (!openingMatch) {
      break
    }

    const closingBracket = source.indexOf(">", openingMatch.index + tag.length + 1)

    if (closingBracket === -1) {
      break
    }

    attributes.push(source.substring(openingMatch.index + tag.length + 1, closingBracket))
    openingPattern.lastIndex = closingBracket + 1
  }

  return attributes
}

export const findHiddenPreviewDiv = (html: string): { inner: string, full: string } | null => {
  const openingPattern = /<div/gi
  const closingPattern = /<\/div>/gi

  while (true) {
    const openingMatch = openingPattern.exec(html)

    if (!openingMatch) {
      return null
    }

    const closingBracket = html.indexOf(">", openingMatch.index + 4)

    if (closingBracket === -1) {
      return null
    }

    const openingTag = html.substring(openingMatch.index, closingBracket + 1)

    if (/style=["'][^"']*display:\s*none/i.test(openingTag)) {
      closingPattern.lastIndex = closingBracket + 1
      const closingMatch = closingPattern.exec(html)

      if (!closingMatch) {
        return null
      }

      return {
        inner: html.substring(closingBracket + 1, closingMatch.index),
        full: html.substring(openingMatch.index, closingMatch.index + closingMatch[0].length)
      }
    }

    openingPattern.lastIndex = closingBracket + 1
  }
}
