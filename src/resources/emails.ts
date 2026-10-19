import { BaseResource } from "./base"
import { toBulkWirePayload, toWirePayload } from "./emails/payload"
import type {
  Email,
  ScheduledEmailMutationResponse,
  SendBulkEmailOptions,
  SendBulkEmailResponse,
  SendEmailOptions,
  SendEmailResponse,
  SendOptions,
  UpdateScheduledEmailOptions
} from "./emails/types"

/**
 * Emails resource. Send transactional email and look up email records.
 *
 * Access via `sevk.emails`.
 */
export class Emails extends BaseResource {
  /**
   * Look up an email record by id. Returns the persisted record with
   * lifecycle timestamps and provider ids.
   *
   * @param id - Email id, as returned by `send` (single recipient) or
   *   any entry of `sendBulk`'s `ids`.
   * @returns The full email record.
   * @example
   * ```ts
   * const email = await sevk.emails.get('a1b2c3d4-...');
   * console.log(email.status, email.openedAt);
   * ```
   */
  async get(id: string): Promise<Email> {
    return this.client.get<Email>(`/emails/${id}`)
  }

  /**
   * Send a transactional email.
   *
   * @param data - Body of the send. Provide one of `html`, `text`, or
   *   `markup` for the content; `markup` is rendered locally before
   *   reaching the API.
   * @param options - Per-call options. Pass `{ idempotencyKey }` to
   *   make the send safe to retry; sevk replays the original response
   *   for 24 hours when the same key arrives with the same payload.
   * @returns `{ id }` for a single recipient or `{ ids }` for multiple.
   * @throws Error on 4xx/5xx (e.g. unverified domain, validation failure,
   *   rate limit, idempotency conflict).
   * @example
   * Basic send:
   * ```ts
   * await sevk.emails.send({
   *   from: 'Example <hello@mail.example.com>',
   *   to: 'user@example.com',
   *   subject: 'Welcome',
   *   html: '<p>Hi there.</p>'
   * });
   * ```
   * @example
   * Idempotent send (safe to retry without double-sending):
   * ```ts
   * await sevk.emails.send(
   *   { from, to, subject, html },
   *   { idempotencyKey: `invoice-paid/${invoice.id}` }
   * );
   * ```
   * @example
   * With attachment:
   * ```ts
   * await sevk.emails.send({
   *   from, to, subject,
   *   html: '<p>See attached.</p>',
   *   attachments: [{
   *     filename: 'receipt.pdf',
   *     content: pdfBuffer.toString('base64'),
   *     contentType: 'application/pdf'
   *   }]
   * });
   * ```
   */
  async send(
    data: SendEmailOptions,
    options?: SendOptions
  ): Promise<SendEmailResponse> {
    return this.client.post<SendEmailResponse>(
      "/emails",
      toWirePayload(data),
      this.idempotencyHeaders(options)
    )
  }

  /** move an unattempted scheduled email to a new rfc 3339 delivery time. */
  async update(
    id: string,
    data: UpdateScheduledEmailOptions
  ): Promise<ScheduledEmailMutationResponse> {
    return this.client.patch<ScheduledEmailMutationResponse>(
      `/emails/${id}`,
      data
    )
  }

  /** cancel an unattempted scheduled email and release its reserved quota. */
  async cancel(id: string): Promise<ScheduledEmailMutationResponse> {
    return this.client.post<ScheduledEmailMutationResponse>(
      `/emails/${id}/cancel`
    )
  }

  /**
   * Send up to 100 emails in a single request. Each entry is processed
   * independently: a failure on entry `i` does not stop entry `i+1`.
   * The response carries aggregate counters plus per-entry errors.
   *
   * @param data - `{ emails: [...] }` array. Max 100 entries.
   * @param options - Per-call options. For bulk, pick an idempotency
   *   key that names the whole batch (a job run id, a workspace+date
   *   pair) since the entire `emails` array is hashed for replay.
   * @returns Counts of `success`/`failed`, the ids of successful sends
   *   in input order, and `errors` listing the failures.
   * @throws Error on 4xx/5xx for the whole request (validation,
   *   insufficient balance, etc.). Per-entry failures land in
   *   `result.errors`, not as a thrown error.
   * @example
   * ```ts
   * const result = await sevk.emails.sendBulk({
   *   emails: [
   *     { from, to: 'a@example.com', subject: 'Hi', html: '<p>One</p>' },
   *     { from, to: 'b@example.com', subject: 'Hi', html: '<p>Two</p>' }
   *   ]
   * });
   * console.log(`${result.success} sent, ${result.failed} failed`);
   * ```
   */
  async sendBulk(
    data: { emails: SendBulkEmailOptions[] },
    options?: SendOptions
  ): Promise<SendBulkEmailResponse> {
    return this.client.post<SendBulkEmailResponse>(
      "/emails/bulk",
      toBulkWirePayload(data),
      this.idempotencyHeaders(options)
    )
  }

  private idempotencyHeaders(options?: SendOptions): Record<string, string> | undefined {
    if (options?.idempotencyKey === undefined) {
      return undefined
    }

    return { "Idempotency-Key": options.idempotencyKey }
  }
}
