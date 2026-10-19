import { Client } from "../client"

export class BaseResource {
  constructor(protected readonly client: Client) {}
}
