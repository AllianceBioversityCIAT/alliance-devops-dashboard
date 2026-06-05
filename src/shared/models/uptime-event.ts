import { randomUUID } from 'node:crypto';
import type { UpdownEventType, UptimeEvent } from './updown-webhook.js';

export function createUptimeEvent(
  input: Omit<UptimeEvent, 'eventId' | 'createdAt' | 'idempotencyKey'> & {
    idempotencyKey?: string;
  },
): UptimeEvent {
  const idempotencyKey =
    input.idempotencyKey ??
    buildIdempotencyKey({
      checkToken: input.checkToken,
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      downtimeId: input.downtimeId,
    });

  return {
    ...input,
    idempotencyKey,
    eventId: generateEventId(),
    createdAt: new Date().toISOString(),
  };
}

export function buildIdempotencyKey(input: {
  checkToken: string;
  eventType: UpdownEventType | string;
  occurredAt: string;
  downtimeId?: string;
}): string {
  return `${input.checkToken}:${input.eventType}:${input.occurredAt}:${input.downtimeId ?? 'none'}`;
}

export function toDynamoDbItem(event: UptimeEvent): Record<string, unknown> {
  return {
    PK: `PLATFORM#${event.platformId}`,
    SK: `UPTIME#${event.idempotencyKey}`,
    GSI1PK: `UPTIME#${event.platformId}`,
    GSI1SK: event.occurredAt,
    entityType: 'UPTIME_EVENT',
    ...event,
  };
}

export function fromDynamoDbItem(item: Record<string, unknown>): UptimeEvent {
  const {
    PK: _pk,
    SK: _sk,
    entityType: _et,
    GSI1PK: _g1,
    GSI1SK: _g2,
    idempotencyKey: _ik,
    ...event
  } = item;
  return event as unknown as UptimeEvent;
}

function generateEventId(): string {
  return `upt_${randomUUID()}`;
}
