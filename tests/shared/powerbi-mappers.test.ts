import { describe, it, expect } from 'vitest';
import { mapCheckExportItem } from '../../src/lambdas/powerbi-data-export/mappers/check-export-mapper.js';
import { mapEventExportItem } from '../../src/lambdas/powerbi-data-export/mappers/event-export-mapper.js';
import { mapDeploymentExportItem } from '../../src/lambdas/powerbi-data-export/mappers/deployment-export-mapper.js';

describe('powerbi export mappers', () => {
  it('maps check items to clean JSON', () => {
    const mapped = mapCheckExportItem({
      PK: 'CHECK#maoy',
      SK: 'METADATA',
      checkToken: 'maoy',
      platformId: 'bi-prms-front',
      endpointUrl: 'https://example.com',
      environment: 'dev',
      status: 'ACTIVE',
      source: 'UPDOWN',
      autoRegistered: true,
      firstSeenAt: '2026-06-05T15:55:15.000Z',
      lastSeenAt: '2026-06-05T15:55:15.000Z',
      createdAt: '2026-06-05T15:55:15.000Z',
      updatedAt: '2026-06-05T15:55:15.000Z',
    });

    expect(mapped.PK).toBe('CHECK#maoy');
    expect(mapped.autoRegistered).toBe(true);
  });

  it('maps event items including rawPayload', () => {
    const mapped = mapEventExportItem({
      PK: 'PLATFORM#bi-prms-front',
      SK: 'UPTIME#abc',
      eventId: 'upt_1',
      platformId: 'bi-prms-front',
      checkToken: 'maoy',
      eventType: 'check.down',
      status: 'DOWN',
      occurredAt: '2026-06-05T15:55:15.000Z',
      endpointUrl: 'https://example.com',
      environment: 'dev',
      source: 'UPDOWN',
      createdAt: '2026-06-05T15:55:15.000Z',
      rawPayload: { event: 'check.down' },
      uptimeSnapshot: 99.9,
    });

    expect(mapped.rawPayload).toEqual({ event: 'check.down' });
    expect(mapped.uptimeSnapshot).toBe(99.9);
  });

  it('maps legacy deployment items', () => {
    const mapped = mapDeploymentExportItem({
      id: 'a3ef0a0b-41a7-454e-9f6e-9d7fc7e1d682',
      buildDate: '2026-06-04 12:55:41',
      buildNumber: '196',
      job: 'clarisa-application-dev',
      result: 'SUCCESS',
      stage: 'Declarative: Post Actions',
      commitUser: 'Juan',
      commitHash: '064bc091',
      commitMessage: 'Merge branch',
      exception: '',
      url: 'https://automation.example/job/196/',
    });

    expect(mapped.buildNumber).toBe('196');
    expect(mapped.job).toBe('clarisa-application-dev');
    expect(mapped.applicationName).toBe('');
    expect(mapped.environment).toBe('');
    expect(mapped.projectName).toBe('');
  });

  it('enriches deployment items with metadata joined by job', () => {
    const metadataByJob = new Map([
      [
        'roar-management-dev',
        {
          applicationName: 'star management',
          environment: 'dev',
          projectName: 'STAR',
        },
      ],
    ]);

    const mapped = mapDeploymentExportItem(
      {
        id: 'a3ef0a0b-41a7-454e-9f6e-9d7fc7e1d682',
        buildDate: '2026-06-04 12:55:41',
        buildNumber: '196',
        job: 'roar-management-dev',
        result: 'SUCCESS',
        stage: 'Declarative: Post Actions',
        commitUser: 'Juan',
        commitHash: '064bc091',
        commitMessage: 'Merge branch',
        exception: '',
        url: 'https://automation.example/job/196/',
      },
      metadataByJob,
    );

    expect(mapped.applicationName).toBe('star management');
    expect(mapped.environment).toBe('dev');
    expect(mapped.projectName).toBe('STAR');
  });
});
