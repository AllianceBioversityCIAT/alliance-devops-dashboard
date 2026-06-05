import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { loadUpdownAlertConfig } from '../../shared/config/updown-alert.config.js';
import { createLogger } from '../../shared/logger/index.js';
import { InMemoryUpdownCheckRepository } from '../../shared/repositories/in-memory-updown-check-repository.js';
import { InMemoryUptimeEventRepository } from '../../shared/repositories/in-memory-uptime-event-repository.js';
import { UpdownCheckRepository } from '../../shared/repositories/updown-check-repository.js';
import type { UpdownCheckStore } from '../../shared/repositories/updown-check-store.js';
import { UptimeEventRepository } from '../../shared/repositories/uptime-event-repository.js';
import type { UptimeEventStore } from '../../shared/repositories/uptime-event-store.js';
import { UpdownAlertService, mapServiceError } from '../../shared/services/updown-alert-service.js';
import { errorResponse, successResponse } from '../../shared/utils/index.js';

/**
 * Updown alert ingestion Lambda handler.
 * Spec: specs/integrations/updown.md
 */

let service: UpdownAlertService | undefined;

function getService(): UpdownAlertService {
  if (!service) {
    const config = loadUpdownAlertConfig();
    const logger = createLogger({
      serviceName: config.appName,
      level: config.logLevel,
      defaultContext: { lambda: config.lambdaName, environment: config.environment },
    });

    const checkStore: UpdownCheckStore =
      config.updownChecksTable === 'local'
        ? new InMemoryUpdownCheckRepository()
        : new UpdownCheckRepository({
            tableName: config.updownChecksTable,
          });

    const eventStore: UptimeEventStore =
      config.uptimeEventsTable === 'local'
        ? new InMemoryUptimeEventRepository()
        : new UptimeEventRepository({
            tableName: config.uptimeEventsTable,
          });

    service = new UpdownAlertService(config, eventStore, checkStore, logger);
  }
  return service;
}

function normalizeHeaders(
  headers: APIGatewayProxyEvent['headers'],
): Record<string, string | undefined> {
  const normalized: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const config = loadUpdownAlertConfig();
  const logger = createLogger({
    serviceName: config.appName,
    level: config.logLevel,
    defaultContext: {
      lambda: config.lambdaName,
      environment: config.environment,
      requestId: context.awsRequestId,
    },
  });

  try {
    logger.info('Processing Updown alert webhook');

    const headers = normalizeHeaders(event.headers);
    const result = await getService().processWebhook({
      body: event.body,
      headers: { 'x-webhook-secret': headers['x-webhook-secret'] },
    });

    logger.info('Updown alert webhook processed', {
      processed: result.processed,
      stored: result.stored,
      duplicates: result.duplicates,
      registeredChecks: result.registeredChecks,
    });

    return successResponse({
      message: 'Updown alert events processed',
      processed: result.processed,
      stored: result.stored,
      duplicates: result.duplicates,
      registeredChecks: result.registeredChecks,
      eventIds: result.eventIds,
    });
  } catch (error) {
    const mapped = mapServiceError(error);

    if (mapped.statusCode >= 500) {
      logger.error('Handler error', { error: mapped.message });
    } else {
      logger.warn('Request rejected', {
        statusCode: mapped.statusCode,
        error: mapped.message,
      });
    }

    return errorResponse(mapped.message, mapped.statusCode);
  }
}
