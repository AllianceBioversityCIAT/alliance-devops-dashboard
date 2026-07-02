import type { ScanFilter } from '../../../shared/repositories/dynamo-scan-repository.js';
import type { PowerBiExportConfig } from '../../../shared/config/powerbi-export.config.js';
import { DynamoScanRepository } from '../../../shared/repositories/dynamo-scan-repository.js';
import type { MonthPeriod } from '../date-window.js';
import {
  mapCheckExportItems,
  type CheckExportRecord,
} from '../mappers/check-export-mapper.js';
import {
  mapDeploymentExportItems,
  type DeploymentExportRecord,
} from '../mappers/deployment-export-mapper.js';
import {
  mapEventExportItems,
  type EventExportRecord,
} from '../mappers/event-export-mapper.js';
import { encodeNextToken } from '../pagination.js';

export interface PaginatedExportResult<T> {
  data: T[];
  nextToken?: string;
}

function checksMonthFilter(period: MonthPeriod): ScanFilter {
  return {
    filterExpression: '#updatedAt >= :fromDate AND #updatedAt <= :toDate',
    expressionAttributeNames: { '#updatedAt': 'updatedAt' },
    expressionAttributeValues: {
      ':fromDate': period.fromDate,
      ':toDate': period.toDate,
    },
  };
}

function eventsMonthFilter(period: MonthPeriod): ScanFilter {
  return {
    filterExpression: '#occurredAt >= :fromDate AND #occurredAt <= :toDate',
    expressionAttributeNames: { '#occurredAt': 'occurredAt' },
    expressionAttributeValues: {
      ':fromDate': period.fromDate,
      ':toDate': period.toDate,
    },
  };
}

function deploymentsMonthFilter(period: MonthPeriod): ScanFilter {
  return {
    filterExpression: '#buildDate >= :fromDate AND #buildDate <= :toDate',
    expressionAttributeNames: { '#buildDate': 'buildDate' },
    expressionAttributeValues: {
      ':fromDate': period.fromDeploymentDate,
      ':toDate': period.toDeploymentDate,
    },
  };
}

export class PowerBiCheckExportRepository {
  private readonly scanRepository: DynamoScanRepository;

  constructor(config: PowerBiExportConfig, scanRepository?: DynamoScanRepository) {
    this.scanRepository =
      scanRepository ??
      new DynamoScanRepository({
        tableName: config.checksTableName,
      });
  }

  async scanPage(
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<PaginatedExportResult<CheckExportRecord>> {
    const page = await this.scanRepository.scanPage(limit, exclusiveStartKey);
    return {
      data: mapCheckExportItems(page.items),
      nextToken: page.lastEvaluatedKey ? encodeNextToken(page.lastEvaluatedKey) : undefined,
    };
  }

  async scanPageByMonth(
    period: MonthPeriod,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<PaginatedExportResult<CheckExportRecord>> {
    const page = await this.scanRepository.scanFilteredPage(
      limit,
      checksMonthFilter(period),
      exclusiveStartKey,
    );
    return {
      data: mapCheckExportItems(page.items),
      nextToken: page.lastEvaluatedKey ? encodeNextToken(page.lastEvaluatedKey) : undefined,
    };
  }

  async scanAll(): Promise<CheckExportRecord[]> {
    const items = await this.scanRepository.scanAll();
    return mapCheckExportItems(items);
  }
}

export class PowerBiEventExportRepository {
  private readonly scanRepository: DynamoScanRepository;

  constructor(config: PowerBiExportConfig, scanRepository?: DynamoScanRepository) {
    this.scanRepository =
      scanRepository ??
      new DynamoScanRepository({
        tableName: config.eventsTableName,
      });
  }

  async scanPage(
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<PaginatedExportResult<EventExportRecord>> {
    const page = await this.scanRepository.scanPage(limit, exclusiveStartKey);
    return {
      data: mapEventExportItems(page.items),
      nextToken: page.lastEvaluatedKey ? encodeNextToken(page.lastEvaluatedKey) : undefined,
    };
  }

  async scanPageByMonth(
    period: MonthPeriod,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<PaginatedExportResult<EventExportRecord>> {
    const page = await this.scanRepository.scanFilteredPage(
      limit,
      eventsMonthFilter(period),
      exclusiveStartKey,
    );
    return {
      data: mapEventExportItems(page.items),
      nextToken: page.lastEvaluatedKey ? encodeNextToken(page.lastEvaluatedKey) : undefined,
    };
  }

  async scanAll(): Promise<EventExportRecord[]> {
    const items = await this.scanRepository.scanAll();
    return mapEventExportItems(items);
  }
}

export class PowerBiDeploymentExportRepository {
  private readonly scanRepository: DynamoScanRepository;

  constructor(config: PowerBiExportConfig, scanRepository?: DynamoScanRepository) {
    this.scanRepository =
      scanRepository ??
      new DynamoScanRepository({
        tableName: config.deploymentsTableName,
      });
  }

  async scanPage(
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<PaginatedExportResult<DeploymentExportRecord>> {
    const page = await this.scanRepository.scanPage(limit, exclusiveStartKey);
    return {
      data: mapDeploymentExportItems(page.items),
      nextToken: page.lastEvaluatedKey ? encodeNextToken(page.lastEvaluatedKey) : undefined,
    };
  }

  async scanPageByMonth(
    period: MonthPeriod,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<PaginatedExportResult<DeploymentExportRecord>> {
    const page = await this.scanRepository.scanFilteredPage(
      limit,
      deploymentsMonthFilter(period),
      exclusiveStartKey,
    );
    return {
      data: mapDeploymentExportItems(page.items),
      nextToken: page.lastEvaluatedKey ? encodeNextToken(page.lastEvaluatedKey) : undefined,
    };
  }

  async scanAll(): Promise<DeploymentExportRecord[]> {
    const items = await this.scanRepository.scanAll();
    return mapDeploymentExportItems(items);
  }
}
