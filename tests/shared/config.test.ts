import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, resetConfigCache } from '../../src/shared/config/index.js';
import { createLogger } from '../../src/shared/logger/index.js';

describe('loadConfig', () => {
  beforeEach(() => {
    resetConfigCache();
    process.env.EVENTS_TABLE_NAME = 'test-events';
    process.env.RELEASES_TABLE_NAME = 'test-releases';
    process.env.IMPROVEMENTS_TABLE_NAME = 'test-improvements';
    process.env.PLATFORMS_TABLE_NAME = 'test-platforms';
  });

  it('loads configuration from environment variables', () => {
    const config = loadConfig();

    expect(config.dynamodb.eventsTableName).toBe('test-events');
    expect(config.dynamodb.releasesTableName).toBe('test-releases');
    expect(config.serviceName).toBe('alliance-devops-dashboard');
    expect(config.awsRegion).toBe('us-east-1');
  });

  it('caches configuration on subsequent calls', () => {
    const first = loadConfig();
    process.env.EVENTS_TABLE_NAME = 'changed';
    const second = loadConfig();

    expect(first).toBe(second);
    expect(second.dynamodb.eventsTableName).toBe('test-events');
  });
});

describe('createLogger', () => {
  it('creates a logger with child context', () => {
    const logger = createLogger({ serviceName: 'test-service', level: 'debug' });
    const child = logger.child({ requestId: 'req-123' });

    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });
});
