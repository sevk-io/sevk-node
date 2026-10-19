import { BaseResource } from "./base"

/** Body for `subscriptions.subscribe`. Identifies the contact and where to attach them. */
export interface SubscribeOptions {
  /** Email address. Will be created if it does not yet exist in the project. */
  email: string
  /** Audience to attach the contact to. */
  audienceId?: string
  /** Arbitrary metadata to set on the contact at subscribe time. */
  data?: Record<string, unknown>
}

/**
 * Body for `subscriptions.unsubscribe`. Provide at least one of `email` or
 * `contactId` (if both are given, `contactId` wins). The unsubscribe is
 * always a GLOBAL opt-out; `broadcastId` does not scope it.
 */
export interface UnsubscribeOptions {
  /** Email address. Provide at least one of `email` or `contactId`. */
  email?: string
  /** Contact id. Provide at least one of `email` or `contactId`. Takes precedence if both are set. */
  contactId?: string
  /** Optional attribution context: links the opt-out activity + counters to this broadcast. Does NOT scope the opt-out. */
  broadcastId?: string
}

export interface SubscribeResponse {
  contact: {
    id: string
    email: string
    subscribed: boolean
    data?: Record<string, unknown> | null
  }
  /** The audience the contact was attached to. Omitted on the already-subscribed short circuit. */
  audience?: { id: string, name: string } | null
  /** `true` when the contact was already subscribed and no `audienceId` was supplied. */
  alreadySubscribed?: boolean
  message?: string
}

export interface UnsubscribeResponse {
  contact: {
    id: string
    email: string
    subscribed: boolean
  }
  /** `true` when the contact was already unsubscribed. */
  alreadyUnsubscribed?: boolean
}

/**
 * Subscriptions resource. Public-facing hooks to opt contacts into and
 * out of audiences. Suitable for hosted preference centers and
 * unsubscribe links.
 *
 * Access via `sevk.subscriptions`.
 */
export class Subscriptions extends BaseResource {
  /**
   * Subscribe a contact globally or attach it to an audience. The
   * contact is created if it does not yet exist in the project.
   *
   * @param data - Identifier and target.
   * @returns The contact and the audience it was attached to.
   * @example
   * ```ts
   * await sevk.subscriptions.subscribe({
   *   email: 'user@example.com',
   *   audienceId: 'audience_newsletter'
   * });
   * ```
   */
  async subscribe(data: SubscribeOptions): Promise<SubscribeResponse> {
    return this.client.post<SubscribeResponse>("/subscriptions/subscribe", data)
  }

  /**
   * Unsubscribe a contact. This is always a GLOBAL opt-out (sets
   * `subscribed: false`, `unsubscribedBy: USER`). `broadcastId` does not
   * scope it; it only attributes the opt-out activity + counters to that
   * broadcast.
   *
   * @param data - Identifier and (optional) attribution.
   */
  async unsubscribe(data: UnsubscribeOptions): Promise<UnsubscribeResponse> {
    return this.client.post<UnsubscribeResponse>(
      "/subscriptions/unsubscribe",
      data
    )
  }
}
