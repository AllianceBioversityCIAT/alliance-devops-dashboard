import type { UptimeEvent } from '../models/updown-webhook.js';
import { toDynamoDbItem } from '../models/uptime-event.js';

/**
 * In-memory repository for local development (UPTIME_EVENTS_TABLE=local).
 * Data is lost when the process stops.
 */
export class InMemoryUptimeEventRepository {
  private readonly items = new Map<string, Record<string, unknown>>();

  async saveIfNotExists(entity: UptimeEvent): Promise<boolean> {
    const item = toDynamoDbItem(entity);
    const pk = item.PK as string;
    const sk = item.SK as string;
    const key = `${pk}#${sk}`;

    if (this.items.has(key)) {
      return false;
    }

    this.items.set(key, item);
    return true;
  }

  async findByPlatform(platformId: string): Promise<UptimeEvent[]> {
    const prefix = `PLATFORM#${platformId}`;
    return [...this.items.values()]
      .filter((item) => (item.PK as string) === prefix)
      .map((item) => {
        const { PK: _pk, SK: _sk, entityType: _et, GSI1PK: _g1, GSI1SK: _g2, ...event } = item;
        return event as unknown as UptimeEvent;
      });
  }

  getAll(): UptimeEvent[] {
    return [...this.items.values()].map((item) => {
      const { PK: _pk, SK: _sk, entityType: _et, GSI1PK: _g1, GSI1SK: _g2, ...event } = item;
      return event as unknown as UptimeEvent;
    });
  }

  clear(): void {
    this.items.clear();
  }
}
