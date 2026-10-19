import type { EmailStatus, EmailType } from "../emails/types"

export type BroadcastLifecycleStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "STARTING"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "CANCELLING"
  | "CANCELLED"

/** Cost preview for a broadcast. Returned by `estimateCost`. */
export interface BroadcastCostEstimate {
  /** Total estimated cost (paid emails only) in the project's currency. */
  estimatedCost: number
  /** Per-email price the project is charged. */
  emailPrice: number
  /** Resolved recipient count. */
  contactCount: number
  /** Project balance at the time of the estimate. */
  currentBalance: number
  /** Whether `currentBalance` covers `estimatedCost`. */
  hasSufficientBalance: boolean
  /** Additional balance required to cover the send. `0` when balance is sufficient. */
  shortfall: number
  /** Free-tier emails available to consume. */
  freeEmailsAvailable: number
  /** Free emails the send will actually consume. */
  freeEmailsToUse: number
  /** Recipients that will be charged at `emailPrice`. */
  paidEmailsCount: number
}

export interface BroadcastRecipientEstimateInput {
  targetType: "ALL" | "AUDIENCE" | "TOPIC" | "SEGMENT"
  audienceId?: string
  topicId?: string
  segmentId?: string
}

export interface BroadcastRecipientEstimate {
  count: number
}

/** Identifier pair for the contact behind a broadcast email row. `id` is `null` when the contact was deleted after the send. */
export interface BroadcastEmailContact {
  id: string | null
  email: string
}

/** A single email row produced by a broadcast send. Returned by `emails(id)`. */
export interface BroadcastEmail {
  id: string
  /** sevk-issued Message-ID. */
  messageId: string | null
  /** Recipient address. */
  to: string
  subject: string
  /** Lifecycle status (e.g. `PENDING`, `SENT`, `DELIVERED`, `OPENED`, `BOUNCED`, `SUPPRESSED`). */
  status: EmailStatus
  /** `MARKETING` | `TRANSACTIONAL`. */
  type: EmailType
  openedAt: string | null
  clickedAt: string | null
  unsubscribedAt: string | null
  createdAt: string
  contact: BroadcastEmailContact
}

/**
 * Paginated response. Shape varies by mode (offset sets
 * `total/page/totalPages`; cursor sets `hasMore/nextCursor/prevCursor`).
 */
