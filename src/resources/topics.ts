import { BaseResource } from "./base"
import type { Contact } from "./contacts"

/**
 * A topic is an internal sub-list inside an audience.
 */
export interface Topic {
  id: string
  name: string
  description: string | null
  audienceId: string
  createdAt: string
  updatedAt: string
  /** Total contacts attached to the topic. */
  contactsCount: number
  /** Subset that is currently subscribed. */
  subscribedContactsCount: number
  broadcastsCount: number
}

/** Topic projection returned by create and update operations. */
export type TopicMutationResponse = Omit<
  Topic,
  "contactsCount" | "subscribedContactsCount" | "broadcastsCount"
>

export interface CreateTopicOptions {
  /** Display name. */
  name: string
  /** Optional description. */
  description?: string
}

export interface UpdateTopicOptions {
  name?: string
  description?: string
}

export interface ListTopicsOptions {
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
export interface ListTopicsResponse {
  items: Topic[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/**
 * Topics resource. Manage opt-in topics within an audience and their
 * memberships.
 *
 * Access via `sevk.topics`. Topics are scoped to an audience: `list` and
 * `create` take an `audienceId`; the rest take a topic id directly.
 */
export class Topics extends BaseResource {
  /**
   * List topics within an audience.
   *
   * @param audienceId - Parent audience id.
   * @param options - Pagination and search.
   */
  async list(
    audienceId: string,
    options?: ListTopicsOptions
  ): Promise<ListTopicsResponse> {
    return this.client.get<ListTopicsResponse>(
      `/audiences/${audienceId}/topics`,
      options
    )
  }

  /**
   * Create a topic inside an audience.
   *
   * @param audienceId - Parent audience id.
   * @param data - Topic fields.
   * @example
   * ```ts
   * await sevk.topics.create(audience.id, {
   *   name: 'Product updates'
   * });
   * ```
   */
  async create(
    audienceId: string,
    data: CreateTopicOptions
  ): Promise<TopicMutationResponse> {
    return this.client.post<TopicMutationResponse>(
      `/audiences/${audienceId}/topics`,
      data
    )
  }

  /**
   * Look up a topic by id. Includes contact counts.
   *
   * @param id - Topic id.
   */
  async get(id: string): Promise<Topic> {
    return this.client.get<Topic>(`/topics/${id}`)
  }

  /**
   * Update a topic.
   *
   * @param id - Topic id.
   * @param data - Fields to change.
   */
  async update(
    id: string,
    data: UpdateTopicOptions
  ): Promise<TopicMutationResponse> {
    return this.client.put<TopicMutationResponse>(`/topics/${id}`, data)
  }

  /**
   * Delete a topic. Removes the topic membership from all contacts; the
   * contacts themselves are not deleted.
   *
   * @param id - Topic id.
   */
  async delete(id: string): Promise<{ id: string; deleted: true }> {
    return this.client.delete<{ id: string; deleted: true }>(`/topics/${id}`)
  }

  /**
   * Attach contacts to the topic. Contacts not yet in the parent audience are
   * added to it first. Already-attached contacts are silently skipped.
   *
   * @param id - Topic id.
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
    return this.client.post(`/topics/${id}/contacts`, data)
  }

  /**
   * Remove a contact from this topic. Does not delete the contact.
   *
   * @param id - Topic id.
   * @param contactId - Contact id to detach.
   */
  async removeContact(
    id: string,
    contactId: string
  ): Promise<{ topicId: string; contactId: string; removed: true }> {
    return this.client.delete(`/topics/${id}/contacts/${contactId}`)
  }

  /**
   * List the contacts attached to this topic.
   *
   * @param id - Topic id.
   * @param options - Pagination and search.
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
    return this.client.get(`/topics/${id}/contacts`, options)
  }
}
