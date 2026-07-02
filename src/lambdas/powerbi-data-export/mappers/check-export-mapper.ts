export interface CheckExportRecord {
  PK: string;
  SK: string;
  checkToken: string;
  platformId: string;
  platformName?: string;
  endpointUrl: string;
  environment: string;
  status: string;
  source: string;
  autoRegistered: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

function asString(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}

export function mapCheckExportItem(item: Record<string, unknown>): CheckExportRecord {
  return {
    PK: asString(item.PK),
    SK: asString(item.SK),
    checkToken: asString(item.checkToken),
    platformId: asString(item.platformId),
    platformName: item.platformName !== undefined ? asString(item.platformName) : undefined,
    endpointUrl: asString(item.endpointUrl),
    environment: asString(item.environment),
    status: asString(item.status),
    source: asString(item.source),
    autoRegistered: asBoolean(item.autoRegistered),
    firstSeenAt: asString(item.firstSeenAt),
    lastSeenAt: asString(item.lastSeenAt),
    createdAt: asString(item.createdAt),
    updatedAt: asString(item.updatedAt),
  };
}

export function mapCheckExportItems(items: Record<string, unknown>[]): CheckExportRecord[] {
  return items.map(mapCheckExportItem);
}
