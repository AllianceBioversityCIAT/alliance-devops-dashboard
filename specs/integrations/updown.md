# Updown Integration Specification

> **Status:** Implemented  
> **Version:** 2.0.0  
> **Last Updated:** 2026-06-05  
> **Owner:** Platform Engineering  
> **Component:** `updown-alert-ingestion`  
> **Related Tables:** `alliance-devops-updown-checks-{environment}`, `alliance-devops-uptime-events-{environment}`

## Overview

This specification defines how the Alliance DevOps Dashboard ingests **alert events** from [Updown.io](https://updown.io) webhooks, validates and normalizes them, and persists them in DynamoDB for future dashboard consumption.

Updown stores rich monitoring data (uptime history, APDEX, multi-location latency, response time charts). This component **does not replicate** that full dataset. It captures **operational alert events** (`check.down`, `check.up`, etc.) and stores the complete webhook payload for troubleshooting.

## Purpose

- Receive Updown webhook alert events in real time
- Validate requests and authenticate via shared secret
- Map Updown checks to Alliance platform identifiers
- Normalize events into the internal `UptimeEvent` model
- Persist events in DynamoDB for reliability and incident metrics
- Preserve the original Updown payload (`rawPayload`) for audit and debugging

## Architecture

```
Updown Webhook (POST)
        │
        ▼
  API Gateway
  POST /api/webhooks/updown/alerts
        │
        ▼
  Lambda: updown-alert-ingestion
        │
        ├── Validate x-webhook-secret header
        ├── Parse Updown webhook array payload
        ├── Resolve platformId via check.token mapping
        ├── Normalize to UptimeEvent model
        └── Persist via UptimeEventRepository
        │
        ▼
  DynamoDB: alliance-devops-uptime-events-{environment}
```

## Data Flow

1. Updown sends a **JSON array** with one or more events to the webhook endpoint.
2. API Gateway forwards the request to `updown-alert-ingestion`.
3. Lambda validates the `x-webhook-secret` header against `UPDOWN_WEBHOOK_SECRET`.
4. Lambda parses each event in the array.
5. Lambda resolves or auto-registers the check in `alliance-devops-updown-checks-{environment}`.
6. Lambda maps the Updown event to the internal `UptimeEvent` model using the registered `platformId`.
7. Lambda stores the event in the uptime events table, including `rawPayload`.
8. Lambda responds `200 OK` (Updown retries on non-200 responses).

## HTTP Endpoint

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/api/webhooks/updown/alerts` |
| Content-Type | `application/json` |
| Auth Header | `x-webhook-secret: {secret}` |

OpenAPI documentation: `docs/openapi/updown-alerts.yaml`

## Updown Webhook Payload (Input)

Updown sends events as a **top-level JSON array**. Each element has this structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | Yes | Event type (see supported events below) |
| `time` | ISO8601 | Yes | Event occurrence time |
| `description` | string | Yes | Plain-text summary |
| `check` | object | Yes | Check configuration and current state |
| `downtime` | object | No | Present for `check.down` and `check.up` events |

### `check` Object (relevant fields)

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | **Unique check identifier** — registry key (`CHECK#{token}`) |
| `url` | string | Monitored endpoint URL |
| `alias` | string \| null | Human-readable check name |
| `uptime` | number | Uptime percentage snapshot |
| `down` | boolean | Whether check is currently down |
| `last_status` | number | Last HTTP status code |
| `error` | string \| null | Error message when down |
| `apdex_t` | number | APDEX threshold |
| `last_check_at` | ISO8601 | Last check execution time |

### `downtime` Object (when present)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Updown downtime identifier |
| `started_at` | ISO8601 | Downtime start |
| `ended_at` | ISO8601 \| null | Downtime end (null if ongoing) |
| `duration` | number \| null | Duration in seconds |
| `error` | string | Error description |

### Supported Events (Phase 1)

| Updown Event | Internal Status | Description |
|--------------|-----------------|-------------|
| `check.down` | `DOWN` | Check went down after confirmation |
| `check.up` | `UP` | Check recovered |

### Future Events (Phase 2+)

`check.ssl_invalid`, `check.ssl_valid`, `check.ssl_expiration`, `check.performance_drop`

### Example: `check.down`

```json
[
  {
    "event": "check.down",
    "time": "2026-06-05T15:55:15Z",
    "description": "DOWN: https://prmsbi.alliance.com.py since 15:50:00 (UTC), reason: Connection timeout",
    "check": {
      "token": "maoy",
      "url": "https://prmsbi.alliance.com.py",
      "alias": "BI PRMS Front",
      "uptime": 99.99,
      "down": true,
      "down_since": "2026-06-05T15:50:00Z",
      "up_since": null,
      "error": "Connection timeout",
      "last_status": 0,
      "apdex_t": 0.5,
      "last_check_at": "2026-06-05T15:55:10Z"
    },
    "downtime": {
      "id": "6a05817ed77e54f637faa87c",
      "started_at": "2026-06-05T15:50:00Z",
      "ended_at": null,
      "duration": null,
      "error": "Connection timeout"
    }
  }
]
```

> **Note:** Updown always sends a JSON **array**, even for a single event.

## Check Registry (Auto-Registration)

Updown does **not** send Alliance `platformId`. Checks are registered automatically in DynamoDB on first webhook.

### Table

`alliance-devops-updown-checks-{environment}`

See [updown-check.md](../data-models/updown-check.md).

### Registration Flow

```
Webhook received with check.token
        │
        ▼
Lookup CHECK#{token} in checks table
        │
   Found ──┴── Not found
     │            │
     │            └── Create record (alias, url, derived platformId)
     │                autoRegistered: true
     ▼
Use platformId → persist uptime event
```

### Platform ID Derivation

| Updown field | Usage |
|--------------|-------|
| `check.token` | Primary key (`maoy`) |
| `check.alias` | Slug → `platformId` (e.g. `BI PRMS Front` → `bi-prms-front`) |
| `check.url` | Stored as `endpointUrl` |

If alias is missing, `platformId` is derived from `check.token`.

### Example — BI PRMS Front (auto-registered)

| Field | Value |
|-------|-------|
| `check.token` | `maoy` |
| `check.alias` | BI PRMS Front |
| `check.url` | `https://prmsbi.alliance.com.py` |
| **→ `platformId`** | **`bi-prms-front`** (derived from alias) |

No manual mapping or redeploy required when adding new checks.

## Validation Rules

| Rule | HTTP Status |
|------|-------------|
| Missing or invalid `x-webhook-secret` | `401 Unauthorized` |
| Empty or malformed JSON body | `400 Bad Request` |
| Payload is not a JSON array | `400 Bad Request` |
| Event missing required fields (`event`, `time`, `check.token`) | `400 Bad Request` |
| Unsupported event type (Phase 1) | `400 Bad Request` |
| DynamoDB write failure | `500 Internal Server Error` |

## Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Webhook authentication | Header `x-webhook-secret` validated against `UPDOWN_WEBHOOK_SECRET` |
| Secret storage (production) | SAM parameter with `NoEcho: true`; migrate to Secrets Manager in Phase 1.1 |
| HTTPS only | Enforced by API Gateway |
| No PII | Do not store user data; only check/infra metadata |
| Least privilege IAM | Lambda access to uptime events and updown checks tables |

## Storage Strategy

| Table | Purpose |
|-------|---------|
| `alliance-devops-updown-checks-{environment}` | Check registry (auto-registration) |
| `alliance-devops-uptime-events-{environment}` | Alert events (down/up) |

Both tables use `PAY_PER_REQUEST` billing and PITR enabled.

**Idempotency (events):** `check.token` + `event` + `time` + `downtime.id` (when present)

See [updown-check.md](../data-models/updown-check.md) and [uptime-event.md](../data-models/uptime-event.md).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_NAME` | Yes | `alliance-devops-dashboard` |
| `LAMBDA_NAME` | Yes | `updown-alert-ingestion` |
| `ENVIRONMENT` | Yes | `dev`, `staging`, or `production` |
| `LOG_LEVEL` | Yes | `debug`, `info`, `warn`, `error` |
| `UPTIME_EVENTS_TABLE` | Yes | Uptime events DynamoDB table name |
| `UPDOWN_CHECKS_TABLE` | Yes | Updown checks registry table name |
| `UPDOWN_WEBHOOK_SECRET` | Yes | Shared secret for webhook auth |

Do **not** define a custom `AWS_REGION` variable. Use the region provided automatically by AWS Lambda.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid secret | `401`, log attempt without secret value |
| Malformed payload | `400`, log validation details |
| Unknown check token | Auto-register in checks table, log `checkToken` + `platformId` |
| Duplicate event (idempotency key exists) | `200`, skip write, log duplicate |
| DynamoDB throttling | `500`, Updown retries automatically |
| Partial array failure | Process valid events; return `200` if all processed or `207` if partial (TBD in implementation) |

## Observability

- Structured JSON logs via shared logger
- Log fields: `requestId`, `eventType`, `checkToken`, `platformId`, `eventId`
- CloudWatch metrics (future): `UpdownAlertsReceived`, `UpdownAlertsStored`, `UpdownChecksRegistered`
- X-Ray tracing enabled on Lambda

## Data Not Ingested (Phase 1)

The following remain in Updown and are **not** stored in DynamoDB by this component:

- Multi-location latency breakdown
- Historical daily/monthly uptime grids
- APDEX and response time trend charts
- Full check metrics history

These may be retrieved in **Phase 2** via Updown REST API polling.

## Extension Points

- Updown API polling for metrics enrichment
- Platform mapping via DynamoDB `Platforms` table (manual enrichment)
- Additional webhook event types (SSL, performance)
- PagerDuty / incident correlation
- Idempotency table or conditional writes

## Implementation Reference

| Artifact | Path |
|----------|------|
| Lambda handler | `src/lambdas/updown-alert-ingestion/` |
| Service layer | `src/shared/services/updown-alert-service.ts` |
| Model | `src/shared/models/uptime-event.ts` |
| Repository | `src/shared/repositories/updown-check-repository.ts` |
| Check registry | `src/shared/services/updown-check-registry-service.ts` |
| OpenAPI | `docs/openapi/updown-alerts.yaml` |
| SAM resources | `infrastructure/sam/template.yaml` |

## Acceptance Criteria

- [x] `POST /api/webhooks/updown/alerts` accepts Updown webhook array payload
- [x] `x-webhook-secret` validated; invalid secret returns `401`
- [x] Unknown checks auto-registered in `alliance-devops-updown-checks-{env}`
- [x] `platformId` derived from `check.alias` (e.g. BI PRMS Front → `bi-prms-front`)
- [x] Events stored in `alliance-devops-uptime-events-{env}`
- [x] `rawPayload` stores complete Updown event
- [x] Unknown token no longer returns 422 — auto-registration enabled
- [x] DynamoDB table created by SAM on deploy
- [x] OpenAPI documentation matches endpoint behavior
- [x] Unit tests cover mapper, validation, and handler
