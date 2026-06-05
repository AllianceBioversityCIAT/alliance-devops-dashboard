import type { UptimeEvent } from './index.js';

export function createUptimeEvent(
  input: Omit<UptimeEvent, 'id' | 'createdAt'>,
): UptimeEvent {
  return {
    ...input,
    id: generateEventId('upt'),
    createdAt: new Date().toISOString(),
  };
}

export function toDynamoDbItem(event: UptimeEvent): Record<string, unknown> {
  return {
    PK: `PLATFORM#${event.platformId}`,
    SK: `UPTIME#${event.timestamp}#${event.id}`,
    GSI1PK: `UPTIME#${event.platformId}`,
    GSI1SK: event.timestamp,
    entityType: 'UPTIME_EVENT',
    ...event,
  };
}

export function fromDynamoDbItem(item: Record<string, unknown>): UptimeEvent {
  const { PK: _pk, SK: _sk, entityType: _et, GSI1PK: _g1, GSI1SK: _g2, ...event } = item;
  return event as unknown as UptimeEvent;
}

function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
