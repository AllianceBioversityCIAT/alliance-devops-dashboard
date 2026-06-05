import type { UptimeEvent } from '../models/updown-webhook.js';
import { fromDynamoDbItem, toDynamoDbItem } from '../models/uptime-event.js';
import { BaseDynamoDbRepository } from './base-repository.js';

export class UptimeEventRepository extends BaseDynamoDbRepository<UptimeEvent> {
  protected toItem(entity: UptimeEvent): Record<string, unknown> {
    return toDynamoDbItem(entity);
  }

  protected fromItem(item: Record<string, unknown>): UptimeEvent {
    return fromDynamoDbItem(item);
  }

  protected getPrimaryKey(entity: UptimeEvent): { PK: string; SK: string } {
    return {
      PK: `PLATFORM#${entity.platformId}`,
      SK: `UPTIME#${entity.idempotencyKey}`,
    };
  }

  async findByPlatform(
    platformId: string,
    options: { limit?: number } = {},
  ): Promise<UptimeEvent[]> {
    return this.query({
      pk: `PLATFORM#${platformId}`,
      skPrefix: 'UPTIME#',
      limit: options.limit,
    });
  }
}
