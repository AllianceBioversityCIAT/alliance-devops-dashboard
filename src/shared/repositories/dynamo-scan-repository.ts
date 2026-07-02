import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

export interface DynamoScanRepositoryOptions {
  tableName: string;
  region?: string;
  client?: DynamoDBDocumentClient;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
}

export interface ScanPage {
  items: Record<string, unknown>[];
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface ScanFilter {
  filterExpression: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
}

export class DynamoScanRepository {
  protected readonly tableName: string;
  protected readonly client: DynamoDBDocumentClient;
  private readonly defaultFilter?: ScanFilter;

  constructor(options: DynamoScanRepositoryOptions) {
    this.tableName = options.tableName;
    this.defaultFilter = options.filterExpression
      ? {
          filterExpression: options.filterExpression,
          expressionAttributeNames: options.expressionAttributeNames,
          expressionAttributeValues: options.expressionAttributeValues,
        }
      : undefined;

    if (options.client) {
      this.client = options.client;
    } else {
      const clientConfig: DynamoDBClientConfig = {};
      if (options.region) {
        clientConfig.region = options.region;
      }
      const dynamoClient = new DynamoDBClient(clientConfig);
      this.client = DynamoDBDocumentClient.from(dynamoClient, {
        marshallOptions: { removeUndefinedValues: true },
      });
    }
  }

  async scanPage(
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
    filter?: ScanFilter,
  ): Promise<ScanPage> {
    const activeFilter = filter ?? this.defaultFilter;
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
        ...(activeFilter
          ? {
              FilterExpression: activeFilter.filterExpression,
              ExpressionAttributeNames: activeFilter.expressionAttributeNames,
              ExpressionAttributeValues: activeFilter.expressionAttributeValues,
            }
          : {}),
      }),
    );

    return {
      items: (result.Items ?? []) as Record<string, unknown>[],
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }

  async scanAll(pageSize = 1000, filter?: ScanFilter): Promise<Record<string, unknown>[]> {
    const items: Record<string, unknown>[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const page = await this.scanPage(pageSize, exclusiveStartKey, filter);
      items.push(...page.items);
      exclusiveStartKey = page.lastEvaluatedKey;
    } while (exclusiveStartKey);

    return items;
  }

  /**
   * Keeps scanning until `limit` matching items are collected or the table is exhausted.
   * Avoids returning nextToken when no more matching records remain.
   */
  async scanFilteredPage(
    limit: number,
    filter: ScanFilter,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<ScanPage> {
    const items: Record<string, unknown>[] = [];
    let cursor = exclusiveStartKey;

    while (items.length < limit) {
      const page = await this.scanPage(limit, cursor, filter);
      items.push(...page.items);
      cursor = page.lastEvaluatedKey;

      if (!cursor) {
        break;
      }
    }

    const trimmed = items.slice(0, limit);
    const hasMoreMatchingPages = trimmed.length === limit && Boolean(cursor);

    return {
      items: trimmed,
      lastEvaluatedKey: hasMoreMatchingPages ? cursor : undefined,
    };
  }
}
