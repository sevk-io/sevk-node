import { BaseResource } from "./base"

/**
 * Outbound TLS posture when delivering mail from this domain.
 * - `OPTIONAL`: opportunistic TLS (try, fall back to plaintext)
 * - `REQUIRE`: enforced TLS (drop mail if the recipient cannot do TLS)
 */
export type DomainTlsPolicy = "OPTIONAL" | "REQUIRE"

/** Non-DNS domain metadata returned by list operations. */
export interface DomainSummary {
  id: string
  /** Apex domain or subdomain (e.g. `mail.example.com`). */
  domain: string
  /** Default From address for this domain. */
  email: string
  /** Default From display name (e.g. `Example Team`). */
  senderName: string | null
  /** AWS region used to send from this domain. */
  region: string
  /** `true` once outbound DKIM/SPF/DMARC records have been verified. */
  verified: boolean
  /** Domain-level click tracking default. Per-send tracking can override this. */
  clickTracking: boolean
  /** Domain-level open tracking default. Per-send tracking can override this. */
  openTracking: boolean
  /** Outbound TLS policy when delivering mail. */
  tlsPolicy: DomainTlsPolicy
  /** Whether inbound mail acceptance is enabled on this domain. */
  inboundEnabled: boolean
  /** `true` once the inbound MX record points to sevk's MX hostname. */
  inboundVerified: boolean
  inboundPrefix: string
  projectId: string
  createdAt: string
  updatedAt: string
}

/**
 * domain projection returned by `get`.
 *
 * dns material is present only when the caller has `domain:dns-read`.
 */
export type DomainRead = DomainSummary & {
  /** Ownership-proof token; present only with `domain:dns-read`. */
  verificationToken?: string
  /** DKIM tokens to publish as CNAME records; capability-gated. */
  dkimTokens?: string[]
  /** Expected sending and inbound DNS records; capability-gated. */
  dnsRecords?: DnsRecord[]
}

export interface CreateDomainOptions {
  /** Apex or subdomain to register (e.g. `mail.example.com`). */
  domain: string
  /** Default From address; must be on the registered domain. */
  email: string
  /** Default From display name (e.g. `Example Team`). */
  senderName?: string
  /**
   * AWS region to send from. Use `sevk.domains.regions()` to fetch the
   * regions enabled for your account. When omitted the instance's
   * admin-configured default region is used; the request fails if the
   * instance has no default configured.
   */
  region?: string
}

export interface UpdateDomainOptions {
  email?: string
  senderName?: string
  /** Domain-level click tracking default. */
  clickTracking?: boolean
  /** Domain-level open tracking default. */
  openTracking?: boolean
  /** Outbound TLS policy. */
  tlsPolicy?: DomainTlsPolicy
  /**
   * Enable inbound mail acceptance on this domain. When toggled on, an MX
   * record pointing to the project's inbound MX hostname needs to be
   * published; then call `verifyInbound(id)` to confirm.
   */
  inboundEnabled?: boolean
  inboundPrefix?: string
}

/** A DNS record the domain expects to be in place for verification. */
export interface DnsRecord {
  type: "CNAME" | "TXT" | "MX"
  name: string
  fqdn: string
  value: string
}

/** A single MX record resolved when verifying an inbound domain. */
export interface InboundMxRecord {
  /** MX target hostname. */
  exchange: string
  /** MX preference value. */
  priority: number
}

/** capability-aware domain record plus diagnostics returned by inbound verification. */
export type InboundVerifyResult = DomainRead & {
  /** MX records resolved at the domain during this verification attempt. */
  inboundMxResolved: InboundMxRecord[]
  /** The MX hostname sevk expects the domain to point at. */
  inboundExpectedTarget: string
}

export interface ListDomainsOptions {
  page?: number
  limit?: number
  after?: string
  before?: string
  /** Filter by verification state. */
  verified?: boolean
}

export interface ListDomainsResponse {
  items: DomainSummary[]
  total?: number
  page?: number
  totalPages?: number
  hasMore?: boolean
  nextCursor?: string | null
  prevCursor?: string | null
}

/**
 * Domains resource. Register and verify the domains you send from.
 *
 * Access via `sevk.domains`.
 */
export class Domains extends BaseResource {
  /**
   * List domains in the project.
   *
   */
  async list(options?: ListDomainsOptions): Promise<ListDomainsResponse> {
    return this.client.get<ListDomainsResponse>("/domains", options)
  }

  /**
   * Look up a domain by id.
   *
   * @param id - Domain id.
   */
  async get(id: string): Promise<DomainRead> {
    return this.client.get<DomainRead>(`/domains/${id}`)
  }

  /**
   * register a new sending domain. dns material is present in the returned
   * record only when the caller also has `domain:dns-read`.
   *
   * @param data - Domain config.
   * @example
   * ```ts
   * const domain = await sevk.domains.create({
   *   domain: 'mail.example.com',
   *   email: 'hello@mail.example.com',
   *   senderName: 'Example Team'
   * });
   * console.log(domain.dnsRecords); // publish these; present when the key has domain:dns-read
   * ```
   */
  async create(data: CreateDomainOptions): Promise<DomainRead> {
    return this.client.post<DomainRead>("/domains", data)
  }

  /**
   * Update a domain.
   *
   * @param id - Domain id.
   * @param data - Fields to change.
   */
  async update(id: string, data: UpdateDomainOptions): Promise<DomainRead> {
    return this.client.put<DomainRead>(`/domains/${id}`, data)
  }

  /**
   * Delete a domain. API keys that were scoped to this domain are
   * cascade-deleted along with it.
   *
   * @param id - Domain id.
   */
  async delete(id: string): Promise<{ id: string; deleted: true }> {
    return this.client.delete<{ id: string; deleted: true }>(`/domains/${id}`)
  }

  /**
   * Trigger DNS verification for the domain's sending records (DKIM /
   * SPF / DMARC). Once the expected CNAME / TXT records resolve,
   * `verified` flips to `true` and the domain becomes usable for sending.
   *
   * @param id - Domain id.
   * @returns The domain record (with updated `verified`).
   */
  async verify(id: string): Promise<DomainRead> {
    return this.client.post<DomainRead>(`/domains/${id}/verify`)
  }

  /**
   * Trigger inbound MX verification. The domain must have
   * `inboundEnabled: true` and the published MX record needs to point
   * to sevk's MX hostname. Flips `inboundVerified` to `true` on success.
   *
   * The returned record extends the standard domain shape with
   * `inboundMxResolved` (the MX records actually resolved at the
   * domain) and `inboundExpectedTarget` (the hostname sevk expects)
   * so the caller can debug a failed verification without a second
   * DNS lookup.
   *
   * @param id - Domain id.
   */
  async verifyInbound(id: string): Promise<InboundVerifyResult> {
    return this.client.post<InboundVerifyResult>(
      `/domains/${id}/inbound/verify`
    )
  }

  /**
   * Get the DNS records this domain expects to be in place for
   * verification. Same data as `domain.dnsRecords` but accessible
   * without re-fetching the whole record.
   *
   * @param id - Domain id.
   */
  async dnsRecords(id: string): Promise<{ items: DnsRecord[] }> {
    return this.client.get<{ items: DnsRecord[] }>(`/domains/${id}/dns-records`)
  }

  /**
   * List the AWS regions sevk supports for sending.
   *
   * @returns `{ items }` where each entry is a region code.
   */
  async regions(): Promise<{ items: string[] }> {
    return this.client.get("/domains/regions")
  }
}
