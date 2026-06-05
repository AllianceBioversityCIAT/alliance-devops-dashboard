export interface UpdownCheck {
  checkToken: string;
  platformId: string;
  platformName?: string;
  endpointUrl: string;
  source: 'UPDOWN';
  status: 'ACTIVE';
  autoRegistered: boolean;
  environment: string;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export function createUpdownCheck(input: {
  checkToken: string;
  platformId: string;
  platformName?: string;
  endpointUrl: string;
  environment: string;
  autoRegistered: boolean;
  seenAt: string;
}): UpdownCheck {
  return {
    checkToken: input.checkToken,
    platformId: input.platformId,
    platformName: input.platformName,
    endpointUrl: input.endpointUrl,
    source: 'UPDOWN',
    status: 'ACTIVE',
    autoRegistered: input.autoRegistered,
    environment: input.environment,
    firstSeenAt: input.seenAt,
    lastSeenAt: input.seenAt,
    createdAt: input.seenAt,
    updatedAt: input.seenAt,
  };
}

export function toDynamoDbItem(check: UpdownCheck): Record<string, unknown> {
  return {
    PK: `CHECK#${check.checkToken}`,
    SK: 'METADATA',
    GSI1PK: `PLATFORM#${check.platformId}`,
    GSI1SK: `CHECK#${check.checkToken}`,
    entityType: 'UPDOWN_CHECK',
    ...check,
  };
}

export function fromDynamoDbItem(item: Record<string, unknown>): UpdownCheck {
  const { PK: _pk, SK: _sk, entityType: _et, GSI1PK: _g1, GSI1SK: _g2, ...check } = item;
  return check as unknown as UpdownCheck;
}

export function touchUpdownCheck(check: UpdownCheck, seenAt: string, updates?: {
  platformName?: string;
  endpointUrl?: string;
}): UpdownCheck {
  return {
    ...check,
    platformName: updates?.platformName ?? check.platformName,
    endpointUrl: updates?.endpointUrl ?? check.endpointUrl,
    lastSeenAt: seenAt,
    updatedAt: seenAt,
  };
}
