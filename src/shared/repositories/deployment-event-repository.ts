import type { DeploymentEvent } from '../models/index.js';
import {
  fromDynamoDbItem,
  getIdempotencyKey,
  toDynamoDbItem,
} from '../models/deployment-event.js';
import { BaseDynamoDbRepository } from './base-repository.js';

export class DeploymentEventRepository extends BaseDynamoDbRepository<DeploymentEvent> {
  protected toItem(entity: DeploymentEvent): Record<string, unknown> {
    return toDynamoDbItem(entity);
  }

  protected fromItem(item: Record<string, unknown>): DeploymentEvent {
    return fromDynamoDbItem(item);
  }

  protected getPrimaryKey(entity: DeploymentEvent): { PK: string; SK: string } {
    return {
      PK: `PLATFORM#${entity.platformId}`,
      SK: `DEPLOYMENT#${entity.timestamp}#${entity.id}`,
    };
  }

  async findByPlatform(
    platformId: string,
    options: { limit?: number } = {},
  ): Promise<DeploymentEvent[]> {
    return this.query({
      pk: `PLATFORM#${platformId}`,
      skPrefix: 'DEPLOYMENT#',
      limit: options.limit,
    });
  }

  getIdempotencyKey(event: Pick<DeploymentEvent, 'platformId' | 'jobName' | 'buildNumber'>): string {
    return getIdempotencyKey(event);
  }
}
