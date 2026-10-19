export type EmailStatus =
  | "PENDING"
  | "SCHEDULED"
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "OPENED"
  | "COMPLAINT"
  | "FAILED"
  | "SUPPRESSED"
  | "CANCELLED"
export type EmailType = "MARKETING" | "TRANSACTIONAL"

/**
 * File attachment for an outgoing email.
 *
 * Per email sevk accepts up to 10 attachments and a combined size of
 * 10 MB. Set `cid` for inline images referenced from the HTML body via
 * `<img src="cid:...">` (e.g. `cid: 'logo'` pairs with
 * `<img src="cid:logo" />` in the body).
 */
export interface EmailAttachment {
  /** File name including extension, e.g. `receipt.pdf`. Cannot contain CR/LF or path separators. */
  filename: string
  /** Base64-encoded file contents. */
  content: string
  /** MIME type, e.g. `application/pdf`. */
  contentType: string
  /** Optional Content-ID for inline images. Reference it from HTML as `<img src="cid:...">`. */
  cid?: string
}

/**
 * Per-send override for open and click tracking. Each field is optional;
 * when omitted, the sending domain's default applies. Useful when you
 * want a single transactional email to opt out of tracking without
 * changing domain-wide settings.
 */
export interface EmailTrackingOptions {
  /** Override open tracking (1x1 pixel). `true` enables, `false` disables, `undefined` falls back to the domain default. */
  open?: boolean
  /** Override click tracking (link rewriting). `true` enables, `false` disables, `undefined` falls back to the domain default. */
  click?: boolean
}

export type EmailHeaders = Record<string, string>

/** Fields shared by single and bulk email sends. */
export interface EmailContentOptions {
  /** Sender. Plain (`hello@example.com`) or named (`Example <hello@example.com>`) format. Must be on a verified domain in the project. */
  from: string
  /** Subject line (up to 2000 chars). Sent verbatim. */
  subject: string
  /** HTML body. Used verbatim. Provide one of `html`, `text`, or `markup`. */
  html?: string | null
  /** Plain text body. Provide one of `html`, `text`, or `markup`. */
  text?: string | null
  /** sevk markup body. Rendered to HTML locally before sending. */
  markup?: string
  /** Reply-To address(es). Where replies should land. */
  replyTo?: string | string[]
  /** Cc recipient(s). */
  cc?: string | string[]
  /** Bcc recipient(s). */
  bcc?: string | string[]
  /** File attachments. Max 10 files, 10 MB total per send. */
  attachments?: EmailAttachment[]
  /** Per-send open/click tracking overrides. When omitted, the domain default applies. */
  tracking?: EmailTrackingOptions
  headers?: EmailHeaders
}

export type EmailBodyOptions =
  | { html: string, text?: string | null, markup?: string }
  | { html?: string | null, text: string, markup?: string }
  | { html?: string | null, text?: string | null, markup: string }

/**
 * Body of a single email. If `markup` is set, the SDK renders it to
 * HTML locally before sending.
 */
export type SendEmailOptions = EmailContentOptions & EmailBodyOptions & {
  /** Recipient(s). An array sends the same email to multiple addresses. */
  to: string | string[]
  /** rfc 3339 delivery time, up to 30 days ahead. scheduled sends cannot include attachments. */
  scheduledAt?: string
}

/** new delivery time for an email that is still scheduled and unattempted. */
export interface UpdateScheduledEmailOptions {
  /** rfc 3339 delivery time, up to 30 days ahead. */
  scheduledAt: string
}

export interface ScheduledEmailMutationResponse {
  id: string
}

export type SendBulkEmailOptions = EmailContentOptions & EmailBodyOptions & {
  to: string
}

export type SendEmailResponse =
  | { id: string, ids?: never }
  | { id?: never, ids: string[] }

/** Result of `emails.sendBulk`. Aggregate counters plus per-entry errors. */
export interface SendBulkEmailResponse {
  /** Number of entries successfully enqueued. */
  success: number
  /** Number of entries that failed during processing. Entries fail independently. */
  failed: number
  /** Email ids of the successful entries, in input order. */
  ids: string[]
  /** Per-entry errors. Omitted when no entry failed. */
  errors?: Array<{
    /** Index of the failed entry in the input `emails` array. */
    index: number
    /** Recipient address from the failed entry. */
    email: string
    /** Human-readable failure reason. */
    error: string
  }>
}

/** Persisted email record returned by `emails.get`. */
export interface Email {
  id: string
  /** sevk-issued Message-ID (bare `uuid@domain`, without angle brackets). Stable from queue time. */
  messageId: string | null
  /** SES-issued provider Message-ID. May be `null` until the send is accepted upstream. */
  providerMessageId: string | null
  from: string | null
  to: string | null
  subject: string | null
  body: string | null
  text: string | null
  /** Lifecycle status (e.g. `PENDING`, `SENT`, `DELIVERED`, `OPENED`, `BOUNCED`, `FAILED`, `SUPPRESSED`). */
  status: EmailStatus
  /** `MARKETING` for broadcast-driven sends, `TRANSACTIONAL` for API/SMTP sends. */
  type: EmailType
  userAgent: string | null
  contactId: string | null
  broadcastId: string | null
  /** Set when the email was sent as part of an A/B test variant. */
  broadcastVariantId: string | null
  projectId: string
  openedAt: string | null
  clickedAt: string | null
  unsubscribedAt: string | null
  scheduledAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Per-call options passed as a second argument to `send` and `sendBulk`.
 */
export interface SendOptions {
  /**
   * Optional client-supplied key (1-255 ASCII characters) that makes a
   * send safe to retry. sevk caches the first successful response for
   * 24 hours and replays it on any retry within the window with the
   * same key and identical request payload.
   *
   * Pick a stable string derived from the underlying event (an invoice
   * id, a webhook event id, a cron run id) so retries always produce
   * the same key. A UUID generated at retry time defeats the point.
   *
   * Reusing the key with a different payload returns 409. Concurrent
   * in-flight retries also return 409 until the first one finishes.
   */
  idempotencyKey?: string
}
