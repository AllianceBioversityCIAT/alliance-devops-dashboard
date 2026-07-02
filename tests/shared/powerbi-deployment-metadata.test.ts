import { describe, it, expect, vi } from 'vitest';
import { DeploymentMetadataRepository } from '../../src/lambdas/powerbi-data-export/repositories/deployment-metadata-repository.js';

describe('DeploymentMetadataRepository', () => {
  it('batch loads metadata by job_name', async () => {
    const send = vi.fn().mockResolvedValue({
      Responses: {
        deployment_metadata: [
          {
            job_name: 'roar-management-dev',
            application_name: 'star management',
            environment: 'dev',
            project_name: 'STAR',
          },
        ],
      },
    });

    const repository = new DeploymentMetadataRepository({
      tableName: 'deployment_metadata',
      client: { send } as never,
    });

    const metadataByJob = await repository.getByJobNames([
      'roar-management-dev',
      'unknown-job',
      'roar-management-dev',
    ]);

    expect(send).toHaveBeenCalledOnce();
    expect(metadataByJob.get('roar-management-dev')).toEqual({
      applicationName: 'star management',
      environment: 'dev',
      projectName: 'STAR',
    });
    expect(metadataByJob.has('unknown-job')).toBe(false);
  });

  it('returns an empty map when no job names are provided', async () => {
    const send = vi.fn();
    const repository = new DeploymentMetadataRepository({
      tableName: 'deployment_metadata',
      client: { send } as never,
    });

    const metadataByJob = await repository.getByJobNames(['', '']);

    expect(metadataByJob.size).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
});
