import { successResponse, errorResponse } from '../../shared/utils/index.js';

export function paginatedResponse<T>(
  data: T[],
  nextToken?: string,
) {
  return successResponse({
    data,
    count: data.length,
    ...(nextToken ? { nextToken } : {}),
  });
}

export function fullResponse<T>(data: T[]) {
  return successResponse({
    data,
    count: data.length,
    generatedAt: new Date().toISOString(),
  });
}

export function byMonthResponse<T>(
  data: T[],
  period: {
    month: number;
    year: number;
    fromDate: string;
    toDate: string;
  },
  nextToken?: string,
) {
  return successResponse({
    data,
    count: data.length,
    month: period.month,
    year: period.year,
    fromDate: period.fromDate,
    toDate: period.toDate,
    ...(nextToken ? { nextToken } : {}),
  });
}

export function badRequestResponse(message: string) {
  return errorResponse(message, 400);
}

export function notFoundResponse() {
  return errorResponse('Not found', 404);
}

export function internalErrorResponse(message: string) {
  return errorResponse(message, 500);
}
