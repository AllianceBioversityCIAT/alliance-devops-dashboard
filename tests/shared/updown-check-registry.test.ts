import { describe, it, expect } from 'vitest';
import { UpdownCheckRegistryService } from '../../src/shared/services/updown-check-registry-service.js';
import { InMemoryUpdownCheckRepository } from '../../src/shared/repositories/in-memory-updown-check-repository.js';
import { createLogger } from '../../src/shared/logger/index.js';
import type { UpdownWebhookEvent } from '../../src/shared/models/updown-webhook.js';

const logger = createLogger({ serviceName: 'test', level: 'error' });

const webhookEvent: UpdownWebhookEvent = {
  event: 'check.down',
  time: '2026-06-05T15:55:15Z',
  check: {
    token: 'maoy',
    url: 'https://prmsbi.alliance.com.py',
    alias: 'BI PRMS Front',
  },
};

describe('UpdownCheckRegistryService', () => {
  it('auto-registers a new check and derives platformId from alias', async () => {
    const store = new InMemoryUpdownCheckRepository();
    const service = new UpdownCheckRegistryService(store, 'dev', logger);

    const first = await service.resolveOrRegister(webhookEvent);

    expect(first.isNew).toBe(true);
    expect(first.check.checkToken).toBe('maoy');
    expect(first.check.platformId).toBe('bi-prms-front');
    expect(first.check.autoRegistered).toBe(true);
  });

  it('returns existing check on subsequent webhooks', async () => {
    const store = new InMemoryUpdownCheckRepository();
    const service = new UpdownCheckRegistryService(store, 'dev', logger);

    await service.resolveOrRegister(webhookEvent);
    const second = await service.resolveOrRegister(webhookEvent);

    expect(second.isNew).toBe(false);
    expect(second.check.platformId).toBe('bi-prms-front');
    expect(store.getAll()).toHaveLength(1);
  });
});
