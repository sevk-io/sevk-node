import { BaseResource } from './base';

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookOptions {
  url: string;
  events: string[];
  enabled?: boolean;
}

export interface UpdateWebhookOptions {
  url?: string;
  events?: string[];
  enabled?: boolean;
}

export class Webhooks extends BaseResource {
  async list(): Promise<{ items: Webhook[] }> {
    return this.client.get('/webhooks');
  }

  async get(id: string): Promise<Webhook> {
    return this.client.get(`/webhooks/${id}`);
  }

  async create(data: CreateWebhookOptions): Promise<Webhook> {
    return this.client.post('/webhooks', data);
  }

  async update(id: string, data: UpdateWebhookOptions): Promise<Webhook> {
    return this.client.put(`/webhooks/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.client.delete(`/webhooks/${id}`);
  }

  async test(id: string): Promise<any> {
    return this.client.post(`/webhooks/${id}/test`);
  }

  async listEvents(): Promise<any> {
    return this.client.get('/webhooks/events');
  }
}
