import type { UpdownCheck } from '../models/updown-check.js';
import type { UpdownWebhookEvent } from '../models/updown-webhook.js';
import { createUptimeEvent } from '../models/uptime-event.js';
import type { UptimeEvent, UpdownEventType } from '../models/updown-webhook.js';

function deriveStatus(eventType: UpdownEventType): 'UP' | 'DOWN' {
  return eventType === 'check.down' ? 'DOWN' : 'UP';
}

export function mapUpdownWebhookToUptimeEvent(
  webhookEvent: UpdownWebhookEvent,
  check: UpdownCheck,
  environment: string,
): UptimeEvent {
  const eventType = webhookEvent.event as UpdownEventType;
  const downtime = webhookEvent.downtime;

  return createUptimeEvent({
    platformId: check.platformId,
    platformName: check.platformName ?? webhookEvent.check.alias ?? undefined,
    environment,
    source: 'UPDOWN',
    checkToken: check.checkToken,
    endpointUrl: check.endpointUrl,
    status: deriveStatus(eventType),
    eventType,
    occurredAt: webhookEvent.time,
    description: webhookEvent.description,
    httpStatus:
      typeof webhookEvent.check.last_status === 'number'
        ? webhookEvent.check.last_status
        : undefined,
    errorMessage: downtime?.error ?? webhookEvent.check.error ?? undefined,
    uptimeSnapshot:
      typeof webhookEvent.check.uptime === 'number' ? webhookEvent.check.uptime : undefined,
    downtimeId: downtime?.id,
    downtimeStartedAt: downtime?.started_at,
    downtimeEndedAt: downtime?.ended_at ?? undefined,
    downtimeDurationSec:
      typeof downtime?.duration === 'number' ? downtime.duration : undefined,
    rawPayload: webhookEvent as Record<string, unknown>,
  });
}
