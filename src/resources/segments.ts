import { BaseResource } from './base';

export interface Segment {
  id: string;
  name: string;
  rules: any[];
  operator: 'AND' | 'OR';
  limitToTopics: string[];
  audienceId: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunCount?: number;
}

export interface CreateSegmentOptions {
  name: string;
  rules: any[];
  operator: 'AND' | 'OR';
  limitToTopics?: string[];
}

export interface UpdateSegmentOptions {
  name?: string;
  rules?: any[];
  operator?: 'AND' | 'OR';
  limitToTopics?: string[];
}

export interface ListSegmentsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListSegmentsResponse {
  items: Segment[];
  total: number;
  page: number;
  totalPages: number;
}

export class Segments extends BaseResource {
  async list(audienceId: string, options?: ListSegmentsOptions): Promise<ListSegmentsResponse> {
    return this.client.get<ListSegmentsResponse>(`/audiences/${audienceId}/segments`, options);
  }

  async create(audienceId: string, data: CreateSegmentOptions): Promise<Segment> {
    return this.client.post<Segment>(`/audiences/${audienceId}/segments`, data);
  }

  async get(audienceId: string, id: string): Promise<Segment> {
    return this.client.get<Segment>(`/audiences/${audienceId}/segments/${id}`);
  }

  async update(audienceId: string, id: string, data: UpdateSegmentOptions): Promise<Segment> {
    return this.client.put<Segment>(`/audiences/${audienceId}/segments/${id}`, data);
  }

  async delete(audienceId: string, id: string): Promise<void> {
    return this.client.delete<void>(`/audiences/${audienceId}/segments/${id}`);
  }

  async preview(audienceId: string, data: any): Promise<any> {
    return this.client.post(`/audiences/${audienceId}/segments/preview`, data);
  }
}
