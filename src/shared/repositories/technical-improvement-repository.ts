import type { TechnicalImprovement } from '../models/index.js';
import {
  fromDynamoDbItem,
  toDynamoDbItem,
} from '../models/technical-improvement.js';
import { BaseDynamoDbRepository } from './base-repository.js';

export class TechnicalImprovementRepository extends BaseDynamoDbRepository<TechnicalImprovement> {
  protected toItem(entity: TechnicalImprovement): Record<string, unknown> {
    return toDynamoDbItem(entity);
  }

  protected fromItem(item: Record<string, unknown>): TechnicalImprovement {
    return fromDynamoDbItem(item);
  }

  protected getPrimaryKey(entity: TechnicalImprovement): { PK: string; SK: string } {
    return {
      PK: `PLATFORM#${entity.platformId}`,
      SK: `IMPROVEMENT#${entity.createdAt}#${entity.id}`,
    };
  }

  async findByPlatform(
    platformId: string,
    options: { limit?: number } = {},
  ): Promise<TechnicalImprovement[]> {
    return this.query({
      pk: `PLATFORM#${platformId}`,
      skPrefix: 'IMPROVEMENT#',
      limit: options.limit,
    });
  }
}
