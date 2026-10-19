import { BaseResource } from "./base"
import type { Contact } from "./contacts"

/**
 * An audience: a named group of contacts you can target from broadcasts,
 * topics, and segments.
 */
export interface Audience {
  id: string
  name: string
  description: string | null
  /** `PUBLIC` audiences are exposed in the hosted preference center. `PRIVATE` are not. */
  visibility: "PUBLIC" | "PRIVATE"
  projectId: string
  createdAt: string
  updatedAt: string
  /** Total contacts attached to the audience. */
  contactsCount: number
  /** Subset that is currently subscribed (i.e. mailable). */
  subscribedContactsCount: number
  broadcastsCount: number
  topicsCount: number
  segmentsCount: number
}

/** Audience projection returned by create and update operations. */
export type AudienceMutationResponse = Omit<
  Audience,
  | "contactsCount"
  | "subscribedContactsCount"
  | "broadcastsCount"
  | "topicsCount"
  | "segmentsCount"
>

export interface CreateAudienceOptions {
  /** Display name (1-255 chars). Shown in dashboards and the preference center. */
  name: string
  /** Optional description shown on the dashboard. */
  description?: string
  /** `PUBLIC` audiences appear in the hosted preference center. Defaults to `PRIVATE`. */
  visibility?: "PUBLIC" | "PRIVATE"
}

export interface UpdateAudienceOptions {
  name?: string
  description?: string
  visibility?: "PUBLIC" | "PRIVATE"
}

export interface ListAudiencesOptions {
  /** Offset mode: 1-based page number. Mutually exclusive with `after`. */
  page?: number
  /** Page size. 1 to 100. Default 20. */
  limit?: number
  /** Cursor mode: id of the last item from the previous page. Mutually exclusive with `page`. */
  after?: string
  /** Cursor mode (backward direction): id of the first item from the current page. Mutually exclusive with `page`. */
  before?: string
  /** Substring match on `name` and `description`. */
  search?: string
}

/**
 * Paginated response. Shape varies by mode (offset sets
 * `total/page/totalPages`; cursor sets `hasMore/nextCursor/prevCursor`).
 */
export interface ListAudiencesResponse {
  items: Audience[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/**
 * Audiences resource. Manage audiences (named contact groups) and the
 * memberships of contacts inside them.
 *
 * Access via `sevk.audiences`.
 */
export class Audiences extends BaseResource {
  /**
   * List audiences in the project, paginated.
   *
   * @param options - Pagination and search.
   * @returns Paginated list. Paramless and cursor calls return cursor metadata; explicit `page` returns offset metadata.
   */
  async list(options?: ListAudiencesOptions): Promise<ListAudiencesResponse> {
    return this.client.get<ListAudiencesResponse>("/audiences", options)
  }

  /**
   * Create an audience.
   *
   * @param data - Audience fields.
   * @returns The created audience.
   * @example
   * ```ts
   * const audience = await sevk.audiences.create({
   *   name: 'Newsletter subscribers',
   *   visibility: 'PUBLIC'
   * });
   * ```
   */
  async create(data: CreateAudienceOptions): Promise<AudienceMutationResponse> {
    return this.client.post<AudienceMutationResponse>("/audiences", data)
  }

  /**
   * Look up an audience by id. Includes `contactsCount`,
   * `subscribedContactsCount`, and child counts.
   *
   * @param id - Audience id.
   */
  async get(id: string): Promise<Audience> {
    return this.client.get<Audience>(`/audiences/${id}`)
  }

  /**
   * Update an audience.
   *
   * @param id - Audience id.
   * @param data - Fields to change. Unset fields keep their previous value.
   */
  async update(
    id: string,
    data: UpdateAudienceOptions
  ): Promise<AudienceMutationResponse> {
    return this.client.put<AudienceMutationResponse>(`/audiences/${id}`, data)
  }

  /**
   * Delete an audience. This removes the audience and its topics/segments;
   * the contacts themselves stay in the project (only their membership in
   * this audience is detached).
   *
   * @param id - Audience id.
   * @returns `{ id, deleted: true }`.
   */
  async delete(id: string): Promise<{ id: string; deleted: true }> {
    return this.client.delete<{ id: string; deleted: true }>(`/audiences/${id}`)
  }

  /**
   * Attach existing contacts to the audience. Already-attached contacts
   * are silently skipped.
   *
   * @param id - Audience id.
   * @returns `added` count and the attached contact rows.
   */
  async addContacts(
    id: string,
    data: { contactIds: string[] }
  ): Promise<{
    added: number
    contacts: Array<{
      id: string
      email: string
      subscribed: boolean
      createdAt: string
    }>
  }> {
    return this.client.post(`/audiences/${id}/contacts`, data)
  }

  /**
   * Remove a contact from this audience. The contact itself is not
   * deleted, but it is also detached from every topic of this audience.
   *
   * @param id - Audience id.
   * @param contactId - Contact id to detach.
   */
  async removeContact(
    id: string,
    contactId: string
  ): Promise<{ audienceId: string; contactId: string; removed: true }> {
    return this.client.delete(`/audiences/${id}/contacts/${contactId}`)
  }

  /**
   * List the contacts in this audience.
   *
   * @param id - Audience id.
   * @param options - Pagination, search, filters.
   */
  async listContacts(
    id: string,
    options?: {
      page?: number
      limit?: number
      after?: string
      before?: string
      search?: string
      subscribed?: boolean
      excludeTopicId?: string
    }
  ): Promise<{
    items: Contact[]
    total?: number
    page?: number
    totalPages?: number
    hasMore?: boolean
    nextCursor?: string | null
    prevCursor?: string | null
  }> {
    return this.client.get(`/audiences/${id}/contacts`, options)
  }
}
