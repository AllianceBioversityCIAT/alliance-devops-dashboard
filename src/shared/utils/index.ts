import type { APIGatewayProxyResult } from 'aws-lambda';

export function successResponse(
  body: unknown,
  statusCode = 200,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

export function errorResponse(
  message: string,
  statusCode = 500,
  details?: unknown,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: message,
      ...(details !== undefined ? { details } : {}),
    }),
  };
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function parseJsonBody<T>(body: string | null | undefined): T {
  if (!body) {
    throw new Error('Request body is empty');
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error('Invalid JSON in request body');
  }
}

export async function withErrorHandling(
  handler: () => Promise<APIGatewayProxyResult>,
  logger: { error: (msg: string, ctx?: Record<string, unknown>) => void },
): Promise<APIGatewayProxyResult> {
  try {
    return await handler();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Handler error', { error: message });
    return errorResponse(message, 500);
  }
}
