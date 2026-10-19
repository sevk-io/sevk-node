import { createHmac, timingSafeEqual } from "node:crypto"

const TOLERANCE_SECONDS = 5 * 60

export interface WebhookHeaders {
  "svix-id"?: string | null
  "svix-timestamp"?: string | null
  "svix-signature"?: string | null
  [key: string]: string | null | undefined
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WebhookVerificationError"
  }
}

/**
 * Verifies the signature on an incoming sevk webhook delivery. sevk uses the
 * Svix-compatible signature scheme (`svix-id`, `svix-timestamp`, `svix-signature`
 * headers), so customers can verify with this helper or the official `svix`
 * package. sevk issues canonical `whsec_` base64 secrets that can be passed
 * directly to either verifier.
 *
 * @example
 * ```ts
 * import { WebhookVerifier } from 'sevk'
 *
 * const verifier = new WebhookVerifier(process.env.SEVK_WEBHOOK_SECRET!)
 *
 * export async function POST(request: Request) {
 *   const body = await request.text()
 *   const event = verifier.verify(body, {
 *     'svix-id': request.headers.get('svix-id'),
 *     'svix-timestamp': request.headers.get('svix-timestamp'),
 *     'svix-signature': request.headers.get('svix-signature')
 *   })
 *   // ... handle event
 * }
 * ```
 */
export class WebhookVerifier {
  private readonly key: Buffer

  /** Creates a verifier from a webhook endpoint's signing secret. */
  constructor(secret: string) {
    if (!secret) {
      throw new WebhookVerificationError("Webhook secret is required")
    }
    if (secret.startsWith("whsec_")) {
      const encoded = secret.slice(6)
      if (!encoded || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
        throw new WebhookVerificationError("Invalid base64 secret")
      }
      this.key = Buffer.from(encoded, "base64")
      if (this.key.length === 0) throw new WebhookVerificationError("Invalid base64 secret")
    } else {
      this.key = Buffer.from(secret, "utf-8")
    }
  }

  /**
   * Verify a webhook delivery and return the parsed event payload. Throws
   * `WebhookVerificationError` on missing headers, expired timestamp, or
   * signature mismatch.
   */
  verify<T = unknown>(payload: string, headers: WebhookHeaders): T {
    const msgId = lookupHeader(headers, "svix-id")
    const msgTimestamp = lookupHeader(headers, "svix-timestamp")
    const msgSignature = lookupHeader(headers, "svix-signature")

    if (!msgId || !msgTimestamp || !msgSignature) {
      throw new WebhookVerificationError("Missing required svix headers")
    }

    const timestamp = Number(msgTimestamp)
    if (!/^\d+$/.test(msgTimestamp) || !Number.isSafeInteger(timestamp)) {
      throw new WebhookVerificationError("Invalid timestamp header")
    }
    const now = Math.floor(Date.now() / 1000)
    if (timestamp < now - TOLERANCE_SECONDS || timestamp > now + TOLERANCE_SECONDS) {
      throw new WebhookVerificationError("Timestamp outside tolerance window")
    }

    const toSign = `${msgId}.${msgTimestamp}.${payload}`
    const expected = createHmac("sha256", this.key)
      .update(toSign)
      .digest("base64")
    const expectedHeader = `v1,${expected}`
    const expectedBuf = Buffer.from(expectedHeader)

    const ok = msgSignature.split(" ").some((candidate) => {
      const buf = Buffer.from(candidate)
      return (
        buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf)
      )
    })

    if (!ok) {
      throw new WebhookVerificationError("Signature mismatch")
    }

    try {
      return JSON.parse(payload) as T
    } catch (error) {
      throw new WebhookVerificationError(
        `Invalid JSON payload${error instanceof Error ? `: ${error.message}` : ""}`
      )
    }
  }
}

const lookupHeader = (headers: WebhookHeaders, name: string): string | null | undefined => {
  for (const [key, value] of Object.entries(headers)) {
    const normalized = key.toLowerCase().replace(/^http[-_]/, "").replace(/_/g, "-")
    if (normalized === name && value != null) return value
  }
  return undefined
}
