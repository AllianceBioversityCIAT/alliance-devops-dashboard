import type { Logger } from '../logger/index.js';
import type { UpdownCheck } from '../models/updown-check.js';
import {
  createUpdownCheck,
  touchUpdownCheck,
} from '../models/updown-check.js';
import type { UpdownWebhookEvent } from '../models/updown-webhook.js';
import type { UpdownCheckStore } from '../repositories/updown-check-store.js';
import { derivePlatformId } from '../utils/platform-id.js';

export class UpdownCheckRegistryService {
  constructor(
    private readonly store: UpdownCheckStore,
    private readonly environment: string,
    private readonly logger: Logger,
  ) {}

  async resolveOrRegister(
    webhookEvent: UpdownWebhookEvent,
  ): Promise<{ check: UpdownCheck; isNew: boolean }> {
    const checkToken = webhookEvent.check.token;
    const existing = await this.store.getByToken(checkToken);

    if (existing) {
      const updated = touchUpdownCheck(existing, webhookEvent.time, {
        platformName: webhookEvent.check.alias ?? existing.platformName,
        endpointUrl: webhookEvent.check.url,
      });

      if (updated.updatedAt !== existing.updatedAt) {
        await this.store.save(updated);
      }

      return { check: updated, isNew: false };
    }

    const platformId = derivePlatformId(checkToken, webhookEvent.check.alias);
    const registered = createUpdownCheck({
      checkToken,
      platformId,
      platformName: webhookEvent.check.alias ?? undefined,
      endpointUrl: webhookEvent.check.url,
      environment: this.environment,
      autoRegistered: true,
      seenAt: webhookEvent.time,
    });

    await this.store.save(registered);

    this.logger.info('Updown check auto-registered', {
      checkToken,
      platformId,
      platformName: registered.platformName,
      endpointUrl: registered.endpointUrl,
    });

    return { check: registered, isNew: true };
  }
}
