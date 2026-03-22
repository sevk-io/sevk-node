import { Client, type SevkOptions } from './client';
import { Emails } from './resources/emails';
import { Contacts } from './resources/contacts';
import { Audiences } from './resources/audiences';
import { Templates } from './resources/templates';
import { Topics } from './resources/topics';
import { Segments } from './resources/segments';
import { Broadcasts } from './resources/broadcasts';
import { Domains } from './resources/domains';
import { Subscriptions } from './resources/subscriptions';
import { Webhooks } from './resources/webhooks';
import { Events } from './resources/events';
import { render } from './markup';

export type { SevkOptions } from './client';

/**
 * Render Sevk markup to HTML
 * @param markup - Sevk markup string
 * @returns HTML string
 * @example
 * ```typescript
 * import { render } from 'sevk';
 *
 * const html = render(`
 *   <section background="#f5f5f5">
 *     <heading>Hello World</heading>
 *     <paragraph>Welcome to Sevk!</paragraph>
 *   </section>
 * `);
 * ```
 */
export { render };

export class Sevk {
  public emails: Emails;
  public contacts: Contacts;
  public audiences: Audiences;
  public templates: Templates;
  public topics: Topics;
  public segments: Segments;
  public broadcasts: Broadcasts;
  public domains: Domains;
  public subscriptions: Subscriptions;
  public webhooks: Webhooks;
  public events: Events;
  private client: Client;

  /**
   * Create a new Sevk SDK instance
   * @param apiKey - Your Sevk API key (starts with 'sevk_')
   * @param options - Configuration options
   * @example
   * ```typescript
   * // Basic usage
   * const sevk = new Sevk('sevk_your_api_key');
   *
   * // With options
   * const sevk = new Sevk('sevk_your_api_key', {
   *   baseUrl: 'https://api.sevk.io',
   *   timeout: 30000,
   *   debug: true
   * });
   * ```
   */
  constructor(apiKey: string, options?: SevkOptions) {
    this.client = new Client(apiKey, options);
    this.emails = new Emails(this.client);
    this.contacts = new Contacts(this.client);
    this.audiences = new Audiences(this.client);
    this.templates = new Templates(this.client);
    this.topics = new Topics(this.client);
    this.segments = new Segments(this.client);
    this.broadcasts = new Broadcasts(this.client);
    this.domains = new Domains(this.client);
    this.subscriptions = new Subscriptions(this.client);
    this.webhooks = new Webhooks(this.client);
    this.events = new Events(this.client);
  }

  /**
   * Get project usage and limits
   * @returns Usage and limits data including balance, email stats, and resource counts
   */
  async getUsage() {
    return this.client.get('/limits');
  }
}

export * from './resources/emails';
export * from './resources/contacts';
export * from './resources/audiences';
export * from './resources/templates';
export * from './resources/topics';
export * from './resources/segments';
export * from './resources/broadcasts';
export * from './resources/domains';
export * from './resources/subscriptions';
export * from './resources/webhooks';
export * from './resources/events';
