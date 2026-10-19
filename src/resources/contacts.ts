import { BaseResource } from "./base"
import type { ActivityAction } from "./activity"

/** A contact (subscriber) within the project. */
export interface Contact {
  id: string
  /** Email address. Lowercased and unique within the project. */
  email: string
  /** Whether the contact is currently subscribed (i.e. mailable). */
  subscribed: boolean
  /** Arbitrary metadata. Indexable from segments via `data.<key>`. */
  data: Record<string, unknown> | null
  /** Set when the contact was unsubscribed. */
  unsubscribedAt: string | null
  /** Source of the unsubscribe. `BOUNCE` and `COMPLAINT` lock the contact against re-subscription. */
  unsubscribedBy: "USER" | "BOUNCE" | "COMPLAINT" | "API" | "ADMIN" | null
  /** When `true`, public re-subscribe attempts are rejected with 403. */
  resubscriptionLocked: boolean
  /** Number of bounce events recorded for this contact. */
  bounceCount: number
  lastBouncedAt: string | null
  lastEventAt: string | null
  projectId: string
  createdAt: string
  updatedAt: string
}

/** Body for `contacts.create`. */
export interface CreateContactOptions {
  /** Email address. Lowercased on save; rejected as duplicate when another contact in the project owns it. */
  email: string
  /** Defaults to `true`. Set to `false` to create a pre-unsubscribed contact. */
  subscribed?: boolean
  /** Arbitrary metadata. Searchable from segments via `data.<key>`. */
  data?: Record<string, unknown>
}

/** Body for `contacts.update`. */
export interface UpdateContactOptions {
  email?: string
  subscribed?: boolean
  /** `null` clears all metadata; an object merges over existing keys (top-level keys are replaced wholesale). */
  data?: Record<string, unknown> | null
}

export interface BulkUpdateContact {
  email: string
  subscribed?: boolean
  data?: Record<string, unknown> | null
}

export interface BulkUpdateContactsOptions {
  contacts: BulkUpdateContact[]
}

export interface BulkUpdateContactsResponse {
  updated: number
  notFound: number
  errors: string[]
  updatedEmails: string[]
  notFoundEmails: string[]
}

/** Query options for `contacts.list`. */
export interface ListContactsOptions {
  /** Offset mode: 1-based page number. Omit it to use cursor mode. Mutually exclusive with `after` and `before`. */
  page?: number
  /** Page size. 1 to 100. Default 20. */
  limit?: number
  /** Cursor mode: id of the last item from the previous page. Mutually exclusive with `page`. */
  after?: string
  /** Cursor mode (backward direction): id of the first item from the current page. Mutually exclusive with `page`. */
  before?: string
  /** Substring match on email and the serialized `data` metadata. */
  search?: string
  /** Audience id; results exclude contacts that already belong to it. Useful for "add to audience" pickers. */
  excludeAudience?: string
  /** Filter by subscription state. */
  subscribed?: boolean
}

/**
 * Paginated response from `contacts.list`. Shape varies by mode:
 * - Offset (`?page=`): `total`, `page`, `totalPages` are set.
 * - Cursor (`?after=`): `hasMore`, `nextCursor`, and `prevCursor` are set.
 */
export interface ListContactsResponse {
  items: Contact[]
  /** Offset mode: total rows matching the filter across all pages. */
  total?: number
  /** Offset mode: current page number. */
  page?: number
  /** Offset mode: total page count. */
  totalPages?: number
  /** Cursor mode: true when at least one more page is available. */
  hasMore?: boolean
  /** Cursor mode: pass back as `after` to fetch the next page. `null` once the iteration ends. */
  nextCursor?: string | null
  prevCursor?: string | null
}

/** A single row from `contacts.activity`. */
export interface ContactActivityItem {
  id: string
  /** Action verb, e.g. `OPENED`, `CLICKED`, `BOUNCED`, `UNSUBSCRIBED`. */
  action: ActivityAction
  description: string | null
  createdAt: string
  userAgent: string | null
  /** Set when `action` is `CLICKED`. */
  link: string | null
  metadata:
    | string
    | number
    | boolean
    | unknown[]
    | Record<string, unknown>
    | null
  /** Set when the activity originated from a broadcast send. `name` is `null` when the broadcast was deleted. */
  broadcast: { id: string; name: string | null } | null
  /** Set when the activity is tied to a specific email send. `subject` is `null` when the email row has none. */
  email: { id: string; subject: string | null } | null
}

