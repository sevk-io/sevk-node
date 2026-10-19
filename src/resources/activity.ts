import { BaseResource } from "./base"

export type ActivityEventType = "EMAIL" | "SUBSCRIPTION"
export type ActivityAction =
  | "REQUESTED"
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "CLICKED"
  | "BOUNCED"
  | "COMPLAINT"
  | "FAILED"
  | "SUBSCRIBED"
  | "UNSUBSCRIBED"
  | "DELAYED"
  | "REJECTED"
export type ActivityCategory = ActivityEventType | "all"

/** A single row in the project activity log. */
export interface ActivityItem {
  id: string
  /** Top-level event family (`EMAIL` or `SUBSCRIPTION`). */
  eventType: ActivityEventType
  /** Specific action (e.g. `SENT`, `OPENED`, `BOUNCED`, `UNSUBSCRIBED`). */
  action: ActivityAction
  description: string | null
  /** Set when the activity ties to a specific email send. */
  emailId: string | null
  emailSubject: string | null
  contactId: string | null
  contactEmail: string | null
  broadcastId: string | null
  broadcastName: string | null
  /** URL when `action` is `CLICKED`. */
  link: string | null
  userAgent: string | null
  metadata: string | null
  createdAt: string
}

/** Query options for `activity.list`. */
export interface ListActivityOptions {
  /** Offset mode: 1-based page number. Mutually exclusive with `after`. */
  page?: number
  /** Page size. 1 to 100. Default 20. */
  limit?: number
  /** Cursor mode: id of the last item from the previous page. Mutually exclusive with `page`. */
  after?: string
  /** Cursor mode (backward direction): id of the first item from the current page. Mutually exclusive with `page`. */
  before?: string
  /** Filter by event family. `'all'` (default) returns every category. */
  category?: ActivityCategory
  /** Filter by specific action verb (e.g. `OPENED`, `CLICKED`). */
  type?: ActivityAction[]
  /** Restrict to events in the last N days (1-365). Defaults to 365; search is capped to 90 days. */
  days?: number
  /** Substring match on recipient email, email subject, and broadcast name. */
  search?: string
}

/**
 * Paginated response. Shape varies by mode (offset sets
 * `total/page/totalPages`; cursor sets `hasMore/nextCursor/prevCursor`).
 */
export interface ListActivityResponse {
  items: ActivityItem[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/** Aggregate counts and rates returned by `activity.stats`. */
export interface ActivityStatsResponse {
  totalEmails: number
  sentEmails: number
  deliveredEmails: number
  openedEmails: number
  clickedEmails: number
  bouncedEmails: number
  marketingEmails: number
  transactionalEmails: number
  /** Computed rates as percentages rounded to 2 decimals (`42` = 42%, `48.91` = 48.91%). */
  rates: {
    open: number
    click: number
    bounce: number
    delivery: number
  }
}

/**
 * Activity resource. Read the project-wide event log (sends, opens,
 * clicks, bounces, complaints, etc.) and aggregate stats.
 *
 * Access via `sevk.activity`.
 */
export class Activity extends BaseResource {
  /**
   * List activity rows, paginated.
   *
   * @param options - Pagination, filters, search.
   */
  async list(options?: ListActivityOptions): Promise<ListActivityResponse> {
    return this.client.get("/activity", options)
  }

  /**
   * Get aggregate counts and rates across the project's email history.
   * Use this for dashboard tiles.
   */
  async stats(): Promise<ActivityStatsResponse> {
    return this.client.get("/activity/stats")
  }
}
