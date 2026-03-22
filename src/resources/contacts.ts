import { BaseResource } from './base';

export interface Contact {
  id: string;
  email: string;
  subscribed: boolean;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export interface CreateContactOptions {
  email: string;
  subscribed?: boolean;
  customFields?: { key: string; value: string }[];
  [key: string]: any;
}

export interface UpdateContactOptions {
  email?: string;
  subscribed?: boolean;
  customFields?: { key: string; value: string }[];
  [key: string]: any;
}

export interface ListContactsOptions {
  page?: number;
  limit?: number;
  search?: string;
  excludeAudience?: string;
  subscribed?: boolean;
}

export interface ListContactsResponse {
  items: Contact[];
  total: number;
  page: number;
  totalPages: number;
}

export class Contacts extends BaseResource {
  async list(options?: ListContactsOptions): Promise<ListContactsResponse> {
    return this.client.get<ListContactsResponse>('/contacts', options);
  }

  async create(data: CreateContactOptions): Promise<Contact> {
    return this.client.post<Contact>('/contacts', data);
  }

  async get(id: string): Promise<Contact> {
    return this.client.get<Contact>(`/contacts/${id}`);
  }

  async update(id: string, data: UpdateContactOptions): Promise<Contact> {
    return this.client.put<Contact>(`/contacts/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.client.delete<void>(`/contacts/${id}`);
  }

  async bulkUpdate(data: Record<string, any>): Promise<any> {
    return this.client.put('/contacts/bulk-update', data);
  }

  async import(data: { contacts: Array<{ email: string; subscribed?: boolean; data?: Record<string, unknown> }>; audienceId?: string }): Promise<any> {
    return this.client.post('/contacts/import', data);
  }

  async getEvents(id: string): Promise<any> {
    return this.client.get(`/contacts/${id}/events`);
  }
}
