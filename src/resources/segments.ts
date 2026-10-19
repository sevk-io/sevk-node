import { BaseResource } from "./base"

/**
 * Field a segment rule can match. Built-in contact fields are listed
 * literally; arbitrary metadata is referenced via `data.<key>` (e.g.
 * `data.plan`, `data.country`).
 */
export type SegmentRuleField =
  | "email"
  | "subscribed"
  | "data"
  | "unsubscribedAt"
  | "unsubscribedBy"
  | "resubscriptionLocked"
  | "bounceCount"
  | "lastBouncedAt"
  | "createdAt"
  | "updatedAt"
  | `data.${string}`

/**
 * Comparison operator. `isEmpty` and `isNotEmpty` ignore the rule's
 * `value`; the rest require one. `in` and `notIn` expect an array.
 */
export type SegmentRuleOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "greaterOrEqual"
  | "lessOrEqual"
  | "isEmpty"
  | "isNotEmpty"
  | "in"
  | "notIn"

/** A single condition within a segment. */
export interface SegmentRule {
  /** Field to match. Use `data.<key>` for arbitrary contact metadata. */
  field: SegmentRuleField
  /** Comparison operator. `isEmpty`/`isNotEmpty` ignore `value`; `in`/`notIn` expect an array. */
  operator: SegmentRuleOperator
  /** Comparison value. Type depends on `field` and `operator`. Ignored for `isEmpty`/`isNotEmpty`. */
  value: unknown
  /** When the rule belongs to a group, this is the group id. */
  groupId?: string
  /** Accepted but ignored at evaluation time; combining is controlled by the segment-level `operator` and each group's `operator`. */
  groupOperator?: "AND" | "OR"
}

/** Optional grouping that lets you combine rules with mixed AND/OR semantics. */
export interface SegmentGroup {
  /** Group id (referenced by `SegmentRule.groupId`). */
  id: string
  /** How rules within this group combine. */
  operator: "AND" | "OR"
}

/** A saved segment definition. Re-evaluated lazily; cached count surfaced as `lastRunCount`. */
export interface Segment {
  id: string
  name: string
  rules: SegmentRule[]
  /** How top-level rules/groups combine. */
  operator: "AND" | "OR"
  /** When non-empty, restricts matches to contacts that are a member of at least one of these topics. */
  limitToTopics: string[]
  groups: SegmentGroup[] | null
  audienceId: string
  createdAt: string
  updatedAt: string
  lastRunAt: string | null
  /** Cached count from the last `calculate` run. */
  lastRunCount: number | null
}

export interface CreateSegmentOptions {
  /** Display name. */
  name: string
  /** Rule list. Each rule matches a single field with a single operator. */
  rules: SegmentRule[]
  /** How top-level rules/groups combine. `AND` requires all to match; `OR` requires any. */
  operator: "AND" | "OR"
  /** Optional topic id list. When set, the contact must be a member of at least one of these topics in addition to matching the rules. */
  limitToTopics?: string[]
  /** Optional groups for mixed AND/OR (advanced). */
  groups?: SegmentGroup[]
}

export interface UpdateSegmentOptions {
  name?: string
  rules?: SegmentRule[]
  operator?: "AND" | "OR"
  limitToTopics?: string[]
  groups?: SegmentGroup[]
}

/** Body for `segments.preview`. Same shape as `create`, minus the name. */
export interface PreviewSegmentOptions {
  rules: SegmentRule[]
  operator: "AND" | "OR"
  limitToTopics?: string[]
  groups?: SegmentGroup[]
}

export interface PreviewSegmentResponse {
  /** Total contacts that would match. */
  count: number
  /** First page of matching contacts (capped by the API). */
  contacts: Array<{
    id: string
    email: string
    subscribed: boolean
    data: Record<string, unknown> | null
    createdAt: string
  }>
}

export interface CalculateSegmentResponse {
  /** Refreshed contact count. */
  count: number
  segmentId: string
  segmentName: string
  /** Timestamp of this calculation. */
  lastRunAt: string
}

