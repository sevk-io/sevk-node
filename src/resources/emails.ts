import { BaseResource } from './base';
import { generateEmailHTML } from '../markup';

/**
 * Base email options without content
 */
interface BaseEmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  text?: string;
  reply_to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Email options with HTML content
 */
interface HtmlEmailOptions extends BaseEmailOptions {
  html: string;
  markup?: never;
}

/**
 * Email options with Sevk Markup content (automatically rendered to HTML)
 */
interface MarkupEmailOptions extends BaseEmailOptions {
  html?: never;
  /**
   * Sevk markup content - will be automatically rendered to HTML by the SDK
   */
  markup: string;
}

/**
 * Send email options - use either `html` or `markup`, not both
 */
export type SendEmailOptions = HtmlEmailOptions | MarkupEmailOptions;

export interface SendEmailResponse {
  id?: string;
  ids?: string[];
}

export class Emails extends BaseResource {
  /**
   * Send an email
   * @param data - Email options
   * @returns Email response with id(s)
   * @example
   * ```typescript
   * // Send with HTML
   * await sevk.emails.send({
   *   to: 'user@example.com',
   *   subject: 'Hello',
   *   html: '<h1>Hello World</h1>'
   * });
   *
   * // Send with Sevk markup
   * await sevk.emails.send({
   *   to: 'user@example.com',
   *   subject: 'Hello',
   *   markup: `
   *     <section background="#f5f5f5">
   *       <heading>Hello World</heading>
   *       <paragraph>Welcome to Sevk!</paragraph>
   *     </section>
   *   `
   * });
   * ```
   */
  async send(data: SendEmailOptions): Promise<SendEmailResponse> {
    // If markup is provided, render it to HTML and use that instead
    if (data.markup) {
      const renderedHtml = await generateEmailHTML(data.markup);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { markup, ...rest } = data;
      return this.client.post<SendEmailResponse>('/emails', {
        ...rest,
        html: renderedHtml
      });
    }

    return this.client.post<SendEmailResponse>('/emails', data);
  }
}
