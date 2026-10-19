import { Client } from "./client"
import type { SevkOptions } from "./client-options"
import { Activity } from "./resources/activity"
import { Audiences } from "./resources/audiences"
import { Broadcasts } from "./resources/broadcasts"
import { Contacts } from "./resources/contacts"
import { Domains } from "./resources/domains"
import { Emails } from "./resources/emails"
import { Inbound } from "./resources/inbound"
import { Outbound } from "./resources/outbound"
import { Segments } from "./resources/segments"
import { Subscriptions } from "./resources/subscriptions"
import { Templates } from "./resources/templates"
import { Topics } from "./resources/topics"
import { Usage } from "./resources/usage"
import { Webhooks } from "./resources/webhooks"

/**
 * sevk SDK entry point. Construct one instance per project and access
 * resources via the typed properties (`emails`, `contacts`, `broadcasts`, etc.).
 *
 * @example
 * ```ts
 * import { Sevk } from 'sevk';
 *
 * const sevk = new Sevk(process.env.SEVK_API_KEY!);
 *
 * await sevk.emails.send({
 *   from: 'Example <hello@mail.example.com>',
 *   to: 'user@example.com',
 *   subject: 'Welcome',
 *   html: '<p>Hi there.</p>'
 * });
 * ```
 */
export class Sevk {
  /** Send transactional email and look up email records. */
  public readonly emails: Emails
  /** Manage contacts (subscribers) and their metadata. */
  public readonly contacts: Contacts
  /** Manage audiences (named contact groups). */
  public readonly audiences: Audiences
  /** Manage reusable email templates. */
  public readonly templates: Templates
  /** Manage opt-in topics within an audience. */
  public readonly topics: Topics
  /** Define rule-based contact filters scoped to an audience. */
  public readonly segments: Segments
  /** Compose, schedule, and send broadcast campaigns. */
  public readonly broadcasts: Broadcasts
  /** Register and verify the domains you send from. */
  public readonly domains: Domains
  /** Public-facing hooks to opt contacts into and out of audiences/topics. */
  public readonly subscriptions: Subscriptions
  /** Manage outbound webhook endpoints. */
  public readonly webhooks: Webhooks
  /** Read the project-wide event log and aggregate stats. */
  public readonly activity: Activity
  /** Read inbound mail, manage routes/blocklist/quota/security, download attachments. */
  public readonly inbound: Inbound
  /** Read and adjust the project's outbound monthly cap, pause / resume transactional sending. */
  public readonly outbound: Outbound
  /** Read the project's plan caps, balance, prices, counters, and email send-limit stats. */
  public readonly usage: Usage

  /**
   * Create a sevk SDK instance.
   *
   * @param apiKey - Your sevk API key (starts with `sevk_`). Each key
   *   is scoped to a single project and carries its own capability
   *   scopes; resource calls will fail with 403 if the key is missing
   *   the required scope.
   * @param options - Optional client configuration.
   * @example
   * Basic usage:
   * ```ts
   * const sevk = new Sevk(process.env.SEVK_API_KEY!);
   * ```
   * @example
   * With custom timeout:
   * ```ts
   * const sevk = new Sevk(process.env.SEVK_API_KEY!, { timeout: 10000 });
   * ```
   */
  constructor(apiKey: string, options?: SevkOptions) {
    const client = new Client(apiKey, options)
    this.emails = new Emails(client)
    this.contacts = new Contacts(client)
    this.audiences = new Audiences(client)
    this.templates = new Templates(client)
    this.topics = new Topics(client)
    this.segments = new Segments(client)
    this.broadcasts = new Broadcasts(client)
    this.domains = new Domains(client)
    this.subscriptions = new Subscriptions(client)
    this.webhooks = new Webhooks(client)
    this.activity = new Activity(client)
    this.inbound = new Inbound(client)
    this.outbound = new Outbound(client)
    this.usage = new Usage(client)
  }
}
