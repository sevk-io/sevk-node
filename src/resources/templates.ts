import { BaseResource } from "./base"

/** `MARKUP` is rendered server-side; `HTML` is used verbatim. */
export type TemplateStyle = "HTML" | "MARKUP"

/** A reusable email template. Stored content can be sevk markup or raw HTML. */
export interface Template {
  id: string
  /** Internal label shown in the dashboard. Not sent to recipients. */
  title: string
  /** Source content. Interpretation depends on `style`. */
  content: string
  style: TemplateStyle
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateOptions {
  /** Display name shown in the dashboard. Not sent to recipients. */
  title: string
  /** Source content. sevk markup when `style` is `MARKUP`, raw HTML when `style` is `HTML`. */
  content: string
  /** Defaults to `MARKUP`. */
  style?: TemplateStyle
}

export interface UpdateTemplateOptions {
  title?: string
  content?: string
  style?: TemplateStyle
}

export interface ListTemplatesOptions {
  /** Offset mode: 1-based page number. Mutually exclusive with `after`. */
  page?: number
  /** Page size. 1 to 100. Default 20. */
  limit?: number
  /** Cursor mode: id of the last item from the previous page. Mutually exclusive with `page`. */
  after?: string
  /** Cursor mode (backward direction): id of the first item from the current page. Mutually exclusive with `page`. */
  before?: string
  /** Substring match on `title` and `content`. */
  search?: string
}

/**
 * Paginated response. Shape varies by mode (offset sets
 * `total/page/totalPages`; cursor sets `hasMore/nextCursor/prevCursor`).
 */
export interface ListTemplatesResponse {
  items: Template[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/**
 * Templates resource. Manage reusable email templates referenced from
 * broadcasts and the dashboard composer.
 *
 * Access via `sevk.templates`.
 */
export class Templates extends BaseResource {
  /**
   * List templates in the project, paginated.
   *
   * @param options - Pagination and search.
   */
  async list(options?: ListTemplatesOptions): Promise<ListTemplatesResponse> {
    return this.client.get<ListTemplatesResponse>("/templates", options)
  }

  /**
   * Create a template.
   *
   * @param data - Template fields.
   * @returns The created template.
   * @example
   * ```ts
   * await sevk.templates.create({
   *   title: 'Welcome',
   *   style: 'MARKUP',
   *   content: '<section><heading>Hi {{name}}</heading></section>'
   * });
   * ```
   */
  async create(data: CreateTemplateOptions): Promise<Template> {
    return this.client.post<Template>("/templates", data)
  }

  /**
   * Look up a template by id.
   *
   * @param id - Template id.
   * @returns The template.
   */
  async get(id: string): Promise<Template> {
    return this.client.get<Template>(`/templates/${id}`)
  }

  /**
   * Update a template.
   *
   * @param id - Template id.
   * @param data - Fields to change.
   */
  async update(id: string, data: UpdateTemplateOptions): Promise<Template> {
    return this.client.put<Template>(`/templates/${id}`, data)
  }

  /**
   * Delete a template. Does not affect already-sent broadcasts.
   *
   * @param id - Template id.
   */
  async delete(id: string): Promise<{ id: string; deleted: true }> {
    return this.client.delete<{ id: string; deleted: true }>(`/templates/${id}`)
  }

  /**
   * Duplicate a template. The copy is named `<original> (Copy)`.
   *
   * @param id - Template id to copy.
   * @returns The new template.
   */
  async duplicate(id: string): Promise<Template> {
    return this.client.post<Template>(`/templates/${id}/duplicate`)
  }
}
