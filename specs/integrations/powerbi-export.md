# Power BI Export Integration Specification

> **Status:** Implemented (pending local/AWS validation)  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-30  
> **Owner:** Platform Engineering  
> **Component:** `powerbi-data-export`  
> **Related Tables:** `alliance-devops-updown-checks-{environment}`, `alliance-devops-uptime-events-{environment}`, `jenkinsexecutions_test` (legacy)

## Overview

This specification defines a **read-only export API** for Power BI / Lakehouse consumption. A single Lambda exposes twelve GET endpoints that scan DynamoDB tables and return clean JSON payloads.

This component is **additive**: it does not modify ingestion Lambdas, webhook routes, or the Updown alert flow.

## Purpose

- Expose Updown checks, uptime events, and Jenkins execution records to Power BI
- Support full exports and paginated exports
- Protect export routes with API Gateway API keys (`x-api-key`)
- Keep ingestion paths (`POST /api/webhooks/updown/alerts`, etc.) unchanged

## Non-Goals

- No writes to DynamoDB
- No API key validation inside Lambda code (API Gateway responsibility)
- No changes to `UpdownAlertIngestionFunction` or its webhook URL
- No requirement for `POWERBI_API_KEY` in other Lambdas

## Architecture

```
Power BI / Lakehouse
        │  GET + x-api-key
        ▼
  API Gateway (12 routes, ApiKeyRequired: true)
        │
        ▼
  Lambda: powerbi-data-export (internal router)
        │
        ├── GET /powerbi/checks[/full|/by-month|/current-month]   → alliance-devops-updown-checks-{env}
        ├── GET /powerbi/events[/full|/by-month|/current-month]   → alliance-devops-uptime-events-{env}
        └── GET /powerbi/deployments[/full|/by-month|/current-month] → jenkinsexecutions_test (legacy)
```

### Updown ingestion (unchanged)

```
Updown.io → POST /api/webhooks/updown/alerts → updown-alert-ingestion → DynamoDB
```

The export Lambda **only reads** tables populated by ingestion. It does not intercept or alter webhooks.

## SAM Deployment Principles

| Rule | Description |
|------|-------------|
| Additive only | New Lambda, routes, ApiKey, UsagePlan — no edits to existing functions |
| Per-route auth | `ApiKeyRequired: true` only on `/powerbi/*` routes |
| No global API auth | Do not set `Globals.Api.Auth.ApiKeyRequired` |
| Isolated secrets | `PowerBiApiKey` parameter is independent from `UpdownWebhookSecret` |
| Scoped env vars | `CHECKS_TABLE_NAME`, `EVENTS_TABLE_NAME`, `DEPLOYMENTS_TABLE_NAME`, `DEPLOYMENT_METADATA_TABLE_NAME` only on `powerbi-data-export` |

## HTTP Endpoints

| Method | Path | Mode | Description |
|--------|------|------|-------------|
| GET | `/powerbi/checks/full` | Full | All check records |
| GET | `/powerbi/events/full` | Full | All uptime event records |
| GET | `/powerbi/deployments/full` | Full | All Jenkins execution records |
| GET | `/powerbi/checks` | Paginated | Checks page (`limit`, `nextToken`) |
| GET | `/powerbi/checks/by-month` | By month | Checks updated in a calendar month (`month`, `year`) |
| GET | `/powerbi/checks/current-month` | Current month | Same as by-month for the current UTC calendar month |
| GET | `/powerbi/events` | Paginated | Events page |
| GET | `/powerbi/events/by-month` | By month | Events that occurred in a calendar month |
| GET | `/powerbi/events/current-month` | Current month | Same as by-month for the current UTC calendar month |
| GET | `/powerbi/deployments` | Paginated | Deployments page |
| GET | `/powerbi/deployments/by-month` | By month | Jenkins executions in a calendar month |
| GET | `/powerbi/deployments/current-month` | Current month | Same as by-month for the current UTC calendar month |

OpenAPI: `docs/openapi/powerbi-export.yaml`

