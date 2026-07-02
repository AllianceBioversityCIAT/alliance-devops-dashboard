export interface PowerBiExportConfig {
  appName: string;
  lambdaName: string;
  environment: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  checksTableName: string;
  eventsTableName: string;
  deploymentsTableName: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseLogLevel(value: string): PowerBiExportConfig['logLevel'] {
  const valid: PowerBiExportConfig['logLevel'][] = ['debug', 'info', 'warn', 'error'];
  return valid.includes(value as PowerBiExportConfig['logLevel'])
    ? (value as PowerBiExportConfig['logLevel'])
    : 'info';
}

let cachedConfig: PowerBiExportConfig | undefined;

export function loadPowerBiExportConfig(
  overrides: Partial<PowerBiExportConfig> = {},
): PowerBiExportConfig {
  if (cachedConfig && Object.keys(overrides).length === 0) {
    return cachedConfig;
  }

  const config: PowerBiExportConfig = {
    appName: requireEnv('APP_NAME'),
    lambdaName: requireEnv('LAMBDA_NAME'),
    environment: requireEnv('ENVIRONMENT'),
    logLevel: parseLogLevel(process.env.LOG_LEVEL ?? 'info'),
    checksTableName: requireEnv('CHECKS_TABLE_NAME'),
    eventsTableName: requireEnv('EVENTS_TABLE_NAME'),
    deploymentsTableName: requireEnv('DEPLOYMENTS_TABLE_NAME'),
    ...overrides,
  };

  if (Object.keys(overrides).length === 0) {
    cachedConfig = config;
  }

  return config;
}

export function resetPowerBiExportConfigCache(): void {
  cachedConfig = undefined;
}