export interface ListBroadcastEmailsResponse {
  items: BroadcastEmail[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/** Surfaced when failure rate during sending crosses a threshold. */
export interface BroadcastStatusWarning {
  type: "FAILED_EMAILS"
  message: string
  failedCount: number
}

/** Mid-send progress info from `status(id)`. */
export interface BroadcastStatusProgress {
  /** 0-100. */
  percentage: number
  emailsSent: number
  totalContacts: number
  pendingEmails: number
  /** Human-readable ETA, e.g. `~5 minutes`. `null` when it cannot be estimated. */
  estimatedTimeRemaining: string | null
}

/** Schedule info from `status(id)`. */
export interface BroadcastStatusSchedule {
  scheduledAt: string | null
  /** Milliseconds until the scheduled send. */
  timeUntilSend: number
  /** Human-readable countdown when `scheduledAt` is in the future. */
  willSendIn: string
  /** `true` when `scheduledAt` is in the past but the broadcast has not started yet. */
  isPastDue: boolean
}

/** Completion summary from `status(id)` (set after `SENT`). */
export interface BroadcastStatusCompletion {
  completedAt: string | null
  totalEmailsSent: number
  /** Percentage (0-100) of recipients that were actually sent. */
  successRate: number
}

/** Rich status response with progress / schedule / completion blocks. */
export interface BroadcastStatusResponse {
  id: string
  name: string
  status: BroadcastLifecycleStatus
  totalContacts: number
  emailsSent: number
  failedEmails: number
  pendingEmails: number
  createdAt: string
  sentAt: string | null
  completedAt: string | null
  scheduledAt: string | null
  /** When the actual fan-out started (after `STARTING`). */
  sendingStartedAt?: string
  /** Machine-readable name of the current send phase (e.g. `calculating-recipients`, `fanning-out`). */
  step?: string
  stepLabel?: string
  stepIndex?: number
  stepTotal?: number
  /** Percentage (0-100) within the current step. */
  stepProgress?: number
  warning?: BroadcastStatusWarning
  progress?: BroadcastStatusProgress
  schedule?: BroadcastStatusSchedule
  completion?: BroadcastStatusCompletion
}

/** Aggregate analytics for a broadcast. Returned by `analytics(id)`. */
export interface BroadcastAnalytics {
  totalEmails: number
  sentEmails: number
  deliveredEmails: number
  openedEmails: number
  clickedEmails: number
  /** Total click events (a single recipient can click multiple times). */
  totalClicks: number
  bouncedEmails: number
  failedEmails: number
  unsubscribedEmails: number
  /** All rates are percentages (e.g. 48.88 means 48.88%). */
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubscribeRate: number
}

/** A variant in an A/B-tested broadcast. Returned in `Broadcast.variants`. */
export interface BroadcastVariant {
  id: string
  broadcastId: string
  /** Display label (`A`, `B`, etc.). */
  label: string
  /** Subject override for this variant (null when the broadcast subject is used). */
  subject: string | null
  /** Body override for this variant (null when the broadcast body is used). */
  body: string | null
  /** Sender name override for this variant. */
  fromName: string | null
  totalContacts: number
  sentCount: number
  failedCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  bouncedCount: number
  complainedCount: number
  unsubscribedCount: number
  /** `true` once the evaluator picks this variant as the winner. */
  isWinner: boolean
  createdAt: string
  updatedAt: string
}

/** A/B test config and runtime state. Returned in `Broadcast.abTest`. */
export interface BroadcastAbTest {
  id: string
  broadcastId: string
  /** Percentage of the audience that goes into the test phase (5-50). */
  testPercent: number
  /** Wait this many minutes after the test phase finishes before evaluating (5-4320). */
  evalAfterMinutes: number
  /** Set when the evaluator has been scheduled. */
  scheduledEvalAt: string | null
  /** Metric used to pick the winner. */
  winnerMetric: "OPEN_RATE" | "CLICK_RATE"
  /** Set after evaluation. */
  winnerVariantId: string | null
  evaluatedAt: string | null
  /** Test lifecycle. */
  status:
    | "SCHEDULED"
    | "TESTING"
    | "EVALUATING"
    | "ROLLING_OUT"
    | "COMPLETED"
    | "FAILED"
  createdAt: string
  updatedAt: string
}

/** A single variant on the way in (create/update). */
export interface VariantInput {
  /** Display label (`A`, `B`). Must be unique within the broadcast. */
  label: string
  /** Subject override. Optional; at least one of subject/body/fromName must be set. */
  subject?: string
  /** Body override. */
  body?: string
  /** Sender name override. */
  fromName?: string
}

/** A/B test config on the way in (create/update). */
export interface AbTestConfigInput {
  /** Percent of the audience that goes into the test phase (5-50). */
  testPercent: number
  /** Minutes to wait after the test phase finishes before evaluating (5-4320). */
  evalAfterMinutes: number
  /** Metric used to pick the winner. Defaults to `OPEN_RATE`. */
  winnerMetric?: "OPEN_RATE" | "CLICK_RATE"
}

/** Snapshot of the target audience, included on list/get/create/update. */
export interface BroadcastAudienceRef {
  id: string
  name: string
  contactsCount: number
  subscribedContactsCount: number
  broadcastsCount: number
  topicsCount: number
  segmentsCount: number
}

/** Snapshot of the target topic, included on list/get/create/update. */
export interface BroadcastTopicRef {
  id: string
  name: string
  contactsCount: number
  subscribedContactsCount: number
  broadcastsCount: number
}

/** Snapshot of the target segment, included on list/get/create/update. */
export interface BroadcastSegmentRef {
  id: string
  name: string
}

/** Snapshot of the sending domain, included on list/get/create/update. */
export interface BroadcastDomainRef {
  id: string
  domain: string
  senderName: string | null
  verified: boolean
}

/** Complete broadcast projection returned by get operations. */
export interface Broadcast {
  id: string
  name: string
  subject: string
  body: string
  /** `MARKUP` is rendered server-side; `HTML` is used verbatim. */
  style: "MARKUP" | "HTML"
  status: BroadcastLifecycleStatus
  /** Who receives the broadcast. */
  targetType: "ALL" | "AUDIENCE" | "TOPIC" | "SEGMENT"
  audienceId: string | null
  topicId: string | null
  segmentId: string | null
  email: string | null
  senderName: string | null
  /** Custom Reply-To address. Mutually exclusive with `replyToInbound`. */
  replyTo: string | null
  /** When true, sevk generates an inbound reply-to address so replies are tracked. */
  replyToInbound: boolean
  domainId: string | null
  scheduledAt: string | null
  sentAt: string | null
  completedAt: string | null
  delivered: string | null
  includeListUnsubscribeHeader: boolean
  /** Per-broadcast open tracking override. `null` inherits the domain default. */
  openTracking: boolean | null
  /** Per-broadcast click tracking override. `null` inherits the domain default. */
  clickTracking: boolean | null
  projectId: string
  createdAt: string
  updatedAt: string
  /** Target audience snapshot. `null` when the broadcast has no audience target. */
  audience: BroadcastAudienceRef | null
  /** Target topic snapshot. `null` when the broadcast has no topic target. */
  topic: BroadcastTopicRef | null
  /** Target segment snapshot. `null` when the broadcast has no segment target. */
  segment: BroadcastSegmentRef | null
  /** Sending domain snapshot. `null` when the domain was deleted. */
  domain: BroadcastDomainRef | null
  estimatedCost: string | null
  actualCost: string | null
  /** Resolved recipient count at send time. */
  totalContacts: number
  sentCount: number
  failedCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  bouncedCount: number
  complainedCount: number
  unsubscribedCount: number
  variants: BroadcastVariant[]
  abTest: BroadcastAbTest | null
}

type BroadcastMetricField =
  | "estimatedCost"
  | "actualCost"
  | "totalContacts"
  | "sentCount"
  | "failedCount"
  | "deliveredCount"
  | "openedCount"
  | "clickedCount"
  | "bouncedCount"
  | "complainedCount"
  | "unsubscribedCount"

type BroadcastVariantField = "variants" | "abTest"

/** Fields shared by every persisted broadcast projection. */
export type BroadcastBase = Omit<
  Broadcast,
  BroadcastMetricField | BroadcastVariantField
>

/** Broadcast projection with delivery counters, returned by list and send operations. */
export type BroadcastSummary = Omit<Broadcast, BroadcastVariantField>

/** Broadcast projection with A/B configuration, returned by create operations. */
export type BroadcastWithVariants = Omit<Broadcast, BroadcastMetricField>

/** Update projection: experiment state is present together or omitted together. */
export type BroadcastUpdate = BroadcastBase & {
  variants?: BroadcastVariant[]
  abTest?: BroadcastAbTest | null
}

export type UpdateBroadcastResponse = BroadcastUpdate

/** Per-call options for sending a test broadcast safely across retries. */
export interface TestBroadcastOptions {
  idempotencyKey?: string
}

export interface CreateBroadcastOptions {
  /** Internal label (1-255 chars). Not shown to recipients. */
  name: string
  /** Subject line (1-255 chars). Supports template variables like `{{name}}`. */
  subject: string
  /** Body. Interpretation depends on `style`. Defaults to an empty string. */
  body?: string
  /** Defaults to `MARKUP`. */
  style?: "MARKUP" | "HTML"
  /** Who receives the broadcast. Defaults to `AUDIENCE`. */
  targetType?: "ALL" | "AUDIENCE" | "TOPIC" | "SEGMENT"
  /** Required when `targetType` is `AUDIENCE`. */
  audienceId?: string
  /** Required when `targetType` is `TOPIC`. */
  topicId?: string
  /** Required when `targetType` is `SEGMENT`. */
  segmentId?: string
  /** Display name shown in the recipient inbox. */
  senderName: string
  /** From address. Falls back to `no-reply@<domain>` when omitted. */
  email?: string
  /** Custom Reply-To address. Mutually exclusive with `replyToInbound`. */
  replyTo?: string
  /** When true, sevk generates an inbound reply-to address (requires an inbound-enabled, verified domain). */
  replyToInbound?: boolean
  /** Sending domain id. Must be verified before send. */
  domainId: string
  /** ISO 8601. Setting this alone does not schedule the send; you still need to call `send`. */
  scheduledAt?: string
  /** Whether to include RFC 8058 List-Unsubscribe headers. Defaults to `true`. */
  includeListUnsubscribeHeader?: boolean
  /** Per-broadcast open tracking override. `null` (default) inherits the domain default. */
  openTracking?: boolean | null
  /** Per-broadcast click tracking override. `null` (default) inherits the domain default. */
  clickTracking?: boolean | null
  /** A/B test variants (2-4). Must be supplied together with `abTest`. */
  variants?: VariantInput[]
  /** A/B test config. Must be supplied together with `variants`. */
  abTest?: AbTestConfigInput
}

export interface UpdateBroadcastOptions {
  name?: string
  subject?: string
  body?: string
  style?: "MARKUP" | "HTML"
  targetType?: "ALL" | "AUDIENCE" | "TOPIC" | "SEGMENT"
  audienceId?: string | null
  topicId?: string | null
  segmentId?: string | null
  senderName?: string
  email?: string
  /** Custom Reply-To address. Pass `null` to clear. Mutually exclusive with `replyToInbound`. */
  replyTo?: string | null
  /** When true, sevk generates an inbound reply-to address (requires an inbound-enabled, verified domain). */
  replyToInbound?: boolean
  domainId?: string
  /** Pass `null` to clear an existing schedule. */
  scheduledAt?: string | null
  includeListUnsubscribeHeader?: boolean
  openTracking?: boolean | null
  clickTracking?: boolean | null
  /** Pass `null` to clear the A/B config (together with `abTest: null`). */
  variants?: VariantInput[] | null
  /** Update or attach an A/B test config. Pass `null` to clear it (together with `variants: null`). */
  abTest?: AbTestConfigInput | null
}

export interface ListBroadcastsOptions {
  /** Offset mode: 1-based page number. Mutually exclusive with `after`. */
  page?: number
  /** Page size. 1 to 100. Default 20. */
  limit?: number
  /** Cursor mode: id of the last item from the previous page. Mutually exclusive with `page`. */
  after?: string
  /** Cursor mode (backward direction): id of the first item from the current page. Mutually exclusive with `page`. */
  before?: string
  /** Substring match on `name` and `subject`. */
  search?: string
  /** Filter by status. */
  status?: BroadcastLifecycleStatus
}

/**
 * Paginated response. Shape varies by mode (offset sets
 * `total/page/totalPages`; cursor sets `hasMore/nextCursor/prevCursor`).
 */
export interface ListBroadcastsResponse {
  items: BroadcastSummary[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/** Lean in-flight broadcast projection returned by `active()`. */
export interface ActiveBroadcast {
  id: string
  name: string
  status: BroadcastLifecycleStatus
  sentCount: number
  failedCount: number
  totalContacts: number
  scheduledAt: string | null
  abTest: {
    status:
      | "SCHEDULED"
      | "TESTING"
      | "EVALUATING"
      | "ROLLING_OUT"
      | "COMPLETED"
      | "FAILED"
    scheduledEvalAt: string | null
    testPercent: number
  } | null
}
