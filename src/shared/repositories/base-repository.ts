import {
  DynamoDBClient,
  ConditionalCheckFailedException,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

export interface RepositoryOptions {
  tableName: string;
  region?: string;
  client?: DynamoDBDocumentClient;
}

export interface QueryOptions {
  pk: string;
  skPrefix?: string;
  limit?: number;
  scanIndexForward?: boolean;
  indexName?: string;
}

export abstract class BaseDynamoDbRepository<T> {
  protected readonly tableName: string;
  protected readonly client: DynamoDBDocumentClient;

  constructor(options: RepositoryOptions) {
    this.tableName = options.tableName;

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

  protected abstract toItem(entity: T): Record<string, unknown>;
  protected abstract fromItem(item: Record<string, unknown>): T;
  protected abstract getPrimaryKey(entity: T): { PK: string; SK: string };

  async save(entity: T): Promise<T> {
    const item = this.toItem(entity);
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );
    return entity;
  }

  async saveIfNotExists(entity: T): Promise<boolean> {
    const item = this.toItem(entity);

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
        }),
      );
      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }
      throw error;
    }
  }

  async get(pk: string, sk: string): Promise<T | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
      }),
    );

    if (!result.Item) {
      return null;
    }

    return this.fromItem(result.Item as Record<string, unknown>);
  }

  async query(options: QueryOptions): Promise<T[]> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: options.skPrefix
        ? 'PK = :pk AND begins_with(SK, :skPrefix)'
        : 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': options.pk,
        ...(options.skPrefix ? { ':skPrefix': options.skPrefix } : {}),
      },
      Limit: options.limit,
      ScanIndexForward: options.scanIndexForward ?? false,
    };

    if (options.indexName) {
      params.IndexName = options.indexName;
    }

    const result = await this.client.send(new QueryCommand(params));
    return (result.Items ?? []).map((item) =>
      this.fromItem(item as Record<string, unknown>),
    );
  }
}
