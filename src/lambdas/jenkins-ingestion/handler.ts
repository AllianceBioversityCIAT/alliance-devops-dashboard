import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { loadConfig } from '../../shared/config/index.js';
import { createLogger } from '../../shared/logger/index.js';
import { createDeploymentEvent } from '../../shared/models/deployment-event.js';
import type { DeploymentStatus } from '../../shared/models/index.js';
import { DeploymentEventRepository } from '../../shared/repositories/index.js';
import {
  errorResponse,
  isNonEmptyString,
  isPositiveInteger,
  parseJsonBody,
  successResponse,
  withErrorHandling,
} from '../../shared/utils/index.js';

/**
 * Jenkins ingestion Lambda handler.
 * Spec: specs/integrations/jenkins.md
 *
 * Accepts deployment/build events, validates against spec, and persists to DynamoDB.
 * Does NOT call Jenkins API — webhook/poll payloads are normalized here.
 */

interface JenkinsIngestionPayload {
  jobName: string;
  buildNumber: number;
  status: DeploymentStatus;
  environment: string;
  platformId: string;
  version?: string;
  branch?: string;
  commitSha?: string;
  durationMs?: number;
  triggeredBy?: string;
  timestamp: string;
}

const config = loadConfig();
const logger = createLogger({
  serviceName: config.serviceName,
  level: config.logLevel,
  defaultContext: { lambda: 'jenkins-ingestion' },
});

function validatePayload(payload: JenkinsIngestionPayload): string | null {
  if (!isNonEmptyString(payload.jobName)) return 'jobName is required';
  if (!isPositiveInteger(payload.buildNumber)) return 'buildNumber must be a positive integer';
  if (!isNonEmptyString(payload.environment)) return 'environment is required';
  if (!isNonEmptyString(payload.platformId)) return 'platformId is required';
  if (!isNonEmptyString(payload.timestamp)) return 'timestamp is required';

  const validStatuses: DeploymentStatus[] = ['SUCCESS', 'FAILURE', 'UNSTABLE', 'ABORTED'];
  if (!validStatuses.includes(payload.status)) return 'Invalid status value';

  return null;
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const requestLogger = logger.child({ requestId: context.awsRequestId });

  return withErrorHandling(async () => {
    requestLogger.info('Processing Jenkins ingestion event');

    const payload = parseJsonBody<JenkinsIngestionPayload>(event.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      requestLogger.warn('Validation failed', { error: validationError });
      return errorResponse(validationError, 400);
    }

    const deploymentEvent = createDeploymentEvent({
      platformId: payload.platformId,
      source: 'JENKINS',
      jobName: payload.jobName,
      buildNumber: payload.buildNumber,
      status: payload.status,
      environment: payload.environment,
      version: payload.version,
      branch: payload.branch,
      commitSha: payload.commitSha,
      durationMs: payload.durationMs,
      triggeredBy: payload.triggeredBy,
      timestamp: payload.timestamp,
    });

    const repository = new DeploymentEventRepository({
      tableName: config.dynamodb.eventsTableName,
      region: config.awsRegion,
    });

    await repository.save(deploymentEvent);

    requestLogger.info('Deployment event persisted', {
      eventId: deploymentEvent.id,
      platformId: deploymentEvent.platformId,
      idempotencyKey: repository.getIdempotencyKey(deploymentEvent),
    });

    return successResponse(
      {
        message: 'Deployment event ingested',
        eventId: deploymentEvent.id,
      },
      201,
    );
  }, requestLogger);
}