### Authentication

| Header | Required | Validated by |
|--------|----------|--------------|
| `x-api-key` | Yes (export routes only) | API Gateway |

API key value is provisioned at deploy time from AWS Secrets Manager:

- Secret path (dev): `dev/app/backend/devops-dashboard/powerbi-export`
- JSON key: `POWERBI_API_KEY`

### Query parameters (paginated, by-month, and current-month routes)

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `month` | integer | — | — | Required for `/by-month` routes only (1-12) |
| `year` | integer | — | — | Required for `/by-month` routes only (UTC calendar year) |
| `limit` | integer | 100 | 1000 | Page size |
| `nextToken` | string | — | — | Base64-encoded DynamoDB `LastEvaluatedKey` |

**By-month and current-month window:** full calendar month in UTC. `/current-month` routes resolve month/year automatically (no `month`/`year` params).

| Dataset | Filter field | Format |
|---------|--------------|--------|
| Checks | `updatedAt` | ISO 8601 |
| Events | `occurredAt` | ISO 8601 |
| Deployments | `buildDate` | `YYYY-MM-DD HH:mm:ss` |

### Response shapes

**Paginated:**

```json
{
  "data": [],
  "count": 0,
  "nextToken": "eyJQSyI6ICJ..."
}
```

**Full:**

```json
{
  "data": [],
  "count": 0,
  "generatedAt": "2026-06-30T19:00:00.000Z"
}
```

**By month (paginated):**

```json
{
  "data": [],
  "count": 0,
  "month": 6,
  "year": 2026,
  "fromDate": "2026-06-01T00:00:00.000Z",
  "toDate": "2026-06-30T23:59:59.999Z",
  "nextToken": "..."
}
```

### HTTP status codes

| Code | When |
|------|------|
| 200 | Success |
| 400 | Invalid `limit` or `nextToken` |
| 403 | Missing or invalid `x-api-key` (API Gateway) |
| 500 | Unexpected server error |

## DynamoDB Sources

| Dataset | Table (dev) | Access pattern | Notes |
|---------|-------------|----------------|-------|
| Checks | `alliance-devops-updown-checks-dev` | Scan | PK/SK composite keys |
| Events | `alliance-devops-uptime-events-dev` | Scan | Includes `rawPayload` |
| Deployments | `jenkinsexecutions_test` | Scan | Legacy flat schema, partition key `id` |
| Deployment metadata | `deployment_metadata` | BatchGet by `job_name` | Joined to deployments via `job` |

### Deployment record shape (legacy)

All attributes stored as DynamoDB strings:

```json
{
  "id": "uuid",
  "buildDate": "2026-06-04 12:55:41",
  "buildNumber": "196",
  "commitHash": "...",
  "commitMessage": "...",
  "commitUser": "Juan",
  "exception": "",
  "job": "clarisa-application-dev",
  "result": "SUCCESS",
  "stage": "Declarative: Post Actions",
  "url": "https://..."
}
```

## Export Field Mappings

### Checks

`PK`, `SK`, `checkToken`, `platformId`, `platformName`, `endpointUrl`, `environment`, `status`, `source`, `autoRegistered`, `firstSeenAt`, `lastSeenAt`, `createdAt`, `updatedAt`

### Events

`PK`, `SK`, `eventId`, `platformId`, `platformName`, `checkToken`, `eventType`, `status`, `occurredAt`, `downtimeId`, `downtimeStartedAt`, `endpointUrl`, `environment`, `errorMessage`, `description`, `uptimeSnapshot`, `source`, `createdAt`, `rawPayload`

`rawPayload` is included by default for Lakehouse ingestion.

### Deployments

Legacy execution fields plus metadata joined from `deployment_metadata` by matching `job` → `job_name`:

| Export field | Source |
|--------------|--------|
| `id`, `buildDate`, `buildNumber`, `job`, `result`, `stage`, `commitUser`, `commitHash`, `commitMessage`, `exception`, `url` | `jenkinsexecutions_test` |
| `applicationName` | `deployment_metadata.application_name` |
| `environment` | `deployment_metadata.environment` |
| `projectName` | `deployment_metadata.project_name` |

