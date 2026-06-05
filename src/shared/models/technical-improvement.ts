import type { ImprovementItem, TechnicalImprovement } from './index.js';

export function createTechnicalImprovement(
  input: Omit<TechnicalImprovement, 'id' | 'createdAt' | 'updatedAt'>,
): TechnicalImprovement {
  const now = new Date().toISOString();
  return {
    ...input,
    id: generateEventId('imp'),
    createdAt: now,
    updatedAt: now,
  };
}

export function fromImprovementItem(
  item: ImprovementItem,
  platformId: string,
  releaseId: string,
): TechnicalImprovement {
  return createTechnicalImprovement({
    platformId,
    releaseId,
    category: item.category,
    title: item.title,
    description: item.description,
    impact: item.impact,
    source: 'RELEASE_NOTE',
    completedAt: new Date().toISOString(),
  });
}

export function toDynamoDbItem(improvement: TechnicalImprovement): Record<string, unknown> {
  return {
    PK: `PLATFORM#${improvement.platformId}`,
    SK: `IMPROVEMENT#${improvement.createdAt}#${improvement.id}`,
    GSI1PK: `IMPROVEMENT#${improvement.category}`,
    GSI1SK: improvement.createdAt,
    entityType: 'TECHNICAL_IMPROVEMENT',
    ...improvement,
  };
}

export function fromDynamoDbItem(item: Record<string, unknown>): TechnicalImprovement {
  const { PK: _pk, SK: _sk, entityType: _et, GSI1PK: _g1, GSI1SK: _g2, ...improvement } = item;
  return improvement as unknown as TechnicalImprovement;
}

function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
