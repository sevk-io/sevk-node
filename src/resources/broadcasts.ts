import { BaseResource } from "./base"
import type {
  ActiveBroadcast,
  Broadcast,
  BroadcastAnalytics,
  BroadcastCostEstimate,
  BroadcastRecipientEstimate,
  BroadcastRecipientEstimateInput,
  BroadcastStatusResponse,
  BroadcastSummary,
  BroadcastWithVariants,
  CreateBroadcastOptions,
  ListBroadcastEmailsResponse,
  ListBroadcastsOptions,
  ListBroadcastsResponse,
  TestBroadcastOptions,
  UpdateBroadcastOptions,
  UpdateBroadcastResponse
} from "./broadcasts/types"

export * from "./broadcasts/types"

/**
 * Broadcasts resource. Compose, schedule, and send one-to-many email
 * campaigns. Includes A/B testing, per-broadcast tracking overrides,
 * and live status / analytics.
 *
 * Access via `sevk.broadcasts`.
 */
export class Broadcasts extends BaseResource {
  /**
   * List broadcasts in the project, paginated.
   *
   * @param options - Pagination, search, status filter.
   */
  async list(options?: ListBroadcastsOptions): Promise<ListBroadcastsResponse> {
    return this.client.get<ListBroadcastsResponse>("/broadcasts", options)
  }

  /**
   * Create a new broadcast. The broadcast lands in `DRAFT`; nothing is
   * queued until you call `send`.
   *
   * @param data - Broadcast fields.
   * @returns The created broadcast (DRAFT status).
   * @example
   * ```ts
   * const broadcast = await sevk.broadcasts.create({
   *   name: 'April newsletter',
   *   subject: 'What shipped this month',
   *   body: '<section><heading>Hi {{name}}</heading></section>',
   *   senderName: 'Example Team',
   *   domainId: '...',
   *   targetType: 'AUDIENCE',
   *   audienceId: '...'
   * });
   * ```
   */
  async create(data: CreateBroadcastOptions): Promise<BroadcastWithVariants> {
    return this.client.post<BroadcastWithVariants>("/broadcasts", data)
  }

  /**
   * Look up a broadcast by id. Includes counter fields and (when set)
   * A/B test variants.
   *
   * @param id - Broadcast id.
   */
  async get(id: string): Promise<Broadcast> {
    return this.client.get<Broadcast>(`/broadcasts/${id}`)
  }

  /**
   * Update a broadcast. Only DRAFT broadcasts can be updated; sending
   * or sent broadcasts are immutable.
   *
   * @param id - Broadcast id.
   * @param data - Fields to change.
   * @throws 400 when the broadcast is not in `DRAFT`.
   */
  async update(
    id: string,
    data: UpdateBroadcastOptions
  ): Promise<UpdateBroadcastResponse> {
    return this.client.put<UpdateBroadcastResponse>(`/broadcasts/${id}`, data)
  }

  /**
   * Delete a broadcast. Allowed in `DRAFT`, `CANCELLED`, and `FAILED`
   * states.
   *
   * @param id - Broadcast id.
   */
  async delete(id: string): Promise<{ id: string, deleted: true }> {
    return this.client.delete<{ id: string, deleted: true }>(
      `/broadcasts/${id}`
    )
  }

  /**
   * Trigger the send. If `scheduledAt` is in the future, the broadcast
   * transitions to `SCHEDULED`; otherwise it goes straight to
   * `STARTING` and begins fan-out.
   *
   * @param id - Broadcast id.
   * @returns The broadcast in its new state.
   */
  async send(id: string): Promise<BroadcastSummary> {
    return this.client.post<BroadcastSummary>(`/broadcasts/${id}/send`)
  }

  /**
   * Cancel a `SCHEDULED`, `STARTING`, or in-flight `SENDING` broadcast.
   * Refunds unsent recipients to the project balance.
   *
   * @param id - Broadcast id.
   * @returns The broadcast plus a count of cancelled queue jobs.
   */
  async cancel(
    id: string
  ): Promise<{ broadcast: BroadcastSummary, cancelledJobs: number }> {
    return this.client.post(`/broadcasts/${id}/cancel`)
  }

  /**
   * Send a copy of the broadcast to one or more test addresses without
   * affecting the audience or counters.
   *
   * @param id - Broadcast id.
   */
  async test(
    id: string,
    data: { emails: string[] },
    options?: TestBroadcastOptions
  ): Promise<{ testEmails: number, message: 'Test emails queued for delivery' }> {
    return this.client.post(
      `/broadcasts/${id}/test`,
      data,
      options?.idempotencyKey !== undefined
        ? { "Idempotency-Key": options.idempotencyKey }
        : undefined
    )
  }

  /**
   * Aggregate analytics (open / click / bounce / unsubscribe rates) for
   * a sent broadcast.
   *
   * @param id - Broadcast id.
   */
  async analytics(id: string): Promise<BroadcastAnalytics> {
    return this.client.get<BroadcastAnalytics>(`/broadcasts/${id}/analytics`)
  }

  /**
   * Live status with progress / schedule / completion blocks. Suitable
   * for polling a "sending..." UI.
   *
   * @param id - Broadcast id.
   */
  async status(id: string): Promise<BroadcastStatusResponse> {
    return this.client.get<BroadcastStatusResponse>(`/broadcasts/${id}/status`)
  }

  /**
   * List the per-recipient email rows produced by this broadcast.
   *
   * @param id - Broadcast id.
   * @param options - Pagination.
   */
  async emails(
    id: string,
    options?: {
      page?: number
      limit?: number
      after?: string
      before?: string
    }
  ): Promise<ListBroadcastEmailsResponse> {
    return this.client.get<ListBroadcastEmailsResponse>(
      `/broadcasts/${id}/emails`,
      options
    )
  }

  /**
   * Preview the cost of sending this broadcast given the current
   * resolved recipient count and project balance. Useful for confirming
   * "are we about to over-spend?" before calling `send`.
   *
   * @param id - Broadcast id.
   */
  async estimateCost(id: string): Promise<BroadcastCostEstimate> {
    return this.client.get<BroadcastCostEstimate>(
      `/broadcasts/${id}/estimate-cost`
    )
  }

  /** Resolve the current subscribed recipient count for a broadcast target. */
  async estimateRecipients(
    data: BroadcastRecipientEstimateInput
  ): Promise<BroadcastRecipientEstimate> {
    return this.client.post<BroadcastRecipientEstimate>(
      "/broadcasts/estimate-recipients",
      data
    )
  }

  /**
   * List broadcasts that are currently `STARTING`, `SENDING`, or
   * `CANCELLING`. Useful for a dashboard "in-flight broadcasts" tile.
   */
  async active(): Promise<{ items: ActiveBroadcast[], total: number }> {
    return this.client.get("/broadcasts/active")
  }
}
