export interface AppConfig {
  nodeEnv: string;
  awsRegion: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  serviceName: string;
  enableXRay: boolean;
  dynamodb: {
    eventsTableName: string;
    releasesTableName: string;
    improvementsTableName: string;
    platformsTableName: string;
  };
  integrations: {
    jenkinsBaseUrl: string;
    updownApiKeySecretName: string;
    jenkinsApiTokenSecretName: string;
    releaseNotesApiUrl: string;
  };
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function parseLogLevel(value: string): AppConfig['logLevel'] {
  const valid: AppConfig['logLevel'][] = ['debug', 'info', 'warn', 'error'];
  return valid.includes(value as AppConfig['logLevel'])
    ? (value as AppConfig['logLevel'])
    : 'info';
}

let cachedConfig: AppConfig | undefined;

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  if (cachedConfig && Object.keys(overrides).length === 0) {
    return cachedConfig;
  }

  const config: AppConfig = {
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    awsRegion: optionalEnv('AWS_REGION', 'us-east-1'),
    logLevel: parseLogLevel(optionalEnv('LOG_LEVEL', 'info')),
    serviceName: optionalEnv('SERVICE_NAME', 'alliance-devops-dashboard'),
    enableXRay: optionalEnv('ENABLE_XRAY', 'false') === 'true',
    dynamodb: {
      eventsTableName: requireEnv('EVENTS_TABLE_NAME', 'devops-dashboard-dev-events'),
      releasesTableName: requireEnv('RELEASES_TABLE_NAME', 'devops-dashboard-dev-releases'),
      improvementsTableName: requireEnv(
        'IMPROVEMENTS_TABLE_NAME',
        'devops-dashboard-dev-improvements',
      ),
      platformsTableName: requireEnv('PLATFORMS_TABLE_NAME', 'devops-dashboard-dev-platforms'),
    },
    integrations: {
      jenkinsBaseUrl: optionalEnv('JENKINS_BASE_URL', ''),
      updownApiKeySecretName: optionalEnv('UPDOWN_API_KEY_SECRET_NAME', 'devops-dashboard/updown-api-key'),
      jenkinsApiTokenSecretName: optionalEnv(
        'JENKINS_API_TOKEN_SECRET_NAME',
        'devops-dashboard/jenkins-api-token',
      ),
      releaseNotesApiUrl: optionalEnv('RELEASE_NOTES_API_URL', ''),
    },
    ...overrides,
  };

  if (Object.keys(overrides).length === 0) {
    cachedConfig = config;
  }

  return config;
}

export function resetConfigCache(): void {
  cachedConfig = undefined;
}
