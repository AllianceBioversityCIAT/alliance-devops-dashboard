export interface UpdownAlertConfig {
  appName: string;
  lambdaName: string;
  environment: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  uptimeEventsTable: string;
  updownChecksTable: string;
  updownWebhookSecret: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseLogLevel(value: string): UpdownAlertConfig['logLevel'] {
  const valid: UpdownAlertConfig['logLevel'][] = ['debug', 'info', 'warn', 'error'];
  return valid.includes(value as UpdownAlertConfig['logLevel'])
    ? (value as UpdownAlertConfig['logLevel'])
    : 'info';
}

let cachedConfig: UpdownAlertConfig | undefined;

export function loadUpdownAlertConfig(
  overrides: Partial<UpdownAlertConfig> = {},
): UpdownAlertConfig {
  if (cachedConfig && Object.keys(overrides).length === 0) {
    return cachedConfig;
  }

  const config: UpdownAlertConfig = {
    appName: requireEnv('APP_NAME'),
    lambdaName: requireEnv('LAMBDA_NAME'),
    environment: requireEnv('ENVIRONMENT'),
    logLevel: parseLogLevel(process.env.LOG_LEVEL ?? 'info'),
    uptimeEventsTable: requireEnv('UPTIME_EVENTS_TABLE'),
    updownChecksTable: requireEnv('UPDOWN_CHECKS_TABLE'),
    updownWebhookSecret: requireEnv('UPDOWN_WEBHOOK_SECRET'),
    ...overrides,
  };

  if (Object.keys(overrides).length === 0) {
    cachedConfig = config;
  }

  return config;
}

export function resetUpdownAlertConfigCache(): void {
  cachedConfig = undefined;
}
