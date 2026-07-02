import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { loadPowerBiExportConfig } from '../../shared/config/powerbi-export.config.js';
import { createLogger } from '../../shared/logger/index.js';
import { createPowerBiRouter } from './router.js';
import { PowerBiExportService } from './services/powerbi-export-service.js';
import { internalErrorResponse } from './responses.js';
import { mapPowerBiExportError } from './services/powerbi-export-service.js';

/**
 * Power BI data export Lambda handler.
 * Spec: specs/integrations/powerbi-export.md
 *
 * API key validation is handled by API Gateway (x-api-key), not in this handler.
 */

let service: PowerBiExportService | undefined;
let router: ReturnType<typeof createPowerBiRouter> | undefined;

function getRouter(): ReturnType<typeof createPowerBiRouter> {
  if (!router) {
    const config = loadPowerBiExportConfig();
    const logger = createLogger({
      serviceName: config.appName,
      level: config.logLevel,
      defaultContext: { lambda: config.lambdaName, environment: config.environment },
    });
    service = new PowerBiExportService(config, logger);
    router = createPowerBiRouter(service);
  }
  return router;
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const config = loadPowerBiExportConfig();
  const logger = createLogger({
    serviceName: config.appName,
    level: config.logLevel,
    defaultContext: {
      lambda: config.lambdaName,
      environment: config.environment,
      requestId: context.awsRequestId,
      path: event.path,
      method: event.httpMethod,
    },
  });

  if (event.httpMethod !== 'GET') {
    logger.warn('Method not allowed', { method: event.httpMethod });
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    logger.info('Handling Power BI export request');
    const result = await getRouter().route(event);
    logger.info('Power BI export request completed', { statusCode: result.statusCode });
    return result;
  } catch (error) {
    const mapped = mapPowerBiExportError(error);
    if (mapped.statusCode >= 500) {
      logger.error('Unhandled export error', { error: mapped.message });
    } else {
      logger.warn('Export request rejected', {
        statusCode: mapped.statusCode,
        error: mapped.message,
      });
    }
    return internalErrorResponse(mapped.message);
  }
}
