import type { UptimeEvent } from '../models/updown-webhook.js';

export interface UptimeEventStore {
  saveIfNotExists(entity: UptimeEvent): Promise<boolean>;
}
