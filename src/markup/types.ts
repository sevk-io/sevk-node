export interface EmailHeadSettings {
  title?: string
  previewText?: string
  styles?: string
  fonts?: Array<{ id: string; name: string; url: string }>
  lang?: string
  dir?: string
}

export interface ParsedEmailContent {
  body: string
  headSettings: EmailHeadSettings
}
