export interface EventExportRecord {
  PK: string;
  SK: string;
  eventId: string;
  platformId: string;
  platformName?: string;
  checkToken: string;
  eventType: string;
  status: string;
  occurredAt: string;
  downtimeId?: string;
  downtimeStartedAt?: string;
  endpointUrl: string;
  environment: string;
  errorMessage?: string;
  description?: string;
  uptimeSnapshot?: number;
  source: string;
  createdAt: string;
  rawPayload: Record<string, unknown>;
}

function asString(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

function asNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mapEventExportItem(item: Record<string, unknown>): EventExportRecord {
  return {
    PK: asString(item.PK),
    SK: asString(item.SK),
    eventId: asString(item.eventId),
    platformId: asString(item.platformId),
    platformName: item.platformName !== undefined ? asString(item.platformName) : undefined,
    checkToken: asString(item.checkToken),
    eventType: asString(item.eventType),
    status: asString(item.status),
    occurredAt: asString(item.occurredAt),
    downtimeId: item.downtimeId !== undefined ? asString(item.downtimeId) : undefined,
    downtimeStartedAt:
      item.downtimeStartedAt !== undefined ? asString(item.downtimeStartedAt) : undefined,
    endpointUrl: asString(item.endpointUrl),
    environment: asString(item.environment),
    errorMessage: item.errorMessage !== undefined ? asString(item.errorMessage) : undefined,
    description: item.description !== undefined ? asString(item.description) : undefined,
    uptimeSnapshot: asNumber(item.uptimeSnapshot),
    source: asString(item.source),
    createdAt: asString(item.createdAt),
    rawPayload: asRecord(item.rawPayload),
  };
}

export function mapEventExportItems(items: Record<string, unknown>[]): EventExportRecord[] {
  return items.map(mapEventExportItem);
}
