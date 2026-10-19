export type SevkFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

/** Options for the {@link Sevk} client constructor. */
export interface SevkOptions {
  /**
   * Override the API base URL. Useful for custom deployments or
   * when pointing the SDK at a staging environment.
   *
   * @default 'https://api.sevk.io'
   */
  baseUrl?: string
  /**
   * Per-request timeout in milliseconds. Requests aborted by this
   * timeout throw a `SevkError` with code `TIMEOUT` and message `Request timeout after Nms`.
   *
   * @default 30000
   */
  timeout?: number
  fetch?: SevkFetch
}
