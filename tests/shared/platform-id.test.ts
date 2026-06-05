import { describe, it, expect } from 'vitest';
import { derivePlatformId, slugifyPlatformId } from '../../src/shared/utils/platform-id.js';

describe('platform-id utils', () => {
  it('slugifies alias to platformId', () => {
    expect(slugifyPlatformId('BI PRMS Front')).toBe('bi-prms-front');
  });

  it('derives platformId from alias when present', () => {
    expect(derivePlatformId('maoy', 'BI PRMS Front')).toBe('bi-prms-front');
  });

  it('falls back to token when alias is missing', () => {
    expect(derivePlatformId('maoy', null)).toBe('maoy');
  });
});
