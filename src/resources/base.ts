import { Client } from '../client';

export class BaseResource {
  constructor(protected client: Client) {}
}
