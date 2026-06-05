import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../src/lambdas/updown-alert-ingestion/handler.js';
import { resetUpdownAlertConfigCache } from '../src/shared/config/updown-alert.config.js';

const PORT = Number(process.env.LOCAL_PORT ?? 3000);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function buildApiGatewayEvent(
  req: IncomingMessage,
  body: string,
  path: string,
): APIGatewayProxyEvent {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value.join(',') : value;
    }
  }

  return {
    body,
    headers,
    multiValueHeaders: {},
    httpMethod: req.method ?? 'GET',
    isBase64Encoded: false,
    path,
    pathParameters: null,
    queryStringParameters: null,
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
  functionName: 'updown-alert-ingestion-local',
  functionVersion: 'local',
  invokedFunctionArn: 'arn:aws:lambda:local:0:function:updown-alert-ingestion',
  memoryLimitInMB: '256',
  logGroupName: '/aws/lambda/local',
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 30_000,
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

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === 'GET' && path === '/docs') {
    await serveStatic(res, join(ROOT, 'docs/openapi/swagger-ui.html'), 'text/html; charset=utf-8');
    return;
  }

  if (req.method === 'GET' && path === '/docs/openapi/updown-alerts.yaml') {
    await serveStatic(res, join(ROOT, 'docs/openapi/updown-alerts.yaml'), 'application/yaml');
    return;
  }

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { ...corsHeaders(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'updown-alert-ingestion-local' }));
    return;
  }

  if (req.method === 'POST' && path === '/api/webhooks/updown/alerts') {
    const body = await readBody(req);
    const event = buildApiGatewayEvent(req, body, path);
    const result = await handler(event, mockContext);

    res.writeHead(result.statusCode, {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    });
    res.end(result.body);
    return;
  }

  res.writeHead(404, { ...corsHeaders(), 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function validateLocalEnv(): void {
  if (process.env.UPTIME_EVENTS_TABLE !== 'local' || process.env.UPDOWN_CHECKS_TABLE !== 'local') {
    console.warn(
      'Tip: set UPTIME_EVENTS_TABLE=local and UPDOWN_CHECKS_TABLE=local for in-memory mode (no AWS).',
    );
  }

  if (!process.env.UPDOWN_WEBHOOK_SECRET) {
    throw new Error('Missing UPDOWN_WEBHOOK_SECRET in .env');
  }
}

resetUpdownAlertConfigCache();
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
  console.log('  Alliance DevOps Dashboard — Local Updown API');
  console.log('  --------------------------------------------');
  console.log(`  Swagger UI:  http://localhost:${PORT}/docs`);
  console.log(`  Webhook API: http://localhost:${PORT}/api/webhooks/updown/alerts`);
  console.log(`  Health:      http://localhost:${PORT}/health`);
  console.log('');
  console.log('  Use x-webhook-secret header = value from UPDOWN_WEBHOOK_SECRET in .env');
  console.log('  Checks are auto-registered — use token "maoy" for BI PRMS Front sample');
  console.log('');
});
