import type { ReleaseNote } from './index.js';

export function createReleaseNote(
  input: Omit<ReleaseNote, 'id' | 'createdAt' | 'updatedAt'>,
): ReleaseNote {
  const now = new Date().toISOString();
  return {
    ...input,
    id: generateEventId('rel'),
    createdAt: now,
    updatedAt: now,
  };
}

export function toDynamoDbItem(release: ReleaseNote): Record<string, unknown> {
  return {
    PK: `PLATFORM#${release.platformId}`,
    SK: `RELEASE#${release.releaseDate}#${release.id}`,
    entityType: 'RELEASE_NOTE',
    ...release,
  };
}

export function fromDynamoDbItem(item: Record<string, unknown>): ReleaseNote {
  const { PK: _pk, SK: _sk, entityType: _et, ...release } = item;
  return release as unknown as ReleaseNote;
}

export function getIdempotencyKey(release: Pick<ReleaseNote, 'platformId' | 'version'>): string {
  return `${release.platformId}:${release.version}`;
}

function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
