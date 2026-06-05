import { describe, it, expect } from 'vitest';
import {
  parseWebhookBody,
  validateWebhookSecret,
  UpdownWebhookAuthError,
  UpdownWebhookValidationError,
} from '../../src/shared/services/updown-webhook-validator.js';

describe('updown webhook validator', () => {
  it('parses valid webhook array', () => {
    const body = JSON.stringify([
      {
        event: 'check.down',
        time: '2026-06-05T15:55:15Z',
        check: { token: 'abc1', url: 'https://prmsbi.alliance.com.py' },
      },
    ]);

    const events = parseWebhookBody(body);
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('check.down');
  });

  it('rejects non-array payload', () => {
    expect(() => parseWebhookBody(JSON.stringify({ event: 'check.down' }))).toThrow(
      UpdownWebhookValidationError,
    );
  });

  it('rejects unsupported event types', () => {
    const body = JSON.stringify([
      {
        event: 'check.ssl_invalid',
        time: '2026-06-05T15:55:15Z',
        check: { token: 'abc1', url: 'https://example.com' },
      },
    ]);

    expect(() => parseWebhookBody(body)).toThrow(/unsupported event type/);
  });

  it('validates webhook secret', () => {
    expect(() =>
      validateWebhookSecret({ 'x-webhook-secret': 'secret123' }, 'secret123'),
    ).not.toThrow();

    expect(() => validateWebhookSecret({ 'x-webhook-secret': 'wrong' }, 'secret123')).toThrow(
      UpdownWebhookAuthError,
    );
  });
});
