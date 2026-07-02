import type { APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';
import type { PowerBiExportService } from '../services/powerbi-export-service.js';
import type { PaginationInput } from '../pagination.js';
import { paginatedResponse, fullResponse, byMonthResponse } from '../responses.js';

function queryParams(
  params: APIGatewayProxyEventQueryStringParameters | null,
): PaginationInput {
  return {
    limit: params?.limit,
    nextToken: params?.nextToken,
    month: params?.month,
    year: params?.year,
  };
}

export class ChecksController {
  constructor(private readonly service: PowerBiExportService) {}

  async getPage(params: APIGatewayProxyEventQueryStringParameters | null) {
    const result = await this.service.getChecksPage(queryParams(params));
    return paginatedResponse(result.data, result.nextToken);
  }

  async getFull() {
    const data = await this.service.getChecksFull();
    return fullResponse(data);
  }

  async getByMonth(params: APIGatewayProxyEventQueryStringParameters | null) {
    const result = await this.service.getChecksByMonth(queryParams(params));
    return byMonthResponse(result.data, result.period, result.nextToken);
  }
}

export class EventsController {
  constructor(private readonly service: PowerBiExportService) {}

  async getPage(params: APIGatewayProxyEventQueryStringParameters | null) {
    const result = await this.service.getEventsPage(queryParams(params));
    return paginatedResponse(result.data, result.nextToken);
  }

  async getFull() {
    const data = await this.service.getEventsFull();
    return fullResponse(data);
  }

  async getByMonth(params: APIGatewayProxyEventQueryStringParameters | null) {
    const result = await this.service.getEventsByMonth(queryParams(params));
    return byMonthResponse(result.data, result.period, result.nextToken);
  }
}

export class DeploymentsController {
  constructor(private readonly service: PowerBiExportService) {}

  async getPage(params: APIGatewayProxyEventQueryStringParameters | null) {
    const result = await this.service.getDeploymentsPage(queryParams(params));
    return paginatedResponse(result.data, result.nextToken);
  }

  async getFull() {
    const data = await this.service.getDeploymentsFull();
    return fullResponse(data);
  }

  async getByMonth(params: APIGatewayProxyEventQueryStringParameters | null) {
    const result = await this.service.getDeploymentsByMonth(queryParams(params));
    return byMonthResponse(result.data, result.period, result.nextToken);
  }
}
