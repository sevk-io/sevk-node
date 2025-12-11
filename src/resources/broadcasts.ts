import { BaseResource } from './base';

export interface Broadcast {
  id: string;
  name: string;
  subject: string;
  body: string;
  style: 'MARKUP' | 'HTML';
  status: 'DRAFT' | 'SCHEDULED' | 'STARTING' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  targetType: 'ALL' | 'AUDIENCE' | 'TOPIC' | 'SEGMENT';
  audienceId?: string;
  topicId?: string;
  segmentId?: string;
  senderName?: string;
  domainId?: string;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBroadcastOptions {
  name: string;
  subject: string;
  body: string;
  style?: 'MARKUP' | 'HTML';
  targetType?: 'ALL' | 'AUDIENCE' | 'TOPIC' | 'SEGMENT';
  audienceId?: string;
  topicId?: string;
  segmentId?: string;
  senderName?: string;
  domainId: string;
  scheduledAt?: string;
}

export interface UpdateBroadcastOptions {
  name?: string;
  subject?: string;
  body?: string;
  style?: 'MARKUP' | 'HTML';
  targetType?: 'ALL' | 'AUDIENCE' | 'TOPIC' | 'SEGMENT';
  audienceId?: string;
  topicId?: string;
  segmentId?: string;
  senderName?: string;
  domainId?: string;
  scheduledAt?: string | null;
}

export interface ListBroadcastsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListBroadcastsResponse {
  items: Broadcast[];
  total: number;
  page: number;
  totalPages: number;
}

export class Broadcasts extends BaseResource {
  async list(options?: ListBroadcastsOptions): Promise<ListBroadcastsResponse> {
    return this.client.get<ListBroadcastsResponse>('/broadcasts', options);
  }

  async create(data: CreateBroadcastOptions): Promise<Broadcast> {
    return this.client.post<Broadcast>('/broadcasts', data);
  }

  async get(id: string): Promise<Broadcast> {
    return this.client.get<Broadcast>(`/broadcasts/${id}`);
  }

  async update(id: string, data: UpdateBroadcastOptions): Promise<Broadcast> {
    return this.client.put<Broadcast>(`/broadcasts/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.client.delete<void>(`/broadcasts/${id}`);
  }

  async send(id: string): Promise<Broadcast> {
    return this.client.post<Broadcast>(`/broadcasts/${id}/send`);
  }

  async cancel(id: string): Promise<Broadcast> {
    return this.client.post<Broadcast>(`/broadcasts/${id}/cancel`);
  }

  async sendTest(id: string, emails: string[]): Promise<any> {
    return this.client.post(`/broadcasts/${id}/test`, { emails });
  }

  async getAnalytics(id: string): Promise<any> {
    return this.client.get(`/broadcasts/${id}/analytics`);
  }
}
