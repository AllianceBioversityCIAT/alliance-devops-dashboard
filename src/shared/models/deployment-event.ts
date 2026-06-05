import type { DeploymentEvent } from './index.js';

export function createDeploymentEvent(
  input: Omit<DeploymentEvent, 'id' | 'createdAt'>,
): DeploymentEvent {
  return {
    ...input,
    id: generateEventId('dep'),
    createdAt: new Date().toISOString(),
  };
}

export function toDynamoDbItem(event: DeploymentEvent): Record<string, unknown> {
  return {
    PK: `PLATFORM#${event.platformId}`,
    SK: `DEPLOYMENT#${event.timestamp}#${event.id}`,
    GSI1PK: `DEPLOYMENT#${event.platformId}`,
    GSI1SK: event.timestamp,
    entityType: 'DEPLOYMENT_EVENT',
    ...event,
  };
}

export function fromDynamoDbItem(item: Record<string, unknown>): DeploymentEvent {
  const { PK: _pk, SK: _sk, entityType: _et, GSI1PK: _g1, GSI1SK: _g2, ...event } = item;
  return event as unknown as DeploymentEvent;
}

export function getIdempotencyKey(event: Pick<DeploymentEvent, 'platformId' | 'jobName' | 'buildNumber'>): string {
  return `${event.platformId}:${event.jobName}:${event.buildNumber}`;
}

function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
