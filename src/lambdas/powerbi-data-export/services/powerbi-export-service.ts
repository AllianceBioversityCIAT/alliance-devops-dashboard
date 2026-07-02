import type { Logger } from '../../../shared/logger/index.js';
import type { PowerBiExportConfig } from '../../../shared/config/powerbi-export.config.js';
import { PaginationError, resolvePagination, type PaginationInput } from '../pagination.js';
import { PeriodError, resolveMonthPeriod, type MonthPeriod } from '../date-window.js';
import {
  PowerBiCheckExportRepository,
  PowerBiDeploymentExportRepository,
  PowerBiEventExportRepository,
  type PaginatedExportResult,
} from '../repositories/index.js';
import type { CheckExportRecord } from '../mappers/check-export-mapper.js';
import type { EventExportRecord } from '../mappers/event-export-mapper.js';
import type { DeploymentExportRecord } from '../mappers/deployment-export-mapper.js';

export interface PaginatedExportResultWithPeriod<T> extends PaginatedExportResult<T> {
  period: MonthPeriod;
}

export class PowerBiExportError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'PowerBiExportError';
  }
}

export function mapPowerBiExportError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof PaginationError || error instanceof PeriodError) {
    return { message: error.message, statusCode: 400 };
  }

  if (error instanceof PowerBiExportError) {
    return { message: error.message, statusCode: error.statusCode };
  }

  if (error instanceof Error) {
    return { message: error.message, statusCode: 500 };
  }

  return { message: 'Unknown error', statusCode: 500 };
}

export class PowerBiExportService {
  private readonly checkRepository: PowerBiCheckExportRepository;
  private readonly eventRepository: PowerBiEventExportRepository;
  private readonly deploymentRepository: PowerBiDeploymentExportRepository;
  private readonly logger: Logger;

  constructor(
    config: PowerBiExportConfig,
    logger: Logger,
    repositories?: {
      checks?: PowerBiCheckExportRepository;
      events?: PowerBiEventExportRepository;
      deployments?: PowerBiDeploymentExportRepository;
    },
  ) {
    this.checkRepository = repositories?.checks ?? new PowerBiCheckExportRepository(config);
    this.eventRepository = repositories?.events ?? new PowerBiEventExportRepository(config);
    this.deploymentRepository =
      repositories?.deployments ?? new PowerBiDeploymentExportRepository(config);
    this.logger = logger;
  }

  async getChecksPage(input: PaginationInput): Promise<PaginatedExportResult<CheckExportRecord>> {
    const pagination = resolvePagination(input);
    this.logger.info('Fetching checks page', { limit: pagination.limit });
    return this.checkRepository.scanPage(pagination.limit, pagination.exclusiveStartKey);
  }

  async getChecksFull(): Promise<CheckExportRecord[]> {
    this.logger.info('Fetching full checks export');
    return this.checkRepository.scanAll();
  }

  async getChecksByMonth(
    input: PaginationInput,
  ): Promise<PaginatedExportResultWithPeriod<CheckExportRecord>> {
    const pagination = resolvePagination(input);
    const period = resolveMonthPeriod(input);
    this.logger.info('Fetching checks by month', {
      limit: pagination.limit,
      month: period.month,
      year: period.year,
    });
    const result = await this.checkRepository.scanPageByMonth(
      period,
      pagination.limit,
      pagination.exclusiveStartKey,
    );
    return { ...result, period };
  }

  async getChecksCurrentMonth(
    input: PaginationInput,
  ): Promise<PaginatedExportResultWithPeriod<CheckExportRecord>> {
    const now = new Date();
    return this.getChecksByMonth({
      ...input,
      month: String(now.getUTCMonth() + 1),
      year: String(now.getUTCFullYear()),
    });
  }

  async getEventsPage(input: PaginationInput): Promise<PaginatedExportResult<EventExportRecord>> {
    const pagination = resolvePagination(input);
    this.logger.info('Fetching events page', { limit: pagination.limit });
    return this.eventRepository.scanPage(pagination.limit, pagination.exclusiveStartKey);
  }

  async getEventsFull(): Promise<EventExportRecord[]> {
    this.logger.info('Fetching full events export');
    return this.eventRepository.scanAll();
  }

  async getEventsByMonth(
    input: PaginationInput,
  ): Promise<PaginatedExportResultWithPeriod<EventExportRecord>> {
    const pagination = resolvePagination(input);
    const period = resolveMonthPeriod(input);
    this.logger.info('Fetching events by month', {
      limit: pagination.limit,
      month: period.month,
      year: period.year,
    });
    const result = await this.eventRepository.scanPageByMonth(
      period,
      pagination.limit,
      pagination.exclusiveStartKey,
    );
    return { ...result, period };
  }

  async getEventsCurrentMonth(
    input: PaginationInput,
  ): Promise<PaginatedExportResultWithPeriod<EventExportRecord>> {
    const now = new Date();
    return this.getEventsByMonth({
      ...input,
      month: String(now.getUTCMonth() + 1),
      year: String(now.getUTCFullYear()),
    });
  }

  async getDeploymentsPage(
    input: PaginationInput,
  ): Promise<PaginatedExportResult<DeploymentExportRecord>> {
    const pagination = resolvePagination(input);
    this.logger.info('Fetching deployments page', { limit: pagination.limit });
    return this.deploymentRepository.scanPage(pagination.limit, pagination.exclusiveStartKey);
  }

  async getDeploymentsFull(): Promise<DeploymentExportRecord[]> {
    this.logger.info('Fetching full deployments export');
    return this.deploymentRepository.scanAll();
  }

  async getDeploymentsByMonth(
    input: PaginationInput,
  ): Promise<PaginatedExportResultWithPeriod<DeploymentExportRecord>> {
    const pagination = resolvePagination(input);
    const period = resolveMonthPeriod(input);
    this.logger.info('Fetching deployments by month', {
      limit: pagination.limit,
      month: period.month,
      year: period.year,
    });
    const result = await this.deploymentRepository.scanPageByMonth(
      period,
      pagination.limit,
      pagination.exclusiveStartKey,
    );
    return { ...result, period };
  }

  async getDeploymentsCurrentMonth(
    input: PaginationInput,
  ): Promise<PaginatedExportResultWithPeriod<DeploymentExportRecord>> {
    const now = new Date();
    return this.getDeploymentsByMonth({
      ...input,
      month: String(now.getUTCMonth() + 1),
      year: String(now.getUTCFullYear()),
    });
  }
}
