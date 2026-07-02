const DEFAULT_PAGE_LIMIT = 100;
const MAX_PAGE_LIMIT = 1000;

export interface PaginationInput {
  limit?: string | null;
  nextToken?: string | null;
  month?: string | null;
  year?: string | null;
}

export interface ResolvedPagination {
  limit: number;
  exclusiveStartKey?: Record<string, unknown>;
}

export class PaginationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaginationError';
  }
}

export function resolvePagination(input: PaginationInput): ResolvedPagination {
  const limit = parseLimit(input.limit);
  const exclusiveStartKey = input.nextToken
    ? decodeNextToken(input.nextToken)
    : undefined;

  return { limit, exclusiveStartKey };
}

export function parseLimit(value?: string | null): number {
  if (value === undefined || value === null || value.trim() === '') {
    return DEFAULT_PAGE_LIMIT;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new PaginationError('limit must be a positive integer');
  }

  if (parsed > MAX_PAGE_LIMIT) {
    throw new PaginationError(`limit must not exceed ${MAX_PAGE_LIMIT}`);
  }

  return parsed;
}

export function encodeNextToken(lastEvaluatedKey: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(lastEvaluatedKey), 'utf8').toString('base64');
}

export function decodeNextToken(token: string): Record<string, unknown> {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parsed: unknown = JSON.parse(decoded);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Invalid token payload');
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new PaginationError('nextToken is invalid');
  }
}

export { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT };
