export type UptimeStatus = 'UP' | 'DOWN';

export type UpdownEventType =
  | 'check.down'
  | 'check.up'
  | 'check.ssl_invalid'
  | 'check.ssl_valid'
  | 'check.ssl_expiration'
  | 'check.ssl_renewed'
  | 'check.performance_drop';

export const PHASE1_UPDOWN_EVENTS: UpdownEventType[] = ['check.down', 'check.up'];

export interface UptimeEvent {
  eventId: string;
  platformId: string;
  platformName?: string;
  environment: string;
  source: 'UPDOWN';
  checkToken: string;
  endpointUrl: string;
  status: UptimeStatus;
  eventType: UpdownEventType;
  occurredAt: string;
  description?: string;
  httpStatus?: number;
  errorMessage?: string;
  uptimeSnapshot?: number;
  downtimeId?: string;
  downtimeStartedAt?: string;
  downtimeEndedAt?: string;
  downtimeDurationSec?: number;
  idempotencyKey: string;
  rawPayload: Record<string, unknown>;
  createdAt: string;
}

export interface UpdownWebhookCheck {
  token: string;
  url: string;
  alias?: string | null;
  uptime?: number;
  down?: boolean;
  down_since?: string | null;
  up_since?: string | null;
  error?: string | null;
  last_status?: number;
  apdex_t?: number;
  last_check_at?: string;
  [key: string]: unknown;
}

export interface UpdownWebhookDowntime {
  id?: string;
  started_at?: string;
  ended_at?: string | null;
  duration?: number | null;
  error?: string;
  [key: string]: unknown;
}

export interface UpdownWebhookEvent {
  event: string;
  time: string;
  description?: string;
  check: UpdownWebhookCheck;
  downtime?: UpdownWebhookDowntime;
  [key: string]: unknown;
}
