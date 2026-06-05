import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

vi.mock('../../src/shared/config/updown-alert.config.js', () => ({
  loadUpdownAlertConfig: vi.fn(() => ({
    appName: 'alliance-devops-dashboard',
    lambdaName: 'updown-alert-ingestion',
    environment: 'dev',
    logLevel: 'info',
    uptimeEventsTable: 'alliance-devops-uptime-events-dev',
    updownWebhookSecret: 'test-secret',
  })),
}));

const mockProcessWebhook = vi.fn();

vi.mock('../../src/shared/services/updown-alert-service.js', async () => {
  const actual = await vi.importActual('../../src/shared/services/updown-alert-service.js');
  return {
    ...actual,
    UpdownAlertService: vi.fn().mockImplementation(() => ({
      processWebhook: mockProcessWebhook,
    })),
  };
});

import { handler } from '../../src/lambdas/updown-alert-ingestion/handler.js';

function createMockEvent(body: unknown, secret = 'test-secret'): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    headers: { 'x-webhook-secret': secret },
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/api/webhooks/updown/alerts',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '',
  };
}

const mockContext: Context = {
  awsRequestId: 'test-request-id',
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
  memoryLimitInMB: '256',
  logGroupName: '/aws/lambda/test',
  logStreamName: 'test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('updown-alert-ingestion handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 when service processes webhook successfully', async () => {
    mockProcessWebhook.mockResolvedValue({
      processed: 1,
      stored: 1,
      duplicates: 0,
      eventIds: ['upt_test'],
    });

    const event = createMockEvent([
      {
        event: 'check.down',
        time: '2026-06-05T15:55:15Z',
        check: { token: 'maoy', url: 'https://prmsbi.alliance.com.py' },
      },
    ]);

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.stored).toBe(1);
    expect(body.eventIds).toEqual(['upt_test']);
  });

  it('returns 401 when service rejects invalid secret', async () => {
    const { UpdownWebhookAuthError } = await import(
      '../../src/shared/services/updown-webhook-validator.js'
    );
    mockProcessWebhook.mockRejectedValue(new UpdownWebhookAuthError('Invalid or missing webhook secret'));

    const result = await handler(createMockEvent([], 'bad-secret'), mockContext);

    expect(result.statusCode).toBe(401);
  });
});
