import { BaseResource } from "./base"

export type OutboundPauseReason =
  "monthly_cap_exhausted" | "manual_suspend" | "balance_exhausted" | string

export interface OutboundQuota {
  projectId: string
  /** Self-imposed monthly cap set by the project owner. `null` means no user-set cap. */
  monthlyEmailLimit: number | null
  /** Admin-set monthly ceiling enforced by sevk for this project. `null` means no admin ceiling. */
  adminMonthlyEmailLimit: number | null
  /**
   * the lower configured cap; the caps use separate counters after a reset.
   * use `monthlyRemaining` for the remaining allowance.
   */
  effectiveMonthlyEmailLimit: number | null
  /**
   * Outbound emails used this month via `POST /emails` and the SMTP relay.
   * Broadcasts are billed separately and do not count toward this. Resets at
   * the start of the next monthly window.
   */
  monthlyEmailsUsed: number
  limitEmailsUsed: number
  monthlyRemaining: number | null
  /** per-project monthly free outbound allowance; `null` means no free tier. */
  freeMonthlyEmails: number | null
  /** Free outbound emails consumed this month; resets together with `monthlyEmailsUsed`. */
  freeEmailsUsed: number
  /** Per-second send rate ceiling. `null` means no per-second limit. */
  rateLimit: number | null
  /** Per-billable-email price in USD. */
  emailPrice: number
  resetAt: string
  pausedAt: string | null
  pausedReason: OutboundPauseReason | null
  createdAt: string
  updatedAt: string
}

export interface UpdateOutboundQuotaOptions {
  /**
   * Positive integer to set the user-side monthly cap, or `null` to
   * remove it (the admin ceiling still applies).
   *
   * Required. An empty body returns 422 so an accidental `{}` cannot
   * silently clear the cap.
   */
  monthlyEmailLimit: number | null
}

/**
 * Outbound resource. Read and adjust the project's monthly outbound
 * sending cap, and pause / resume transactional sending.
 *
 * Pause affects `POST /emails`, `POST /emails/bulk`, and the SMTP
 * relay. Broadcasts are intentionally not gated by outbound pause,
 * since they run on a separate operator action with their own balance
 * check.
 *
 * Access via `sevk.outbound`. Requires an API key with `outbound:read`
 * for `getQuota`, or `outbound:write` for updates / reset / pause.
 */
export class Outbound extends BaseResource {
  /** Return outbound quota settings and current usage counters. */
  async getQuota(): Promise<OutboundQuota> {
    return this.client.get("/outbound-settings/quota")
  }

  /**
   * Update the monthly cap and clear a cap-exhausted pause when possible.
   */
  async updateQuota(data: UpdateOutboundQuotaOptions): Promise<OutboundQuota> {
    return this.client.put("/outbound-settings/quota", data)
  }

  /**
   * Clear an outbound pause while preserving usage and the configured cap.
   */
  async resetQuota(): Promise<OutboundQuota> {
    return this.client.post("/outbound-settings/quota/reset")
  }

  /**
   * Reset custom-limit usage while preserving the cap and monthly usage.
   */
  async resetLimit(): Promise<OutboundQuota> {
    return this.client.post("/outbound-settings/quota/reset-limit")
  }

  /**
   * Pause transactional sending until `resetQuota` is called.
   */
  async pauseQuota(): Promise<OutboundQuota> {
    return this.client.post("/outbound-settings/quota/pause")
  }
}
