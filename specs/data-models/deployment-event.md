# Deployment Event Data Model

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Represents a deployment or build event ingested from Jenkins.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique event identifier |
| `platformId` | string | Yes | Alliance platform identifier |
| `source` | enum | Yes | `JENKINS` |
| `jobName` | string | Yes | Jenkins job name |
| `buildNumber` | number | Yes | Build number |
| `status` | enum | Yes | `SUCCESS`, `FAILURE`, `UNSTABLE`, `ABORTED` |
| `environment` | string | Yes | Target environment |
| `version` | string | No | Release version |
| `branch` | string | No | Source branch |
| `commitSha` | string | No | Git commit SHA |
| `durationMs` | number | No | Build duration |
| `triggeredBy` | string | No | Trigger source |
| `timestamp` | ISO8601 | Yes | Event timestamp |
| `metadata` | Record<string, string> | No | Additional context |
| `createdAt` | ISO8601 | Yes | Ingestion timestamp |

## DynamoDB Mapping

| Attribute | Key Type | Pattern |
|-----------|----------|---------|
| `PK` | Partition Key | `PLATFORM#{platformId}` |
| `SK` | Sort Key | `DEPLOYMENT#{timestamp}#{id}` |
| `GSI1PK` | GSI Partition | `DEPLOYMENT#{platformId}` |
| `GSI1SK` | GSI Sort | `{timestamp}` |
| `entityType` | Attribute | `DEPLOYMENT_EVENT` |

## Idempotency Key

`platformId` + `jobName` + `buildNumber`

## TypeScript Reference

`src/shared/models/deployment-event.ts`

## Example

```json
{
  "id": "dep_01HX9K2M3N4P5Q6R7S8T9U0V",
  "platformId": "alliance-portal",
  "source": "JENKINS",
  "jobName": "alliance-portal/deploy-production",
  "buildNumber": 142,
  "status": "SUCCESS",
  "environment": "production",
  "version": "2.4.1",
  "durationMs": 245000,
  "triggeredBy": "jenkins-user",
  "timestamp": "2026-06-05T14:30:00.000Z",
  "createdAt": "2026-06-05T14:30:05.123Z"
}
```

## Validation Rules

- `buildNumber` must be positive integer
- `status` must be valid enum value
- `timestamp` must not be in the future (> 5 min tolerance)
