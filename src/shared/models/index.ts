export type DeploymentStatus = 'SUCCESS' | 'FAILURE' | 'UNSTABLE' | 'ABORTED';
export type IngestionSource = 'JENKINS' | 'UPDOWN' | 'API' | 'S3_UPLOAD' | 'MANUAL';

export interface Platform {
  id: string;
  name: string;
  slug: string;
  description?: string;
  team?: string;
  environments?: string[];
  jenkinsJobPrefix?: string;
  updownCheckIds?: string[];
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentEvent {
  id: string;
  platformId: string;
  source: 'JENKINS';
  jobName: string;
  buildNumber: number;
  status: DeploymentStatus;
  environment: string;
  version?: string;
  branch?: string;
  commitSha?: string;
  durationMs?: number;
  triggeredBy?: string;
  timestamp: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export type UptimeStatus = 'UP' | 'DOWN' | 'PAUSED';
export type UptimeEventType = 'STATUS_CHANGE' | 'DOWNTIME_START' | 'DOWNTIME_END';

export interface UptimeEvent {
  id: string;
  platformId: string;
  source: 'UPDOWN';
  checkId: string;
  checkName: string;
  url?: string;
  eventType: UptimeEventType;
  status: UptimeStatus;
  responseTimeMs?: number;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  timestamp: string;
  createdAt: string;
}

export type ImprovementCategory =
  | 'TECHNICAL'
  | 'PERFORMANCE'
  | 'SECURITY'
  | 'REFACTOR'
  | 'INFRASTRUCTURE';

export type ImprovementImpact = 'LOW' | 'MEDIUM' | 'HIGH';
export type ImprovementSource = 'RELEASE_NOTE' | 'JIRA' | 'GITHUB';

export interface ImprovementItem {
  id: string;
  category: ImprovementCategory;
  title: string;
  description?: string;
  impact?: ImprovementImpact;
}

export interface ReleaseNote {
  id: string;
  platformId: string;
  version: string;
  releaseDate: string;
  title: string;
  summary?: string;
  improvements?: ImprovementItem[];
  enhancements?: string[];
  bugFixes?: string[];
  author?: string;
  source: IngestionSource;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalImprovement {
  id: string;
  platformId: string;
  releaseId?: string;
  category: ImprovementCategory;
  title: string;
  description?: string;
  impact?: ImprovementImpact;
  source: ImprovementSource;
  externalRef?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type EntityType =
  | 'PLATFORM'
  | 'DEPLOYMENT_EVENT'
  | 'UPTIME_EVENT'
  | 'RELEASE_NOTE'
  | 'TECHNICAL_IMPROVEMENT';

export interface DynamoDbItem {
  PK: string;
  SK: string;
  entityType: EntityType;
  GSI1PK?: string;
  GSI1SK?: string;
  [key: string]: unknown;
}
