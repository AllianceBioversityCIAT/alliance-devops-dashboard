# Jenkins Integration Specification

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05  
> **Owner:** Platform Engineering

## Overview

This specification defines how the Alliance DevOps Dashboard ingests deployment, build, and release data from Jenkins CI/CD pipelines across Alliance digital products.

## Purpose

- Collect deployment events (success, failure, rollback)
- Track build status and duration
- Capture release metadata (version, environment, artifact)
- Enable delivery metrics and deployment frequency calculations

## Data Source

| Property | Value |
|----------|-------|
| Source System | Jenkins |
| Integration Type | Webhook + Scheduled Polling (fallback) |
| Authentication | API Token (stored in AWS Secrets Manager) |
| Trigger | EventBridge Schedule + API Gateway webhook |

## Inbound Events

### Deployment Event

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobName` | string | Yes | Jenkins job identifier |
| `buildNumber` | number | Yes | Sequential build number |
| `status` | enum | Yes | `SUCCESS`, `FAILURE`, `UNSTABLE`, `ABORTED` |
| `environment` | string | Yes | Target deployment environment |
| `version` | string | No | Release or artifact version |
| `durationMs` | number | No | Build duration in milliseconds |
| `triggeredBy` | string | No | User or system that triggered the build |
| `timestamp` | ISO8601 | Yes | Event occurrence time |
| `platformId` | string | Yes | Alliance platform identifier |

### Build Status Event

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobName` | string | Yes | Jenkins job identifier |
| `buildNumber` | number | Yes | Sequential build number |
| `status` | enum | Yes | Build result status |
| `branch` | string | No | Source branch |
| `commitSha` | string | No | Git commit SHA |
| `timestamp` | ISO8601 | Yes | Event occurrence time |

## Processing Pipeline

```
Jenkins Webhook / Poll
        │
        ▼
  API Gateway / EventBridge
        │
        ▼
  jenkins-ingestion Lambda
        │
        ├── Validate payload against spec
        ├── Enrich with platform metadata
        ├── Normalize to DeploymentEvent model
        └── Persist via DynamoDB repository
```

## Storage Mapping

| Source Entity | Target Model | DynamoDB Table |
|---------------|--------------|----------------|
| Deployment | `DeploymentEvent` | `devops-dashboard-{env}-events` |
| Build Status | `DeploymentEvent` (partial) | `devops-dashboard-{env}-events` |

## Metrics Derived

See [deployments.md](../metrics/deployments.md).

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid payload | Return 400, log structured error, do not retry |
| Unknown platform | Return 422, log warning, store in dead-letter queue |
| DynamoDB failure | Return 500, retry via SQS DLQ (max 3 attempts) |
| Jenkins API unavailable | Exponential backoff on scheduled poll |

## Security

- Webhook endpoint protected by API key in header (`X-Webhook-Secret`)
- Jenkins API credentials stored in AWS Secrets Manager
- All traffic over HTTPS
- Lambda execution role follows least-privilege IAM

## Observability

- Structured JSON logs via shared logger
- CloudWatch metrics: `IngestionSuccess`, `IngestionFailure`, `ProcessingDuration`
- X-Ray tracing enabled on Lambda

## Extension Points

- Add support for Jenkins Pipeline stage-level events
- Integrate with GitHub commit metadata for DORA metrics
- Support multi-branch pipeline aggregation

## Implementation Reference

- Lambda: `src/lambdas/jenkins-ingestion/`
- Model: `src/shared/models/deployment-event.ts`
- Spec model: [deployment-event.md](../data-models/deployment-event.md)

## Acceptance Criteria

- [ ] Lambda handler validates payloads against this spec
- [ ] Deployment events persisted with correct PK/SK schema
- [ ] Idempotent ingestion (duplicate build numbers ignored)
- [ ] Integration tests with mock Jenkins payloads
- [ ] CloudWatch alarms on ingestion failure rate > 5%
