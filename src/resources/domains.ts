import { BaseResource } from './base';

export interface Domain {
  id: string;
  domain: string;
  email: string;
  from: string;
  senderName: string;
  region: string;
  verified: boolean;
  clickTracking: boolean;
  openTracking: boolean;
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
  clickTracking?: boolean;
  openTracking?: boolean;
}

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  status: string;
}

export interface ListDomainsOptions {
  verified?: boolean;
}

export interface ListDomainsResponse {
  items: Domain[];
}

export class Domains extends BaseResource {
  async list(options?: ListDomainsOptions): Promise<ListDomainsResponse> {
    return this.client.get<ListDomainsResponse>('/domains', options);
  }

  async get(id: string): Promise<Domain> {
    return this.client.get<Domain>(`/domains/${id}`);
  }

  async create(data: CreateDomainOptions): Promise<Domain> {
    return this.client.post<Domain>('/domains', data);
  }

  async update(id: string, data: UpdateDomainOptions): Promise<Domain> {
    return this.client.put<Domain>(`/domains/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/domains/${id}`);
  }

  async verify(id: string): Promise<Domain> {
    return this.client.post<Domain>(`/domains/${id}/verify`);
  }

  async getDnsRecords(id: string): Promise<DnsRecord[]> {
    const response = await this.client.get<{ items: DnsRecord[] }>(`/domains/${id}/dns-records`);
    return response.items;
  }

  async getRegions(): Promise<any> {
    return this.client.get('/domains/regions');
  }
}
