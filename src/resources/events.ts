import { BaseResource } from './base';

export interface Event {
  id: string;
  eventType: string;
  action: string;
  description: string;
  contact: string | null;
  contactId: string | null;
  broadcast: string | null;
  broadcastId: string | null;
  createdAt: string;
}

export interface ListEventsOptions {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  days?: number;
  search?: string;
}

export interface ListEventsResponse {
  items: Event[];
  total: number;
  page: number;
  totalPages: number;
}

export class Events extends BaseResource {
  async list(options?: ListEventsOptions): Promise<ListEventsResponse> {
    return this.client.get('/events', options);
  }

  async stats(): Promise<any> {
    return this.client.get('/events/stats');
  }
}
