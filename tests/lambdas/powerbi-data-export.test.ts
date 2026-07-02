import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

vi.mock('../../src/shared/config/powerbi-export.config.js', () => ({
  loadPowerBiExportConfig: vi.fn(() => ({
    appName: 'alliance-devops-dashboard',
    lambdaName: 'powerbi-data-export',
    environment: 'dev',
    logLevel: 'info',
    checksTableName: 'alliance-devops-updown-checks-dev',
    eventsTableName: 'alliance-devops-uptime-events-dev',
    deploymentsTableName: 'jenkinsexecutions_test',
    deploymentMetadataTableName: 'deployment_metadata',
  })),
}));

const mockGetChecksPage = vi.fn();
const mockGetChecksFull = vi.fn();
const mockGetChecksByMonth = vi.fn();
const mockGetChecksCurrentMonth = vi.fn();
const mockGetEventsPage = vi.fn();
const mockGetEventsFull = vi.fn();
const mockGetDeploymentsPage = vi.fn();
const mockGetDeploymentsFull = vi.fn();

vi.mock('../../src/lambdas/powerbi-data-export/services/powerbi-export-service.js', () => ({
  PowerBiExportService: vi.fn().mockImplementation(() => ({
    getChecksPage: mockGetChecksPage,
    getChecksFull: mockGetChecksFull,
    getChecksByMonth: mockGetChecksByMonth,
    getChecksCurrentMonth: mockGetChecksCurrentMonth,
    getEventsPage: mockGetEventsPage,
    getEventsFull: mockGetEventsFull,
    getDeploymentsPage: mockGetDeploymentsPage,
    getDeploymentsFull: mockGetDeploymentsFull,
  })),
  mapPowerBiExportError: vi.fn((error: unknown) => {
    if (error instanceof Error) {
      return { message: error.message, statusCode: 500 };
    }
    return { message: 'Unknown error', statusCode: 500 };
  }),
}));

import { handler } from '../../src/lambdas/powerbi-data-export/handler.js';

function createMockEvent(
  path: string,
  queryStringParameters: APIGatewayProxyEvent['queryStringParameters'] = null,
): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path,
    pathParameters: null,
    queryStringParameters,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: path,
  };
}

const mockContext: Context = {
  awsRequestId: 'test-request-id',
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
  memoryLimitInMB: '512',
  logGroupName: '/aws/lambda/test',
  logStreamName: 'test-stream',
  getRemainingTimeInMillis: () => 60000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('powerbi-data-export handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated checks response', async () => {
    mockGetChecksPage.mockResolvedValue({
      data: [{ checkToken: 'maoy' }],
      nextToken: 'token-1',
    });

    const result = await handler(createMockEvent('/powerbi/checks', { limit: '10' }), mockContext);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body ?? '{}')).toMatchObject({
      data: [{ checkToken: 'maoy' }],
      count: 1,
      nextToken: 'token-1',
    });
  });

  it('returns full events response with generatedAt', async () => {
    mockGetEventsFull.mockResolvedValue([]);

    const result = await handler(createMockEvent('/powerbi/events/full'), mockContext);
    const body = JSON.parse(result.body ?? '{}');

    expect(result.statusCode).toBe(200);
    expect(body.count).toBe(0);
    expect(body.generatedAt).toBeDefined();
  });

  it('returns by-month checks with month and year metadata', async () => {
    mockGetChecksByMonth.mockResolvedValue({
      data: [{ checkToken: 'maoy' }],
      period: {
        month: 6,
        year: 2026,
        fromDate: '2026-06-01T00:00:00.000Z',
        toDate: '2026-06-30T23:59:59.999Z',
        fromDeploymentDate: '2026-06-01 00:00:00',
        toDeploymentDate: '2026-06-30 23:59:59',
      },
    });

    const result = await handler(
      createMockEvent('/powerbi/checks/by-month', { month: '6', year: '2026' }),
      mockContext,
    );
    const body = JSON.parse(result.body ?? '{}');

    expect(result.statusCode).toBe(200);
    expect(body.count).toBe(1);
    expect(body.month).toBe(6);
    expect(body.year).toBe(2026);
    expect(body.fromDate).toBe('2026-06-01T00:00:00.000Z');
  });

  it('returns current-month checks with month and year metadata', async () => {
    mockGetChecksCurrentMonth.mockResolvedValue({
      data: [{ checkToken: 'maoy' }],
      period: {
        month: 6,
        year: 2026,
        fromDate: '2026-06-01T00:00:00.000Z',
        toDate: '2026-06-30T23:59:59.999Z',
        fromDeploymentDate: '2026-06-01 00:00:00',
        toDeploymentDate: '2026-06-30 23:59:59',
      },
    });

    const result = await handler(
      createMockEvent('/powerbi/checks/current-month', { limit: '50' }),
      mockContext,
    );
    const body = JSON.parse(result.body ?? '{}');

    expect(result.statusCode).toBe(200);
    expect(mockGetChecksCurrentMonth).toHaveBeenCalledWith({ limit: '50' });
    expect(body.count).toBe(1);
    expect(body.month).toBe(6);
    expect(body.year).toBe(2026);
  });

  it('returns 404 for unknown route', async () => {
    const result = await handler(createMockEvent('/powerbi/unknown'), mockContext);
    expect(result.statusCode).toBe(404);
  });

  it('returns 405 for non-GET methods', async () => {
    const event = createMockEvent('/powerbi/checks');
    event.httpMethod = 'POST';

    const result = await handler(event, mockContext);
    expect(result.statusCode).toBe(405);
  });
});
