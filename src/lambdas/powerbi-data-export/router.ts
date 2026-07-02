import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  ChecksController,
  DeploymentsController,
  EventsController,
} from './controllers/index.js';
import type { PowerBiExportService } from './services/powerbi-export-service.js';
import { badRequestResponse, internalErrorResponse, notFoundResponse } from './responses.js';
import { mapPowerBiExportError } from './services/powerbi-export-service.js';

export interface PowerBiRouter {
  route(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
}

export function createPowerBiRouter(service: PowerBiExportService): PowerBiRouter {
  const checksController = new ChecksController(service);
  const eventsController = new EventsController(service);
  const deploymentsController = new DeploymentsController(service);

  const routes: Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> = {
    'GET /powerbi/checks/full': async () => checksController.getFull(),
    'GET /powerbi/checks/by-month': async (event) =>
      checksController.getByMonth(event.queryStringParameters),
    'GET /powerbi/checks/current-month': async (event) =>
      checksController.getCurrentMonth(event.queryStringParameters),
    'GET /powerbi/checks': async (event) => checksController.getPage(event.queryStringParameters),
    'GET /powerbi/events/full': async () => eventsController.getFull(),
    'GET /powerbi/events/by-month': async (event) =>
      eventsController.getByMonth(event.queryStringParameters),
    'GET /powerbi/events/current-month': async (event) =>
      eventsController.getCurrentMonth(event.queryStringParameters),
    'GET /powerbi/events': async (event) => eventsController.getPage(event.queryStringParameters),
    'GET /powerbi/deployments/full': async () => deploymentsController.getFull(),
    'GET /powerbi/deployments/by-month': async (event) =>
      deploymentsController.getByMonth(event.queryStringParameters),
    'GET /powerbi/deployments/current-month': async (event) =>
      deploymentsController.getCurrentMonth(event.queryStringParameters),
    'GET /powerbi/deployments': async (event) =>
      deploymentsController.getPage(event.queryStringParameters),
  };

  return {
    async route(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
      const routeKey = `${event.httpMethod} ${normalizePath(event.path)}`;
      const handler = routes[routeKey];

      if (!handler) {
        return notFoundResponse();
      }

      try {
        return await handler(event);
      } catch (error) {
        const mapped = mapPowerBiExportError(error);
        if (mapped.statusCode === 400) {
          return badRequestResponse(mapped.message);
        }
        return internalErrorResponse(mapped.message);
      }
    },
  };
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}
