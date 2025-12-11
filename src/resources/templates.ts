import { BaseResource } from './base';

export interface Template {
  id: string;
  title: string;
  content: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateOptions {
  title: string;
  content: string;
}

export interface UpdateTemplateOptions {
  title?: string;
  content?: string;
}

export interface ListTemplatesOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListTemplatesResponse {
  items: Template[];
  total: number;
  page: number;
  totalPages: number;
}

export class Templates extends BaseResource {
  async list(options?: ListTemplatesOptions): Promise<ListTemplatesResponse> {
    return this.client.get<ListTemplatesResponse>('/templates', options);
  }

  async create(data: CreateTemplateOptions): Promise<Template> {
    return this.client.post<Template>('/templates', data);
  }

  async get(id: string): Promise<Template> {
    return this.client.get<Template>(`/templates/${id}`);
  }

  async update(id: string, data: UpdateTemplateOptions): Promise<Template> {
    return this.client.put<Template>(`/templates/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.client.delete<void>(`/templates/${id}`);
  }

  async duplicate(id: string): Promise<Template> {
    return this.client.post<Template>(`/templates/${id}/duplicate`);
  }
}
