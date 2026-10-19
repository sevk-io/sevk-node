import { BaseResource } from "./base"
import type {
  AddInboundBlocklistOptions,
  CreateInboundRouteOptions,
  InboundAttachmentDownload,
  InboundBlocklistEntry,
  InboundBlocklistListPage,
  InboundEmail,
  InboundListPage,
  InboundQuota,
  InboundRoute,
  InboundRouteListPage,
  InboundSecurityConfig,
  InboundStats,
  ListInboundBlocklistOptions,
  ListInboundOptions,
  ListInboundRouteOptions,
  UpdateInboundQuotaOptions,
  UpdateInboundRouteOptions,
  UpdateInboundSecurityOptions
} from "./inbound/types"

export * from "./inbound/types"

/**
 * Inbound resource. Read incoming mail, manage per-project inbound
 * settings (routes, blocklist, quota, security), and download
 * attachments via short-lived URLs.
 *
 * Access via `sevk.inbound`. Requires an API key with `inbound:read`,
 * `inbound:write`, or `inbound:delete` capabilities depending on the
 * call.
 */
export class Inbound extends BaseResource {
  /**
   * List received email with optional pagination and filtering.
   */
  async list(options: ListInboundOptions = {}): Promise<InboundListPage> {
    return this.client.get("/inbound", options)
  }

  /**
   * Retrieve a received email with parsed content and attachments.
   */
  async get(id: string): Promise<InboundEmail> {
    return this.client.get(`/inbound/${id}`)
  }

  /**
   * Delete a received email and its stored attachments.
   */
  async delete(id: string): Promise<{ id: string; deleted: true }> {
    return this.client.delete<{ id: string; deleted: true }>(`/inbound/${id}`)
  }

  /**
   * Return inbound processing statistics, optionally for one domain.
   */
  async stats(domainId?: string): Promise<InboundStats>
  async stats(options?: { domainId?: string }): Promise<InboundStats>
  async stats(
    input?: string | { domainId?: string }
  ): Promise<InboundStats> {
    const domainId = typeof input === "string" ? input : input?.domainId

    return this.client.get(
      "/inbound/stats",
      domainId ? { domainId } : undefined
    )
  }

  /**
   * Create a short-lived download URL for an inbound attachment.
   */
  async downloadAttachment(
    inboundEmailId: string,
    attachmentId: string
  ): Promise<InboundAttachmentDownload> {
    return this.client.get(
      `/inbound/${inboundEmailId}/attachments/${attachmentId}/download`
    )
  }

  /**
   * List rules used to store or forward matching inbound email.
   */
  async listRoutes(
    options: ListInboundRouteOptions = {}
  ): Promise<InboundRouteListPage> {
    return this.client.get("/inbound-settings/routes", options)
  }

  /** Return only routing rule items from the route response. */
  async routeItems(
    options: ListInboundRouteOptions = {}
  ): Promise<InboundRoute[]> {
    return (await this.listRoutes(options)).items
  }

  /** Retrieve an inbound routing rule by id. */
  async getRoute(id: string): Promise<InboundRoute> {
    return this.client.get(`/inbound-settings/routes/${id}`)
  }

  /** Create an inbound routing rule. */
  async createRoute(data: CreateInboundRouteOptions): Promise<InboundRoute> {
    return this.client.post("/inbound-settings/routes", data)
  }

  /** Update an inbound routing rule while preserving omitted fields. */
  async updateRoute(
    id: string,
    data: UpdateInboundRouteOptions
  ): Promise<InboundRoute> {
    return this.client.put(`/inbound-settings/routes/${id}`, data)
  }

  /** Delete a routing rule without deleting stored email. */
  async deleteRoute(id: string): Promise<{ id: string; deleted: true }> {
    return this.client.delete<{ id: string; deleted: true }>(
      `/inbound-settings/routes/${id}`
    )
  }

  /** List addresses currently blocked from inbound processing. */
  async listBlocklist(
    options: ListInboundBlocklistOptions = {}
  ): Promise<InboundBlocklistListPage> {
    return this.client.get("/inbound-settings/blocklist", options)
  }

  /** Return only entries from the inbound blocklist response. */
  async blocklistItems(
    options: ListInboundBlocklistOptions = {}
  ): Promise<InboundBlocklistEntry[]> {
    return (await this.listBlocklist(options)).items
  }

  /** Add an address to the inbound blocklist. */
  async addBlocklistEntry(
    data: AddInboundBlocklistOptions
  ): Promise<InboundBlocklistEntry> {
    return this.client.post("/inbound-settings/blocklist", data)
  }

  /** Remove an address from the inbound blocklist. */
  async removeBlocklistEntry(
    id: string
  ): Promise<{ id: string; deleted: true }> {
    return this.client.delete<{ id: string; deleted: true }>(
      `/inbound-settings/blocklist/${id}`
    )
  }

  /** Return inbound quota settings and current usage counters. */
  async getQuota(): Promise<InboundQuota> {
    return this.client.get("/inbound-settings/quota")
  }

  /** Update the inbound monthly limit while preserving omitted fields. */
  async updateQuota(data: UpdateInboundQuotaOptions): Promise<InboundQuota> {
    return this.client.put("/inbound-settings/quota", data)
  }

  /**
   * Clear a quota pause without resetting current-period usage.
   */
  async resetQuota(): Promise<InboundQuota> {
    return this.client.post("/inbound-settings/quota/reset")
  }

  /** Return effective inbound security settings for a domain. */
  async getSecurityConfig(domainId: string): Promise<InboundSecurityConfig> {
    return this.client.get(`/inbound-settings/security/${domainId}`)
  }

  /** Update inbound security settings for a domain. */
  async updateSecurityConfig(
    domainId: string,
    data: UpdateInboundSecurityOptions
  ): Promise<InboundSecurityConfig> {
    return this.client.put(`/inbound-settings/security/${domainId}`, data)
  }
}
