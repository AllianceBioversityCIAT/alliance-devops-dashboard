import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../../src/lambdas/jenkins-ingestion/handler.js';

vi.mock('../../src/shared/repositories/index.js', () => ({
  DeploymentEventRepository: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(undefined),
    getIdempotencyKey: vi.fn().mockReturnValue('test-key'),
  })),
}));

function createMockEvent(body: unknown): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/ingest/jenkins',
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

describe('jenkins-ingestion handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 for valid payload', async () => {
    const event = createMockEvent({
      jobName: 'alliance-portal/deploy-production',
      buildNumber: 142,
      status: 'SUCCESS',
      environment: 'production',
      platformId: 'alliance-portal',
      timestamp: '2026-06-05T14:30:00.000Z',
    });

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Deployment event ingested');
    expect(body.eventId).toBeDefined();
  });

  it('returns 400 for invalid payload', async () => {
    const event = createMockEvent({
      jobName: '',
      buildNumber: -1,
      status: 'SUCCESS',
      environment: 'production',
      platformId: 'alliance-portal',
      timestamp: '2026-06-05T14:30:00.000Z',
    });

    const result = await handler(event, mockContext);

    expect(result.statusCode).toBe(400);
  });
});
