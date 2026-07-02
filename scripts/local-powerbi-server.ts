import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../src/lambdas/powerbi-data-export/handler.js';
import { resetPowerBiExportConfigCache } from '../src/shared/config/powerbi-export.config.js';

const PORT = Number(process.env.LOCAL_POWERBI_PORT ?? 3001);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const POWERBI_PATHS = [
  '/powerbi/checks',
  '/powerbi/checks/full',
  '/powerbi/checks/by-month',
  '/powerbi/checks/current-month',
  '/powerbi/events',
  '/powerbi/events/full',
  '/powerbi/events/by-month',
  '/powerbi/events/current-month',
  '/powerbi/deployments',
  '/powerbi/deployments/full',
  '/powerbi/deployments/by-month',
  '/powerbi/deployments/current-month',
];

function buildApiGatewayEvent(req: IncomingMessage, path: string): APIGatewayProxyEvent {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value.join(',') : value;
    }
  }

  const queryStringParameters: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value;
  });

  return {
    body: null,
    headers,
    multiValueHeaders: {},
    httpMethod: req.method ?? 'GET',
    isBase64Encoded: false,
    path,
    pathParameters: null,
    queryStringParameters:
      Object.keys(queryStringParameters).length > 0 ? queryStringParameters : null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      authorizer: undefined,
      protocol: 'HTTP/1.1',
      httpMethod: req.method ?? 'GET',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: req.headers['user-agent'] ?? 'local',
        userArn: null,
      },
      path,
      stage: 'local',
      requestId: `local-${Date.now()}`,
      requestTimeEpoch: Date.now(),
      resourceId: 'local',
      resourcePath: path,
    },
    resource: path,
  };
}

const mockContext: Context = {
  awsRequestId: `local-${Date.now()}`,
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'powerbi-data-export-local',
  functionVersion: 'local',
  invokedFunctionArn: 'arn:aws:lambda:local:0:function:powerbi-data-export',
  memoryLimitInMB: '512',
  logGroupName: '/aws/lambda/local',
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 60_000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

async function serveStatic(res: ServerResponse, filePath: string, contentType: string): Promise<void> {
  const content = await readFile(filePath, 'utf8');
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/docs/openapi/powerbi-export.yaml') {
    await serveStatic(res, join(ROOT, 'docs/openapi/powerbi-export.yaml'), 'application/yaml');
    return;
  }

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'powerbi-data-export-local' }));
    return;
  }

  if (req.method === 'GET' && POWERBI_PATHS.includes(path)) {
    const event = buildApiGatewayEvent(req, path);
    const result = await handler(event, mockContext);
    res.writeHead(result.statusCode, { 'Content-Type': 'application/json' });
    res.end(result.body);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

function validateLocalEnv(): void {
  process.env.APP_NAME ??= 'alliance-devops-dashboard';
  process.env.LAMBDA_NAME = 'powerbi-data-export';
  process.env.ENVIRONMENT ??= 'dev';

  const required = [
    'CHECKS_TABLE_NAME',
    'EVENTS_TABLE_NAME',
    'DEPLOYMENTS_TABLE_NAME',
    'DEPLOYMENT_METADATA_TABLE_NAME',
  ];

  for (const name of required) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
}

resetPowerBiExportConfigCache();
validateLocalEnv();

const server = createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Alliance DevOps Dashboard — Local Power BI Export API');
  console.log('  -----------------------------------------------------');
  console.log(`  OpenAPI:  http://localhost:${PORT}/docs/openapi/powerbi-export.yaml`);
  console.log(`  Health:   http://localhost:${PORT}/health`);
  console.log('');
  console.log('  Endpoints (local mode does not enforce x-api-key):');
  for (const route of POWERBI_PATHS) {
    console.log(`    GET http://localhost:${PORT}${route}`);
  }
  console.log('');
  console.log('  Requires AWS credentials for DynamoDB reads against configured table names.');
  console.log('');
});
