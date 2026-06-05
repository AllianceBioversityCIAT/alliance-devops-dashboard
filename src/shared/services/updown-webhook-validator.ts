import {
  PHASE1_UPDOWN_EVENTS,
  type UpdownEventType,
  type UpdownWebhookEvent,
} from '../models/updown-webhook.js';
import { isNonEmptyString } from '../utils/index.js';

export class UpdownWebhookValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdownWebhookValidationError';
  }
}

export function parseWebhookBody(body: string | null | undefined): UpdownWebhookEvent[] {
  if (!body) {
    throw new UpdownWebhookValidationError('Request body is empty');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new UpdownWebhookValidationError('Invalid JSON in request body');
  }

  if (!Array.isArray(parsed)) {
    throw new UpdownWebhookValidationError('Webhook payload must be a JSON array');
  }

  if (parsed.length === 0) {
    throw new UpdownWebhookValidationError('Webhook payload array must not be empty');
  }

  return parsed.map((item, index) => validateWebhookEvent(item, index));
}

export function validateWebhookEvent(item: unknown, index = 0): UpdownWebhookEvent {
  if (typeof item !== 'object' || item === null) {
    throw new UpdownWebhookValidationError(`Event at index ${index} must be an object`);
  }

  const event = item as Record<string, unknown>;

  if (!isNonEmptyString(event.event)) {
    throw new UpdownWebhookValidationError(`Event at index ${index}: "event" is required`);
  }

  if (!PHASE1_UPDOWN_EVENTS.includes(event.event as UpdownEventType)) {
    throw new UpdownWebhookValidationError(
      `Event at index ${index}: unsupported event type "${event.event}"`,
    );
  }

  if (!isNonEmptyString(event.time)) {
    throw new UpdownWebhookValidationError(`Event at index ${index}: "time" is required`);
  }

  if (Number.isNaN(Date.parse(event.time))) {
    throw new UpdownWebhookValidationError(`Event at index ${index}: "time" must be valid ISO8601`);
  }

  if (typeof event.check !== 'object' || event.check === null) {
    throw new UpdownWebhookValidationError(`Event at index ${index}: "check" is required`);
  }

  const check = event.check as Record<string, unknown>;
  if (!isNonEmptyString(check.token)) {
    throw new UpdownWebhookValidationError(`Event at index ${index}: "check.token" is required`);
  }

  if (!isNonEmptyString(check.url)) {
    throw new UpdownWebhookValidationError(`Event at index ${index}: "check.url" is required`);
  }

  return item as UpdownWebhookEvent;
}

export function validateWebhookSecret(
  headers: Record<string, string | undefined>,
  expectedSecret: string,
): void {
  const provided =
    headers['x-webhook-secret'] ??
    headers['X-Webhook-Secret'] ??
    headers['X-WEBHOOK-SECRET'];

  if (!provided || provided !== expectedSecret) {
    throw new UpdownWebhookAuthError('Invalid or missing webhook secret');
  }
}

export class UpdownWebhookAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdownWebhookAuthError';
  }
}
