import { describe, it, expect } from 'vitest';
import {
  createDeploymentEvent,
  getIdempotencyKey,
  toDynamoDbItem,
  fromDynamoDbItem,
} from '../../src/shared/models/deployment-event.js';

describe('DeploymentEvent model', () => {
  const baseInput = {
    platformId: 'alliance-portal',
    source: 'JENKINS' as const,
    jobName: 'alliance-portal/deploy-production',
    buildNumber: 142,
    status: 'SUCCESS' as const,
    environment: 'production',
    timestamp: '2026-06-05T14:30:00.000Z',
  };

  it('creates a deployment event with generated id and createdAt', () => {
    const event = createDeploymentEvent(baseInput);

    expect(event.id).toMatch(/^dep_/);
    expect(event.createdAt).toBeDefined();
    expect(event.platformId).toBe('alliance-portal');
    expect(event.buildNumber).toBe(142);
  });

  it('generates consistent idempotency keys', () => {
    const key = getIdempotencyKey({
      platformId: 'alliance-portal',
      jobName: 'deploy-production',
      buildNumber: 142,
    });

    expect(key).toBe('alliance-portal:deploy-production:142');
  });

  it('round-trips through DynamoDB item mapping', () => {
    const event = createDeploymentEvent(baseInput);
    const item = toDynamoDbItem(event);
    const restored = fromDynamoDbItem(item);

    expect(restored.id).toBe(event.id);
    expect(restored.platformId).toBe(event.platformId);
    expect(item.PK).toBe('PLATFORM#alliance-portal');
    expect(item.entityType).toBe('DEPLOYMENT_EVENT');
  });
});
