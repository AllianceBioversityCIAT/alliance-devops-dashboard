# Data Model

> Alliance DevOps Dashboard — Domain data models and DynamoDB design

## Overview

This document describes the data models used by the Alliance DevOps Dashboard and their DynamoDB storage patterns.

Detailed specs live in `specs/data-models/`. This document provides a consolidated reference for implementers.

## Updown Check Registry

**Component:** `updown-alert-ingestion`  
**Table:** `alliance-devops-updown-checks-{environment}`  
**Spec:** [updown-check.md](../specs/data-models/updown-check.md)

### Purpose

Catalog of Updown monitoring checks. **Auto-registered** on first webhook — no static platform map required.

### Key Attributes

| Field | Description |
|-------|-------------|
| `checkToken` | Updown check token (e.g. `maoy`) |
| `platformId` | Derived from alias (e.g. `bi-prms-front`) |
| `platformName` | From `check.alias` (e.g. BI PRMS Front) |
| `endpointUrl` | Monitored URL |
| `autoRegistered` | `true` when created from webhook |

### DynamoDB Key Design

| Key | Pattern |
|-----|---------|
| `PK` | `CHECK#{checkToken}` |
| `SK` | `METADATA` |
| `GSI1PK` | `PLATFORM#{platformId}` |

---

## Uptime Event (Updown Alert Ingestion)

**Component:** `updown-alert-ingestion`  
**Table:** `alliance-devops-uptime-events-{environment}`  
**Spec:** [uptime-event.md](../specs/data-models/uptime-event.md)

### Purpose

Stores alert events ingested from Updown.io webhooks (`check.down`, `check.up`).

### Key Attributes

| Field | Description |
|-------|-------------|
| `eventId` | Unique identifier (generated on ingest) |
| `platformId` | From registered check |
| `checkToken` | Updown check token |
| `status` | `UP` or `DOWN` |
| `rawPayload` | Complete original webhook event |
| `idempotencyKey` | Deduplication key |

### DynamoDB Key Design

| Key | Pattern |
|-----|---------|
| `PK` | `PLATFORM#{platformId}` |
| `SK` | `UPTIME#{idempotencyKey}` |
| `GSI1PK` | `UPTIME#{platformId}` |
| `GSI1SK` | `{occurredAt}` |

---

## Two-Table Flow

```
Webhook → checks table (resolve/register) → events table (store alert)
```

| Table | Growth | Role |
|-------|--------|------|
| `updown-checks` | ~1 row per app | Catalog |
| `uptime-events` | Many rows per app | History |

---

## AWS Secret (production)

Only sensitive value in Secrets Manager:

```json
{
  "UPDOWN_WEBHOOK_SECRET": "your-strong-secret"
}
```

Check registry lives in DynamoDB — **not** in the secret.

---

## Other Models (Future Components)

| Model | Table | Spec |
|-------|-------|------|
| Deployment Event | `devops-dashboard-{env}-events` | [deployment-event.md](../specs/data-models/deployment-event.md) |
| Release Note | `devops-dashboard-{env}-releases` | [release-note.md](../specs/data-models/release-note.md) |
| Technical Improvement | `devops-dashboard-{env}-improvements` | [technical-improvement.md](../specs/data-models/technical-improvement.md) |
| Platform | `devops-dashboard-{env}-platforms` | [platform.md](../specs/data-models/platform.md) |

## Related Documentation

- [Architecture](./architecture.md)
- [Updown Integration Spec](../specs/integrations/updown.md)
- [OpenAPI — Updown Alerts](./openapi/updown-alerts.yaml)
