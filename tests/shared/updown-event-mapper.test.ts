import { describe, it, expect } from 'vitest';
import { mapUpdownWebhookToUptimeEvent } from '../../src/shared/services/updown-event-mapper.js';
import { createUpdownCheck } from '../../src/shared/models/updown-check.js';
import type { UpdownWebhookEvent } from '../../src/shared/models/updown-webhook.js';

const registeredCheck = createUpdownCheck({
  checkToken: 'maoy',
  platformId: 'bi-prms-front',
  platformName: 'BI PRMS Front',
  endpointUrl: 'https://prmsbi.alliance.com.py',
  environment: 'dev',
  autoRegistered: true,
  seenAt: '2026-06-05T15:55:15Z',
});

const checkDownEvent: UpdownWebhookEvent = {
  event: 'check.down',
  time: '2026-06-05T15:55:15Z',
  description: 'DOWN: https://prmsbi.alliance.com.py',
  check: {
    token: 'maoy',
    url: 'https://prmsbi.alliance.com.py',
    alias: 'BI PRMS Front',
    uptime: 99.99,
    down: true,
    last_status: 0,
    error: 'Connection timeout',
  },
  downtime: {
    id: '6a05817ed77e54f637faa87c',
    started_at: '2026-06-05T15:50:00Z',
    ended_at: null,
    duration: null,
    error: 'Connection timeout',
  },
};

describe('mapUpdownWebhookToUptimeEvent', () => {
  it('maps check.down using registered check', () => {
    const result = mapUpdownWebhookToUptimeEvent(checkDownEvent, registeredCheck, 'dev');

    expect(result.platformId).toBe('bi-prms-front');
    expect(result.platformName).toBe('BI PRMS Front');
    expect(result.status).toBe('DOWN');
    expect(result.checkToken).toBe('maoy');
    expect(result.idempotencyKey).toBe(
      'maoy:check.down:2026-06-05T15:55:15Z:6a05817ed77e54f637faa87c',
    );
  });
});
