import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';

export interface DeploymentMetadataRecord {
  applicationName: string;
  environment: string;
  projectName: string;
}

export interface DeploymentMetadataRepositoryOptions {
  tableName: string;
  region?: string;
  client?: DynamoDBDocumentClient;
}

function asString(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

function mapMetadataItem(item: Record<string, unknown>): DeploymentMetadataRecord {
  return {
    applicationName: asString(item.application_name),
    environment: asString(item.environment),
    projectName: asString(item.project_name),
  };
}

export class DeploymentMetadataRepository {
  private readonly tableName: string;
  private readonly client: DynamoDBDocumentClient;

  constructor(options: DeploymentMetadataRepositoryOptions) {
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

  async getByJobNames(jobNames: string[]): Promise<Map<string, DeploymentMetadataRecord>> {
    const uniqueJobNames = [...new Set(jobNames.filter((name) => name.length > 0))];
    const metadataByJob = new Map<string, DeploymentMetadataRecord>();

    if (uniqueJobNames.length === 0) {
      return metadataByJob;
    }

    for (let index = 0; index < uniqueJobNames.length; index += 100) {
      const batch = uniqueJobNames.slice(index, index + 100);
      const response = await this.client.send(
        new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: batch.map((jobName) => ({ job_name: jobName })),
            },
          },
        }),
      );

      for (const item of response.Responses?.[this.tableName] ?? []) {
        const jobName = asString(item.job_name);
        if (!jobName) {
          continue;
        }
        metadataByJob.set(jobName, mapMetadataItem(item as Record<string, unknown>));
      }
    }

    return metadataByJob;
  }
}
