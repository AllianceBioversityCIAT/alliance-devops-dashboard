import type { Platform } from './index.js';

export function createPlatform(input: Omit<Platform, 'createdAt' | 'updatedAt'>): Platform {
  const now = new Date().toISOString();
  return {
    ...input,
    slug: input.slug ?? input.id,
    createdAt: now,
    updatedAt: now,
  };
}

export function toDynamoDbKeys(platform: Platform): { PK: string; SK: string } {
  return {
    PK: `PLATFORM#${platform.id}`,
    SK: 'METADATA',
  };
}

export function fromDynamoDbItem(item: Record<string, unknown>): Platform {
  const { PK: _pk, SK: _sk, entityType: _entityType, GSI1PK: _g1, GSI1SK: _g2, ...platform } = item;
  return platform as unknown as Platform;
}
