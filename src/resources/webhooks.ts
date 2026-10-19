import { BaseResource } from "./base"

/**
 * Event types sevk can deliver to a webhook endpoint. Subscribe to a
 * subset by listing them in `events`.
 */
export type WebhookEventType =
  | "email.sent"
  | "email.delivered"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.complained"
  | "email.rejected"
  | "email.delayed"
  | "email.rendering_failed"
  | "email.received"
  | "contact.subscribed"
  | "contact.unsubscribed"
  | "broadcast.started"
  | "broadcast.finished"

/** A configured webhook endpoint. */
export interface Webhook {
  id: string
  /** HTTPS URL sevk will POST events to. */
  url: string
  /** Subscribed event types. */
  events: WebhookEventType[]
  /** When `false`, deliveries are skipped (without removing the endpoint). */
  enabled: boolean
  /** Masked placeholder (`••••••••`) or null. It cannot verify signatures; `create()` and `rotate()` return usable `whsec_` secrets. */
  secret: "••••••••" | null
  /** Delivery failure counter. */
  failureCount: number
  lastFailureAt: string | null
  lastDeliveryAt: string | null
  /** Set when the endpoint was disabled after repeated failures. */
  disabledAt: string | null
  projectId: string
  createdAt: string
  updatedAt: string
}

/** Creation response whose usable signing secret is returned exactly once. */
export type CreatedWebhook = Omit<Webhook, "secret"> & { secret: string }

export interface RotateWebhookResponse {
  id: string
  secret: string
}

export interface CreateWebhookOptions {
  /** HTTPS URL sevk will POST events to. Must respond 2xx within the delivery timeout. */
  url: string
  /** Subscribed event types. */
  events: WebhookEventType[]
  /** Defaults to `true`. */
  enabled?: boolean
}

export interface UpdateWebhookOptions {
  url?: string
  events?: WebhookEventType[]
  enabled?: boolean
}

/** Metadata describing a single webhook event type. Returned by `events()`. */
export interface WebhookEventDefinition {
  name: string
  description: string
  category: "email" | "subscription" | "broadcast"
}

export interface WebhookEventsResponse {
  items: WebhookEventType[]
  events: Record<string, WebhookEventDefinition>
}

export interface ListWebhooksOptions {
  page?: number
  limit?: number
  after?: string
  before?: string
}

export interface ListWebhooksResponse {
  items: Webhook[]
  availableEvents: Record<string, WebhookEventDefinition>
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/**
 * Webhooks resource. Manage outbound HTTP webhook endpoints that
 * receive event deliveries from sevk.
 *
 * Access via `sevk.webhooks`.
 */
export class Webhooks extends BaseResource {
  /**
   * List webhook endpoints in the project. The response also includes
   * `availableEvents`, the catalog of event types that can be
   * subscribed to.
   *
   * @returns The response shape for the selected pagination mode.
   */
  async list(options?: ListWebhooksOptions): Promise<ListWebhooksResponse> {
    return this.client.get("/webhooks", options)
  }

  /**
   * Look up a webhook endpoint by id.
   *
   * @param id - Webhook id.
   */
  async get(id: string): Promise<Webhook> {
    return this.client.get(`/webhooks/${id}`)
  }

  /**
   * Create a webhook endpoint.
   *
   * @param data - Endpoint config.
   * @returns The created webhook (includes the signing `secret`).
   */
  async create(data: CreateWebhookOptions): Promise<CreatedWebhook> {
    return this.client.post("/webhooks", data)
  }

  /**
   * Update a webhook endpoint.
   *
   * @param id - Webhook id.
   * @param data - Fields to change.
   */
  async update(id: string, data: UpdateWebhookOptions): Promise<Webhook> {
    return this.client.put(`/webhooks/${id}`, data)
  }

  /**
   * Delete a webhook endpoint.
   *
   * @param id - Webhook id.
   */
  async delete(id: string): Promise<{ id: string, deleted: true }> {
    return this.client.delete<{ id: string, deleted: true }>(`/webhooks/${id}`)
  }

  /**
   * Send a synthetic test delivery to the endpoint. Use this to verify
   * URL reachability and HMAC signature handling in your handler.
   *
   * @param id - Webhook id.
   * @returns `{ success, status, statusText, message }` describing the test delivery.
   */
  async test(id: string): Promise<{
    success: boolean
    status: number
    statusText: string
    message: string
  }> {
    return this.client.post(`/webhooks/${id}/test`)
  }

  async rotate(id: string): Promise<RotateWebhookResponse> {
    return this.client.post(`/webhooks/${id}/rotate`)
  }

  /**
   * Get the catalog of event types and their descriptions. Useful when
   * building a UI that lets users pick which events to subscribe to.
   */
  async events(): Promise<WebhookEventsResponse> {
    return this.client.get("/webhooks/events")
  }
}
