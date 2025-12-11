import { BaseResource } from './base';

export interface SubscribeOptions {
  email: string;
  audienceId?: string;
  topicId?: string;
  topicIds?: string[];
  data?: Record<string, any>;
}

export interface UnsubscribeOptions {
  email?: string;
  contactId?: string;
}

export class Subscriptions extends BaseResource {
  async subscribe(data: SubscribeOptions): Promise<void> {
    return this.client.post<void>('/subscriptions/subscribe', data);
  }

  async unsubscribe(data: UnsubscribeOptions): Promise<void> {
    return this.client.post<void>('/subscriptions/unsubscribe', data);
  }
}
