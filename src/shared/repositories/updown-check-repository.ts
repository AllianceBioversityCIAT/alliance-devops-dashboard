import type { UpdownCheck } from '../models/updown-check.js';
import { fromDynamoDbItem, toDynamoDbItem } from '../models/updown-check.js';
import { BaseDynamoDbRepository } from './base-repository.js';

export class UpdownCheckRepository extends BaseDynamoDbRepository<UpdownCheck> {
  protected toItem(entity: UpdownCheck): Record<string, unknown> {
    return toDynamoDbItem(entity);
  }

  protected fromItem(item: Record<string, unknown>): UpdownCheck {
    return fromDynamoDbItem(item);
  }

  protected getPrimaryKey(entity: UpdownCheck): { PK: string; SK: string } {
    return {
      PK: `CHECK#${entity.checkToken}`,
      SK: 'METADATA',
    };
  }

  async getByToken(checkToken: string): Promise<UpdownCheck | null> {
    return this.get(`CHECK#${checkToken}`, 'METADATA');
  }
}
