export class PeriodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PeriodError';
  }
}

export interface MonthYearInput {
  month?: string | null;
  year?: string | null;
}

export interface MonthPeriod {
  month: number;
  year: number;
  fromDate: string;
  toDate: string;
  fromDeploymentDate: string;
  toDeploymentDate: string;
}

export function resolveMonthPeriod(input: MonthYearInput): MonthPeriod {
  if (!input.month?.trim() || !input.year?.trim()) {
    throw new PeriodError('month and year query parameters are required');
  }

  const month = Number(input.month);
  const year = Number(input.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new PeriodError('month must be an integer between 1 and 12');
  }

  if (!Number.isInteger(year) || year < 1970 || year > 9999) {
    throw new PeriodError('year must be an integer between 1970 and 9999');
  }

  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return {
    month,
    year,
    fromDate: from.toISOString(),
    toDate: to.toISOString(),
    fromDeploymentDate: formatDeploymentBuildDate(from),
    toDeploymentDate: formatDeploymentBuildDate(to),
  };
}

export function formatDeploymentBuildDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