/**
 * Contacts resource. Manage subscribers, their metadata, and bulk
 * import/update flows.
 *
 * Access via `sevk.contacts`.
 */
export class Contacts extends BaseResource {
  /**
   * List contacts in the project, paginated.
   *
   * @param options - Pagination, search, and filter options.
   * @returns Paginated list. Paramless and cursor calls return cursor metadata; explicit `page` returns offset metadata.
   * @example
   * ```ts
   * const { items, nextCursor } = await sevk.contacts.list({ search: 'gmail.com', subscribed: true });
   * ```
   */
  async list(options?: ListContactsOptions): Promise<ListContactsResponse> {
    return this.client.get<ListContactsResponse>("/contacts", options)
  }

  /**
   * Create a contact.
   *
   * @param data - Contact fields.
   * @returns The created contact.
   * @throws 400 when another contact in the project already has this email.
   * @example
   * ```ts
   * const contact = await sevk.contacts.create({
   *   email: 'user@example.com',
   *   data: { plan: 'pro', signupSource: 'landing-v2' }
   * });
   * ```
   */
  async create(data: CreateContactOptions): Promise<Contact> {
    return this.client.post<Contact>("/contacts", data)
  }

  /**
   * Look up a contact by id.
   *
   * @param id - Contact id.
   * @returns The contact record.
   * @throws 404 when no contact with that id exists in the project.
   */
  async get(id: string): Promise<Contact> {
    return this.client.get<Contact>(`/contacts/${id}`)
  }

  /**
   * Update a contact. Fields you do not pass keep their previous value.
   *
   * @param id - Contact id.
   * @param data - Fields to change.
   * @returns The updated contact.
   */
  async update(id: string, data: UpdateContactOptions): Promise<Contact> {
    return this.client.put<Contact>(`/contacts/${id}`, data)
  }

  /**
   * Delete a contact. Removes it from every audience and topic it
   * belonged to.
   *
   * @param id - Contact id.
   * @returns `{ id, deleted: true }`.
   */
  async delete(id: string): Promise<{ id: string; deleted: true }> {
    return this.client.delete<{ id: string; deleted: true }>(`/contacts/${id}`)
  }

  /**
   * Update many contacts in one request, keyed by email. Each entry is
   * matched by `email`; entries with no match are reported in
   * `notFoundEmails`.
   *
   * @param data - `{ contacts: [{ email, subscribed?, data? }, ...] }`.
   * @returns Aggregate counters and per-status email lists.
   * @example
   * ```ts
   * await sevk.contacts.bulkUpdate({
   *   contacts: [
   *     { email: 'a@example.com', data: { plan: 'pro' } },
   *     { email: 'b@example.com', subscribed: false }
   *   ]
   * });
   * ```
   */
  async bulkUpdate(
    data: BulkUpdateContactsOptions
  ): Promise<BulkUpdateContactsResponse> {
    return this.client.put<BulkUpdateContactsResponse>(
      "/contacts/bulk-update",
      data
    )
  }

  /**
   * Bulk-create contacts and (optionally) attach them to an audience or
   * topic in the same call. Existing emails are skipped (not updated);
   * use `bulkUpdate` for upserts.
   *
   * @param data - Import payload.
   * @returns `created` count, per-row errors, and the created records.
   */
  async bulkImport(data: {
    contacts: Array<{
      email: string
      subscribed?: boolean
      data?: Record<string, unknown>
    }>
    audienceId?: string
    topicId?: string
  }): Promise<{
    created: number
    errors: string[]
    contacts: Array<{ id: string; email: string; subscribed: boolean }>
  }> {
    return this.client.post("/contacts/import", data)
  }

  /**
   * Get a contact's activity log: sends, opens, clicks, bounces,
   * unsubscribes, etc.
   *
   * @param id - Contact id.
   * @param options - Pagination.
   * @returns Paginated list of activity rows, newest first.
   */
  async activity(
    id: string,
    options?: {
      page?: number
      limit?: number
      after?: string
      before?: string
    }
  ): Promise<{
    items: ContactActivityItem[]
    total?: number
    page?: number
    totalPages?: number
    hasMore?: boolean
    nextCursor?: string | null
    prevCursor?: string | null
  }> {
    return this.client.get(`/contacts/${id}/activity`, options)
  }
}