When no metadata row exists for a job, metadata fields are returned as empty strings.

## Environment Variables

**Only on `powerbi-data-export` Lambda:**

| Variable | Required | Example (dev) |
|----------|----------|---------------|
| `APP_NAME` | Yes | `alliance-devops-dashboard` |
| `LAMBDA_NAME` | Yes | `powerbi-data-export` |
| `ENVIRONMENT` | Yes | `dev` |
| `LOG_LEVEL` | No | `debug` |
| `CHECKS_TABLE_NAME` | Yes | `alliance-devops-updown-checks-dev` |
| `EVENTS_TABLE_NAME` | Yes | `alliance-devops-uptime-events-dev` |
| `DEPLOYMENTS_TABLE_NAME` | Yes | `jenkinsexecutions_test` |
| `DEPLOYMENT_METADATA_TABLE_NAME` | Yes | `deployment_metadata` |

`POWERBI_API_KEY` is **not** a Lambda environment variable. It configures the API Gateway API key at deploy time.

## Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Spec + SAM resources (additive) | Done |
| 2 | Lambda router, repositories, mappers | Done |
| 3 | OpenAPI + curl examples | Done |
| 4 | Unit tests | Done |
| 5 | Deploy pipeline (Power BI secret) | Done |
| 6 | Local test script | Done |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| `/full` scans entire table (RCU, latency) | Document; acceptable for dev; consider S3 export later |
| Lambda 30s timeout on large `/full` | Function timeout 60s; paginated routes preferred for large datasets |
| Legacy deployments table outside SAM | `DeploymentsTableName` parameter; IAM policy includes table name |
| Deployment metadata table outside SAM | `DeploymentMetadataTableName` parameter; IAM policy includes table name |
| Updown/uptime tables are external | `UpdownChecksTableNameOverride` and `UptimeEventsTableNameOverride` reference existing tables only — **this stack never creates or deletes them** |
| Breaking Updown webhooks | Additive SAM only; no changes to ingestion routes or auth |

## Local Testing

Before pushing to `dev`:

```bash
npm run build
npm run local:powerbi
```

Local server runs without API Gateway API key enforcement (direct handler invocation). Use `.env` for table names and optional AWS credentials for real DynamoDB reads.

Production/dev deployed routes require `x-api-key` via API Gateway.

## curl Examples (deployed)

Replace `{API_BASE}` and `{API_KEY}`:

```bash
# Paginated checks
curl -s -H "x-api-key: {API_KEY}" \
  "{API_BASE}/powerbi/checks?limit=100"

# Deployments for June 2026
curl -s -H "x-api-key: {API_KEY}" \
  "{API_BASE}/powerbi/deployments/by-month?month=6&year=2026&limit=100"

# Deployments for the current UTC month
curl -s -H "x-api-key: {API_KEY}" \
  "{API_BASE}/powerbi/deployments/current-month?limit=100"

# Full events
curl -s -H "x-api-key: {API_KEY}" \
  "{API_BASE}/powerbi/events/full"

# Paginated deployments with nextToken
curl -s -H "x-api-key: {API_KEY}" \
  "{API_BASE}/powerbi/deployments?limit=50&nextToken=eyJ..."
```

## Acceptance Criteria

- [ ] Twelve GET routes deployed with `ApiKeyRequired: true`
- [ ] Updown webhook route unchanged and still accepts `x-webhook-secret`
- [ ] Paginated responses include `data`, `count`, `nextToken`
- [ ] Full responses include `data`, `count`, `generatedAt`
- [ ] `limit` capped at 1000
- [ ] Deployments read from `jenkinsexecutions_test` with legacy field mapping and metadata join from `deployment_metadata`
- [ ] OpenAPI documents all endpoints
- [ ] Unit tests cover router, pagination tokens, and mappers
