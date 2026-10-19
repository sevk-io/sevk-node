import type { BroadcastLifecycleStatus } from "../broadcasts/types"
import type { EmailStatus } from "../emails/types"

export type InboundEmailStatus =
  "RECEIVED" | "PROCESSED" | "BOUNCED" | "BLOCKED" | "FAILED"

export type InboundBlocklistType = "EMAIL" | "DOMAIN" | "IP"

export interface InboundAttachment {
  id: string
  filename: string
  mimeType: string
  contentId: string | null
  size: number
  createdAt: string
}

export interface InboundReplyEmailSummary {
  id: string
  subject: string | null
  to: string | null
}

export interface InboundReplyBroadcastSummary {
  id: string
  name: string
}

/** Inbound email projection returned by list operations. */
export interface InboundEmailSummary {
  id: string
  messageId: string | null
  fromAddress: string
  toAddress: string
  subject: string | null
  status: InboundEmailStatus
  isSpam: boolean
  isVirus: boolean
  spamScore: number | null
  rawSize: number
  domainId: string | null
  replyToEmailId: string | null
  replyToBroadcastId: string | null
  receivedAt: string
  createdAt: string
  replyToEmail: InboundReplyEmailSummary | null
  replyToBroadcast: InboundReplyBroadcastSummary | null
}

export interface InboundEmail {
  id: string
  messageId?: string | null
  fromAddress: string
  toAddress: string
  ccAddresses?: string[]
  subject?: string | null
  status: InboundEmailStatus
  isSpam: boolean
  isVirus: boolean
  spamScore?: number | null
  rawSize: number
  domainId: string | null
  receivedAt: string
  createdAt: string
  inReplyTo?: string | null
  references?: string[]
  bodyText?: string | null
  bodyHtml?: string | null
  /** Parsed message headers. Present only on get. */
  headers?: unknown
  /** Present only on get. */
  projectId?: string
  /** Present only on get. */
  processedAt?: string | null
  /** Present only on get. */
  updatedAt?: string
  attachments?: InboundAttachment[]
  replyToEmailId?: string | null
  replyToBroadcastId?: string | null
  replyToEmail?: {
    id: string
    subject: string | null
    to: string | null
    messageId?: string | null
    from?: string | null
    status?: EmailStatus
    createdAt?: string
    broadcastId?: string | null
    contactId?: string | null
  } | null
  replyToBroadcast?: {
    id: string
    name: string
    subject?: string | null
    status?: BroadcastLifecycleStatus
    createdAt?: string
  } | null
}

export interface InboundStats {
  total: number
  counts: InboundStatsCounts
  received: number
  processed: number
  bounced: number
  blocked: number
  blocklistRejected: number
  spam: number
  failed: number
}

export interface InboundStatsCounts {
  RECEIVED: number
  PROCESSED: number
  BOUNCED: number
  BLOCKED: number
  FAILED: number
}

export interface InboundRoute {
  id: string
  projectId: string
  name: string
  pattern: string
  target: string
  priority: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateInboundRouteOptions {
  name: string
  pattern: string
  /** Email address to forward matching mail to. */
  target: string
  priority?: number
  enabled?: boolean
}

export type UpdateInboundRouteOptions = Partial<CreateInboundRouteOptions>

export interface ListInboundRouteOptions {
  page?: number
  limit?: number
  after?: string
  before?: string
}

export interface InboundRouteListPage {
  items: InboundRoute[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

export interface InboundBlocklistEntry {
  id: string
  projectId: string
  type: InboundBlocklistType
  value: string
  reason?: string | null
  createdAt: string
}

export interface AddInboundBlocklistOptions {
  type: InboundBlocklistType
  value: string
  reason?: string | null
}

export interface ListInboundBlocklistOptions {
  page?: number
  limit?: number
  after?: string
  before?: string
}

export interface InboundBlocklistListPage {
  items: InboundBlocklistEntry[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

export interface InboundQuota {
  projectId: string
  monthlyEmailLimit?: number | null
  monthlyEmailsUsed: number
  /** Per-project monthly free inbound allowance. `null` means no free tier on this project. */
  freeMonthlyInboundEmails: number | null
  /** Free inbound emails consumed this month; resets together with `monthlyEmailsUsed`. */
  freeEmailsUsed: number
  inboundEmailPrice: number
  resetAt: string
  pausedAt?: string | null
  pausedReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateInboundQuotaOptions {
  monthlyEmailLimit?: number | null
}

export interface InboundSecurityConfig {
  /** Present once a security config has been saved for the domain; until then platform defaults are returned. */
  id?: string
  domainId: string
  dmarcStrict: boolean
  spfRequired: boolean
  spamThreshold: number | null
  catchAllEnabled: boolean
  acceptedRecipients: string[]
  maxAttachmentSize: number
  allowedMimeTypes: string[]
  /** Present once a security config has been saved for the domain. */
  createdAt?: string
  /** Present once a security config has been saved for the domain. */
  updatedAt?: string
  /** Platform-level caps/availability, returned alongside the per-domain config. */
  platform: {
    maxAttachmentSizeCap: number
  }
}

export interface UpdateInboundSecurityOptions {
  dmarcStrict?: boolean
  spfRequired?: boolean
  spamThreshold?: number | null
  catchAllEnabled?: boolean
  acceptedRecipients?: string[]
  maxAttachmentSize?: number
  allowedMimeTypes?: string[]
}

export interface ListInboundOptions {
  page?: number
  limit?: number
  after?: string
  before?: string
  search?: string
  status?: InboundEmailStatus
  domainId?: string
  broadcastId?: string
  isSpam?: boolean
  isVirus?: boolean
}

export interface InboundListPage {
  items: InboundEmailSummary[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

export interface InboundAttachmentDownload {
  url: string
  filename: string
  mimeType: string
}
