import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { loadConfig } from '../../shared/config/index.js';
import { createLogger } from '../../shared/logger/index.js';
import type { UptimeEventType, UptimeStatus } from '../../shared/models/index.js';
import { createUptimeEvent } from '../../shared/models/uptime-event.js';
import { UptimeEventRepository } from '../../shared/repositories/index.js';
import {
  errorResponse,
  isNonEmptyString,
  parseJsonBody,
  successResponse,
  withErrorHandling,
} from '../../shared/utils/index.js';

/**
 * Updown ingestion Lambda handler.
 * Spec: specs/integrations/updown.md
 *
 * Accepts availability/downtime events from Updown webhooks or scheduled polls.
 * Does NOT call Updown API — payloads are normalized here.
 */

interface UpdownIngestionPayload {
  checkId: string;
  checkName: string;
  platformId: string;
  eventType: UptimeEventType;
  status: UptimeStatus;
  url?: string;
  responseTimeMs?: number;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  timestamp: string;
}

const config = loadConfig();
const logger = createLogger({
  serviceName: config.serviceName,
  level: config.logLevel,
  defaultContext: { lambda: 'updown-ingestion' },
});

function validatePayload(payload: UpdownIngestionPayload): string | null {
  if (!isNonEmptyString(payload.checkId)) return 'checkId is required';
  if (!isNonEmptyString(payload.checkName)) return 'checkName is required';
  if (!isNonEmptyString(payload.platformId)) return 'platformId is required';
  if (!isNonEmptyString(payload.timestamp)) return 'timestamp is required';

  const validStatuses: UptimeStatus[] = ['UP', 'DOWN', 'PAUSED'];
  if (!validStatuses.includes(payload.status)) return 'Invalid status value';

  const validEventTypes: UptimeEventType[] = ['STATUS_CHANGE', 'DOWNTIME_START', 'DOWNTIME_END'];
  if (!validEventTypes.includes(payload.eventType)) return 'Invalid eventType value';

  return null;
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const requestLogger = logger.child({ requestId: context.awsRequestId });

  return withErrorHandling(async () => {
    requestLogger.info('Processing Updown ingestion event');

    const payload = parseJsonBody<UpdownIngestionPayload>(event.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      requestLogger.warn('Validation failed', { error: validationError });
      return errorResponse(validationError, 400);
    }

    const uptimeEvent = createUptimeEvent({
      platformId: payload.platformId,
      source: 'UPDOWN',
      checkId: payload.checkId,
      checkName: payload.checkName,
      url: payload.url,
      eventType: payload.eventType,
      status: payload.status,
      responseTimeMs: payload.responseTimeMs,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      durationMs: payload.durationMs,
      errorMessage: payload.errorMessage,
      timestamp: payload.timestamp,
    });

    const repository = new UptimeEventRepository({
      tableName: config.dynamodb.eventsTableName,
      region: config.awsRegion,
    });

    await repository.save(uptimeEvent);

    requestLogger.info('Uptime event persisted', {
      eventId: uptimeEvent.id,
      platformId: uptimeEvent.platformId,
      eventType: uptimeEvent.eventType,
    });

    return successResponse(
      {
        message: 'Uptime event ingested',
        eventId: uptimeEvent.id,
      },
      201,
    );
  }, requestLogger);
}
