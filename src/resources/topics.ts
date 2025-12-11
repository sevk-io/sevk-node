import { BaseResource } from './base';

export interface Topic {
  id: string;
  name: string;
  description?: string;
  usersCanSee: 'PUBLIC' | 'PRIVATE';
  audienceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts: number;
  };
}

export interface CreateTopicOptions {
  name: string;
  description?: string;
  usersCanSee?: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateTopicOptions {
  name?: string;
  description?: string;
  usersCanSee?: 'PUBLIC' | 'PRIVATE';
}

export interface ListTopicsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListTopicsResponse {
  items: Topic[];
  total: number;
  page: number;
  totalPages: number;
}

export class Topics extends BaseResource {
  async list(audienceId: string, options?: ListTopicsOptions): Promise<ListTopicsResponse> {
    return this.client.get<ListTopicsResponse>(`/audiences/${audienceId}/topics`, options);
  }

  async create(audienceId: string, data: CreateTopicOptions): Promise<Topic> {
    return this.client.post<Topic>(`/audiences/${audienceId}/topics`, data);
  }

  async get(audienceId: string, id: string): Promise<Topic> {
    return this.client.get<Topic>(`/audiences/${audienceId}/topics/${id}`);
  }

  async update(audienceId: string, id: string, data: UpdateTopicOptions): Promise<Topic> {
    return this.client.put<Topic>(`/audiences/${audienceId}/topics/${id}`, data);
  }

  async delete(audienceId: string, id: string): Promise<void> {
    return this.client.delete<void>(`/audiences/${audienceId}/topics/${id}`);
  }

  async addContacts(audienceId: string, id: string, contactIds: string[]): Promise<any> {
    return this.client.post(`/audiences/${audienceId}/topics/${id}/contacts`, { contactIds });
  }

  async removeContact(audienceId: string, id: string, contactId: string): Promise<void> {
    return this.client.delete<void>(`/audiences/${audienceId}/topics/${id}/contacts/${contactId}`);
  }
}
