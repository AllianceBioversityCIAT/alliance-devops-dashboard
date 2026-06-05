import type { ReleaseNote } from '../models/index.js';
import {
  fromDynamoDbItem,
  getIdempotencyKey,
  toDynamoDbItem,
} from '../models/release-note.js';
import { BaseDynamoDbRepository } from './base-repository.js';

export class ReleaseNoteRepository extends BaseDynamoDbRepository<ReleaseNote> {
  protected toItem(entity: ReleaseNote): Record<string, unknown> {
    return toDynamoDbItem(entity);
  }

  protected fromItem(item: Record<string, unknown>): ReleaseNote {
    return fromDynamoDbItem(item);
  }

  protected getPrimaryKey(entity: ReleaseNote): { PK: string; SK: string } {
    return {
      PK: `PLATFORM#${entity.platformId}`,
      SK: `RELEASE#${entity.releaseDate}#${entity.id}`,
    };
  }

  async findByPlatform(
    platformId: string,
    options: { limit?: number } = {},
  ): Promise<ReleaseNote[]> {
    return this.query({
      pk: `PLATFORM#${platformId}`,
      skPrefix: 'RELEASE#',
      limit: options.limit,
    });
  }

  getIdempotencyKey(release: Pick<ReleaseNote, 'platformId' | 'version'>): string {
    return getIdempotencyKey(release);
  }
}
