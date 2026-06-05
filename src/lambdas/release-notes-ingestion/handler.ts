import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { loadConfig } from '../../shared/config/index.js';
import { createLogger } from '../../shared/logger/index.js';
import type { IngestionSource } from '../../shared/models/index.js';
import { createReleaseNote } from '../../shared/models/release-note.js';
import { fromImprovementItem } from '../../shared/models/technical-improvement.js';
import {
  ReleaseNoteRepository,
  TechnicalImprovementRepository,
} from '../../shared/repositories/index.js';
import {
  errorResponse,
  isNonEmptyString,
  parseJsonBody,
  successResponse,
  withErrorHandling,
} from '../../shared/utils/index.js';

/**
 * Release notes ingestion Lambda handler.
 * Spec: specs/integrations/release-notes.md
 *
 * Accepts release note documents, extracts improvements, and persists to DynamoDB.
 */

interface ReleaseNotesIngestionPayload {
  platformId: string;
  version: string;
  releaseDate: string;
  title: string;
  summary?: string;
  improvements?: Array<{
    id: string;
    category: 'TECHNICAL' | 'PERFORMANCE' | 'SECURITY' | 'REFACTOR' | 'INFRASTRUCTURE';
    title: string;
    description?: string;
    impact?: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  enhancements?: string[];
  bugFixes?: string[];
  author?: string;
  source?: IngestionSource;
}

const config = loadConfig();
const logger = createLogger({
  serviceName: config.serviceName,
  level: config.logLevel,
  defaultContext: { lambda: 'release-notes-ingestion' },
});

function validatePayload(payload: ReleaseNotesIngestionPayload): string | null {
  if (!isNonEmptyString(payload.platformId)) return 'platformId is required';
  if (!isNonEmptyString(payload.version)) return 'version is required';
  if (!isNonEmptyString(payload.releaseDate)) return 'releaseDate is required';
  if (!isNonEmptyString(payload.title)) return 'title is required';
  return null;
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const requestLogger = logger.child({ requestId: context.awsRequestId });

  return withErrorHandling(async () => {
    requestLogger.info('Processing release notes ingestion event');

    const payload = parseJsonBody<ReleaseNotesIngestionPayload>(event.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      requestLogger.warn('Validation failed', { error: validationError });
      return errorResponse(validationError, 400);
    }

    const releaseNote = createReleaseNote({
      platformId: payload.platformId,
      version: payload.version,
      releaseDate: payload.releaseDate,
      title: payload.title,
      summary: payload.summary,
      improvements: payload.improvements,
      enhancements: payload.enhancements,
      bugFixes: payload.bugFixes,
      author: payload.author,
      source: payload.source ?? 'API',
    });

    const releaseRepository = new ReleaseNoteRepository({
      tableName: config.dynamodb.releasesTableName,
      region: config.awsRegion,
    });

    await releaseRepository.save(releaseNote);

    const improvementIds: string[] = [];

    if (payload.improvements?.length) {
      const improvementRepository = new TechnicalImprovementRepository({
        tableName: config.dynamodb.improvementsTableName,
        region: config.awsRegion,
      });

      for (const item of payload.improvements) {
        const improvement = fromImprovementItem(item, payload.platformId, releaseNote.id);
        await improvementRepository.save(improvement);
        improvementIds.push(improvement.id);
      }
    }

    requestLogger.info('Release note persisted', {
      releaseId: releaseNote.id,
      platformId: releaseNote.platformId,
      improvementCount: improvementIds.length,
      idempotencyKey: releaseRepository.getIdempotencyKey(releaseNote),
    });

    return successResponse(
      {
        message: 'Release note ingested',
        releaseId: releaseNote.id,
        improvementIds,
      },
      201,
    );
  }, requestLogger);
}
