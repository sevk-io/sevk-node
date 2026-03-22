import { BaseResource } from './base';
import { generateEmailHTML } from '../markup';

/**
 * Email attachment
 */
export interface EmailAttachment {
  /** File name (e.g., "invoice.pdf") */
  filename: string;
  /** Base64 encoded file content */
  content: string;
  /** MIME type (e.g., "application/pdf", "image/png") */
  contentType: string;
}

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
  /** Optional attachments (max 10, max 10MB total) */
  attachments?: EmailAttachment[];
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

export interface SendBulkEmailResponse {
  success: number;
  failed: number;
  ids: string[];
  errors?: Array<{
    index: number;
    email: string;
    error: string;
  }>;
}

export interface Email {
  id: string;
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  status: string;
  createdAt: string;
}

export class Emails extends BaseResource {
  async get(id: string): Promise<Email> {
    const response = await this.client.get<{ email: Email }>(`/emails/${id}`);
    return response.email;
  }

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
   *
   * // Send with attachments
   * await sevk.emails.send({
   *   to: 'user@example.com',
   *   subject: 'Invoice',
   *   html: '<p>Please find your invoice attached.</p>',
   *   attachments: [{
   *     filename: 'invoice.pdf',
   *     content: base64Content,
   *     contentType: 'application/pdf'
   *   }]
   * });
   * ```
   */
  async send(data: SendEmailOptions): Promise<SendEmailResponse> {
    // If markup is provided, render it to HTML and use that instead
    if (data.markup) {
      const renderedHtml = generateEmailHTML(data.markup);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { markup, ...rest } = data;
      return this.client.post<SendEmailResponse>('/emails', {
        ...rest,
        html: renderedHtml
      });
    }

    return this.client.post<SendEmailResponse>('/emails', data);
  }

  /**
   * Send multiple emails in bulk
   * @param emails - Array of email options (max 100)
   * @returns Bulk send response with success/failure counts
   * @example
   * ```typescript
   * const result = await sevk.emails.sendBulk({
   *   emails: [
   *     {
   *       to: 'user1@example.com',
   *       subject: 'Hello',
   *       html: '<h1>Hello User 1</h1>'
   *     },
   *     {
   *       to: 'user2@example.com',
   *       subject: 'Hello',
   *       markup: '<heading>Hello User 2</heading>'
   *     },
   *     {
   *       to: 'user3@example.com',
   *       subject: 'Invoice',
   *       html: '<p>Your invoice</p>',
   *       attachments: [{
   *         filename: 'invoice.pdf',
   *         content: base64Content,
   *         contentType: 'application/pdf'
   *       }]
   *     }
   *   ]
   * });
   *
   * console.log(`Success: ${result.success}, Failed: ${result.failed}`);
   * ```
   */
  async sendBulk(data: { emails: SendEmailOptions[] }): Promise<SendBulkEmailResponse> {
    // Process each email - render markup to HTML if needed
    const processedEmails = await Promise.all(
      data.emails.map(async (email) => {
        if (email.markup) {
          const renderedHtml = generateEmailHTML(email.markup);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { markup, ...rest } = email;
          return {
            ...rest,
            html: renderedHtml
          };
        }
        return email;
      })
    );

    return this.client.post<SendBulkEmailResponse>('/emails/bulk', {
      emails: processedEmails
    });
  }
}
