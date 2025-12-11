import { BaseResource } from './base';

export interface Domain {
  id: string;
  domain: string;
  email: string;
  from: string;
  senderName: string;
  region: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainOptions {
  domain: string;
  email: string;
  from: string;
  senderName: string;
  region?: string;
}

export interface UpdateDomainOptions {
  email?: string;
  from?: string;
  senderName?: string;
}

export interface ListDomainsOptions {
  verified?: boolean;
}

export interface ListDomainsResponse {
  domains: Domain[];
}

export class Domains extends BaseResource {
  async list(options?: ListDomainsOptions): Promise<ListDomainsResponse> {
    return this.client.get<ListDomainsResponse>('/domains', options);
  }

  async get(id: string): Promise<Domain> {
    const response = await this.client.get<{ domain: Domain }>(`/domains/${id}`);
    return response.domain;
  }
}
