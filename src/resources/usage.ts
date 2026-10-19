import { BaseResource } from "./base"

export interface InboundUsage {
  emailsCount: number
  monthlyEmailLimit: number | null
  monthlyEmailsUsed: number
  monthlyRemaining: number | null
  freeEmails: {
    current: number
    limit: number | null
    remaining: number
  }
  resetAt: string | null
  pausedAt: string | null
  pausedReason: string | null
}

export interface OutboundUsage {
  monthlyEmailLimit: number | null
  adminMonthlyEmailLimit: number | null
  effectiveMonthlyEmailLimit: number | null
  monthlyEmailsUsed: number
  limitEmailsUsed: number
  monthlyRemaining: number | null
  rateLimit: number | null
  freeEmails: {
    current: number
    limit: number | null
    remaining: number
  }
  resetAt: string | null
  pausedAt: string | null
  pausedReason: string | null
}

export interface ProjectUsage {
  id: string
  name: string
  audienceLimit: number | null
  contactLimit: number | null
  broadcastLimit: number | null
  domainLimit: number | null
  webhookLimit: number | null
  storageLimit: string | null
  storageUsed: string
  balance?: string
  outboundEmailPrice?: string
  inboundEmailPrice?: string
  monthlyOutboundEmailLimit: number | null
  outboundRateLimit: number | null
  freeMonthlyOutboundEmails: number | null
  freeMonthlyInboundEmails: number | null
  audiencesCount: number
  contactsCount: number
  broadcastsCount: number
  monthlyBroadcastsUsed: number
  domainsCount: number
  webhooksCount: number
  inboundEmailsCount: number
  inbound: InboundUsage
  outbound: OutboundUsage
}

export class Usage extends BaseResource {
  async get(): Promise<ProjectUsage> {
    return this.client.get<ProjectUsage>("/limits")
  }
}
