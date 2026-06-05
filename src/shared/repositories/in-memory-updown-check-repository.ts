import type { UpdownCheck } from '../models/updown-check.js';
import { fromDynamoDbItem, toDynamoDbItem } from '../models/updown-check.js';
import type { UpdownCheckStore } from './updown-check-store.js';

export class InMemoryUpdownCheckRepository implements UpdownCheckStore {
  private readonly items = new Map<string, Record<string, unknown>>();

  async getByToken(checkToken: string): Promise<UpdownCheck | null> {
    const item = this.items.get(`CHECK#${checkToken}`);
    return item ? fromDynamoDbItem(item) : null;
  }

  async save(check: UpdownCheck): Promise<UpdownCheck> {
    const item = toDynamoDbItem(check);
    this.items.set(`CHECK#${check.checkToken}`, item);
    return check;
  }

  getAll(): UpdownCheck[] {
    return [...this.items.values()].map((item) => fromDynamoDbItem(item));
  }

  clear(): void {
    this.items.clear();
  }
}