export interface ListSegmentsOptions {
  /** Offset mode: 1-based page number. Mutually exclusive with `after`. */
  page?: number
  /** Page size. 1 to 100. Default 20. */
  limit?: number
  /** Cursor mode: id of the last item from the previous page. Mutually exclusive with `page`. */
  after?: string
  /** Cursor mode (backward direction): id of the first item from the current page. Mutually exclusive with `page`. */
  before?: string
  /** Substring match on `name`. */
  search?: string
}

/**
 * Paginated response. Shape varies by mode (offset sets
 * `total/page/totalPages`; cursor sets `hasMore/nextCursor/prevCursor`).
 */
export interface ListSegmentsResponse {
  items: Segment[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/**
 * Segments resource. Define rule-based contact filters scoped to an
 * audience and use them as broadcast targets.
 *
 * Access via `sevk.segments`. Segments are scoped to an audience: `list`,
 * `create`, and `preview` take an `audienceId`; the rest take a segment
 * id directly.
 */
export class Segments extends BaseResource {
  /**
   * List segments within an audience.
   *
   * @param audienceId - Parent audience id.
   * @param options - Pagination and search.
   */
  async list(
    audienceId: string,
    options?: ListSegmentsOptions
  ): Promise<ListSegmentsResponse> {
    return this.client.get<ListSegmentsResponse>(
      `/audiences/${audienceId}/segments`,
      options
    )
  }

  /**
   * Create a segment.
   *
   * @param audienceId - Parent audience id.
   * @param data - Segment fields.
   * @example
   * ```ts
   * await sevk.segments.create(audience.id, {
   *   name: 'Pro users',
   *   operator: 'AND',
   *   rules: [
   *     { field: 'subscribed', operator: 'equals', value: true },
   *     { field: 'data.plan', operator: 'equals', value: 'pro' }
   *   ]
   * });
   * ```
   */
  async create(
    audienceId: string,
    data: CreateSegmentOptions
  ): Promise<Segment> {
    return this.client.post<Segment>(`/audiences/${audienceId}/segments`, data)
  }

  /**
   * Test rules against the audience without saving the segment. Use
   * this to drive a "preview count" UI before the user clicks save.
   *
   * @param audienceId - Parent audience id.
   * @param data - Same shape as `create`, minus the name.
   * @returns `count` of matching contacts plus the first page of matches.
   */
  async preview(
    audienceId: string,
    data: PreviewSegmentOptions
  ): Promise<PreviewSegmentResponse> {
    return this.client.post<PreviewSegmentResponse>(
      `/audiences/${audienceId}/segments/preview`,
      data
    )
  }

  /**
   * Look up a segment by id.
   *
   * @param id - Segment id.
   */
  async get(id: string): Promise<Segment> {
    return this.client.get<Segment>(`/segments/${id}`)
  }

  /**
   * Update segment rules, name, or grouping.
   *
   * @param id - Segment id.
   * @param data - Fields to change. Unset fields keep their previous value.
   */
  async update(id: string, data: UpdateSegmentOptions): Promise<Segment> {
    return this.client.put<Segment>(`/segments/${id}`, data)
  }

  /**
   * Delete a segment. Does not affect already-sent broadcasts.
   *
   * @param id - Segment id.
   */
  async delete(id: string): Promise<{ id: string, deleted: true }> {
    return this.client.delete<{ id: string, deleted: true }>(`/segments/${id}`)
  }

  /**
   * Re-evaluate the segment and refresh `lastRunCount` / `lastRunAt`.
   * Broadcasts targeting the segment evaluate at send time regardless,
   * so calling this is mostly useful for keeping the dashboard count
   * accurate.
   *
   * @param id - Segment id.
   */
  async calculate(id: string): Promise<CalculateSegmentResponse> {
    return this.client.get<CalculateSegmentResponse>(
      `/segments/${id}/calculate`
    )
  }
}
