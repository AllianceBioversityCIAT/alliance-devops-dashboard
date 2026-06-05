import type { Logger } from '../logger/index.js';
import type { UpdownAlertConfig } from '../config/updown-alert.config.js';
import { UpdownCheckRegistryService } from './updown-check-registry-service.js';
import { mapUpdownWebhookToUptimeEvent } from './updown-event-mapper.js';
import type { UpdownWebhookEvent } from '../models/updown-webhook.js';
import type { UptimeEvent } from '../models/updown-webhook.js';
import type { UpdownCheckStore } from '../repositories/updown-check-store.js';
import type { UptimeEventStore } from '../repositories/uptime-event-store.js';
import {
  UpdownWebhookAuthError,
  UpdownWebhookValidationError,
  parseWebhookBody,
  validateWebhookSecret,
} from './updown-webhook-validator.js';

export interface ProcessWebhookInput {
  body: string | null | undefined;
  headers: Record<string, string | undefined>;
}

export interface ProcessWebhookResult {
  processed: number;
  stored: number;
  duplicates: number;
  registeredChecks: number;
  eventIds: string[];
}

export class UpdownAlertService {
  private readonly checkRegistry: UpdownCheckRegistryService;

  constructor(
    private readonly config: UpdownAlertConfig,
    private readonly eventStore: UptimeEventStore,
    checkStore: UpdownCheckStore,
    private readonly logger: Logger,
  ) {
    this.checkRegistry = new UpdownCheckRegistryService(
      checkStore,
      config.environment,
      logger,
    );
  }

  processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    validateWebhookSecret(input.headers, this.config.updownWebhookSecret);

    const events = parseWebhookBody(input.body);
    return this.persistEvents(events);
  }

  private async persistEvents(events: UpdownWebhookEvent[]): Promise<ProcessWebhookResult> {
    const result: ProcessWebhookResult = {
      processed: events.length,
      stored: 0,
      duplicates: 0,
      registeredChecks: 0,
      eventIds: [],
    };

    for (const webhookEvent of events) {
      const { check, isNew } = await this.checkRegistry.resolveOrRegister(webhookEvent);

      if (isNew) {
        result.registeredChecks += 1;
      }

      const uptimeEvent = mapUpdownWebhookToUptimeEvent(
        webhookEvent,
        check,
        this.config.environment,
      );
      const saved = await this.eventStore.saveIfNotExists(uptimeEvent);

      if (saved) {
        result.stored += 1;
        result.eventIds.push(uptimeEvent.eventId);
        this.logger.info('Uptime event stored', {
          eventId: uptimeEvent.eventId,
          platformId: uptimeEvent.platformId,
          eventType: uptimeEvent.eventType,
          checkToken: uptimeEvent.checkToken,
        });
      } else {
        result.duplicates += 1;
        this.logger.info('Duplicate uptime event skipped', {
          idempotencyKey: uptimeEvent.idempotencyKey,
          checkToken: uptimeEvent.checkToken,
          eventType: uptimeEvent.eventType,
        });
      }
    }

    return result;
  }
}

export function mapServiceError(error: unknown): { statusCode: number; message: string } {
  if (error instanceof UpdownWebhookAuthError) {
    return { statusCode: 401, message: error.message };
  }

  if (error instanceof UpdownWebhookValidationError) {
    return { statusCode: 400, message: error.message };
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return { statusCode: 500, message };
}

export type { UptimeEvent };
