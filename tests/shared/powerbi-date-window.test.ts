import { describe, it, expect } from 'vitest';
import {
  resolveMonthPeriod,
  formatDeploymentBuildDate,
  PeriodError,
} from '../../src/lambdas/powerbi-data-export/date-window.js';

describe('powerbi month period', () => {
  it('builds a calendar month window', () => {
    const period = resolveMonthPeriod({ month: '6', year: '2026' });

    expect(period.month).toBe(6);
    expect(period.year).toBe(2026);
    expect(period.fromDate).toBe('2026-06-01T00:00:00.000Z');
    expect(period.toDate).toBe('2026-06-30T23:59:59.999Z');
    expect(period.fromDeploymentDate).toBe('2026-06-01 00:00:00');
    expect(period.toDeploymentDate).toBe('2026-06-30 23:59:59');
  });

  it('formats deployment build dates consistently', () => {
    const formatted = formatDeploymentBuildDate(new Date('2026-06-04T12:55:41.000Z'));
    expect(formatted).toBe('2026-06-04 12:55:41');
  });

  it('requires month and year', () => {
    expect(() => resolveMonthPeriod({ month: '6' })).toThrow(PeriodError);
    expect(() => resolveMonthPeriod({ year: '2026' })).toThrow(PeriodError);
  });

  it('rejects invalid month values', () => {
    expect(() => resolveMonthPeriod({ month: '13', year: '2026' })).toThrow(PeriodError);
    expect(() => resolveMonthPeriod({ month: '0', year: '2026' })).toThrow(PeriodError);
  });
});
