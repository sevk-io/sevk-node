import { BaseResource } from './base';

export interface Audience {
  id: string;
  name: string;
  description?: string;
  usersCanSee: 'PUBLIC' | 'PRIVATE';
  projectId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts: number;
    broadcasts: number;
  };
}

export interface CreateAudienceOptions {
  name: string;
  description?: string;
  usersCanSee?: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateAudienceOptions {
  name?: string;
  description?: string;
  usersCanSee?: 'PUBLIC' | 'PRIVATE';
}

export interface ListAudiencesOptions {
  page?: number;
  limit?: number;
  search?: string;
  minimal?: boolean;
}

export interface ListAudiencesResponse {
  items: Audience[];
  total: number;
  page: number;
  totalPages: number;
}

export class Audiences extends BaseResource {
  async list(options?: ListAudiencesOptions): Promise<ListAudiencesResponse> {
    return this.client.get<ListAudiencesResponse>('/audiences', options);
  }

  async create(data: CreateAudienceOptions): Promise<Audience> {
    return this.client.post<Audience>('/audiences', data);
  }

  async get(id: string): Promise<Audience> {
    return this.client.get<Audience>(`/audiences/${id}`);
  }

  async update(id: string, data: UpdateAudienceOptions): Promise<Audience> {
    return this.client.put<Audience>(`/audiences/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.client.delete<void>(`/audiences/${id}`);
  }

  async addContacts(id: string, contactIds: string[]): Promise<any> {
    return this.client.post(`/audiences/${id}/contacts`, { contactIds });
  }

  async removeContact(id: string, contactId: string): Promise<void> {
    return this.client.delete<void>(`/audiences/${id}/contacts/${contactId}`);
  }

  async listContacts(id: string, query?: Record<string, any>): Promise<any> {
    return this.client.get(`/audiences/${id}/contacts`, query);
  }
}
