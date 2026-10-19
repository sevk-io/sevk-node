import { render } from "../../markup"
import type {
  EmailAttachment,
  EmailHeaders,
  EmailTrackingOptions,
  SendBulkEmailOptions,
  SendEmailOptions
} from "./types"

interface WireEmailPayload<TRecipient extends string | string[]> {
  from: string
  to: TRecipient
  subject: string
  html?: string | null
  text?: string | null
  reply_to?: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
  tracking?: EmailTrackingOptions
  headers?: EmailHeaders
  scheduledAt?: string
}

export function toWirePayload(
  data: SendEmailOptions
): WireEmailPayload<string | string[]> {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return data as unknown as WireEmailPayload<string | string[]>
  }
  const { markup, replyTo, headers, ...rest } = data
  const html = markup ? render(markup) : data.html

  return {
    ...rest,
    ...(html !== undefined && { html }),
    ...(replyTo !== undefined && { reply_to: replyTo }),
    ...(headers !== undefined && { headers })
  }
}

export function toBulkWirePayload(data: { emails: SendBulkEmailOptions[] }): unknown {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return data
  }

  return {
    ...data,
    emails: Array.isArray(data.emails) ? data.emails.map(toWirePayload) : data.emails
  }
}
