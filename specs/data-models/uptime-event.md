# Uptime Event Data Model

> **Status:** Accepted  
> **Version:** 2.0.0  
> **Last Updated:** 2026-06-05  
> **Component:** `updown-alert-ingestion`  
> **Related Table:** `alliance-devops-uptime-events-{environment}`

## Overview

Represents an alert event ingested from an Updown.io webhook and normalized for the Alliance DevOps Dashboard.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventId` | string | Yes | Unique event identifier (generated on ingest) |
| `platformId` | string | Yes | Alliance platform identifier (from checks registry) |
| `platformName` | string | No | Display name from `check.alias` |
| `environment` | string | Yes | Deployment environment (`dev`, `staging`, `production`) |
| `source` | enum | Yes | `UPDOWN` |
| `checkToken` | string | Yes | Updown check token (`check.token`) |
| `endpointUrl` | string | Yes | Monitored URL (`check.url`) |
| `status` | enum | Yes | `UP`, `DOWN` |
| `eventType` | string | Yes | Updown event name (`check.down`, `check.up`, …) |
| `occurredAt` | ISO8601 | Yes | Event time from Updown (`time`) |
| `description` | string | No | Plain-text summary from Updown |
| `httpStatus` | number | No | Last HTTP status (`check.last_status`) |
| `errorMessage` | string | No | Error from `check.error` or `downtime.error` |
| `uptimeSnapshot` | number | No | Uptime % at event time (`check.uptime`) |
| `downtimeId` | string | No | Updown downtime ID |
| `downtimeStartedAt` | ISO8601 | No | Downtime start |
| `downtimeEndedAt` | ISO8601 | No | Downtime end |
| `downtimeDurationSec` | number | No | Downtime duration in seconds |
| `rawPayload` | object | Yes | Complete original Updown webhook event |
| `createdAt` | ISO8601 | Yes | Ingestion timestamp |

## Updown → Internal Field Mapping

| Internal Field | Updown Source |
|----------------|---------------|
| `eventId` | Generated: `upt_{uuid}` |
| `platformId` | Registered check in `alliance-devops-updown-checks` table |
| `platformName` | `check.alias` |
| `environment` | `ENVIRONMENT` env var |
| `checkToken` | `check.token` |
| `endpointUrl` | `check.url` |
| `status` | `check.down` → `DOWN`; recovery events → `UP` |
| `eventType` | `event` |
| `occurredAt` | `time` |
| `description` | `description` |
| `httpStatus` | `check.last_status` |
| `errorMessage` | `downtime.error` ?? `check.error` |
| `uptimeSnapshot` | `check.uptime` |
| `downtimeId` | `downtime.id` |
| `downtimeStartedAt` | `downtime.started_at` |
| `downtimeEndedAt` | `downtime.ended_at` |
| `downtimeDurationSec` | `downtime.duration` |
| `rawPayload` | Full webhook event object |

## DynamoDB Mapping

**Table:** `alliance-devops-uptime-events-{environment}`

| Attribute | Key Type | Pattern |
|-----------|----------|---------|
| `PK` | Partition Key | `PLATFORM#{platformId}` |
| `SK` | Sort Key | `UPTIME#{idempotencyKey}` |
| `GSI1PK` | GSI Partition | `UPTIME#{platformId}` |
| `GSI1SK` | GSI Sort | `{occurredAt}` |
| `entityType` | Attribute | `UPTIME_EVENT` |

## Idempotency Key

```
{checkToken}:{eventType}:{occurredAt}:{downtimeId|none}
```

Duplicate keys are ignored (no duplicate write).

## Example — BI PRMS Front (`check.down`)

```json
{
  "eventId": "upt_20260605_abc123",
  "platformId": "bi-prms-front",
  "platformName": "BI PRMS Front",
  "environment": "production",
  "source": "UPDOWN",
  "checkToken": "maoy",
  "endpointUrl": "https://prmsbi.alliance.com.py",
  "status": "DOWN",
  "eventType": "check.down",
  "occurredAt": "2026-06-05T15:55:15.000Z",
  "description": "DOWN: https://prmsbi.alliance.com.py since 15:50:00 (UTC), reason: Connection timeout",
  "httpStatus": 0,
  "errorMessage": "Connection timeout",
  "uptimeSnapshot": 99.99,
  "downtimeId": "6a05817ed77e54f637faa87c",
  "downtimeStartedAt": "2026-06-05T15:50:00.000Z",
  "downtimeEndedAt": null,
  "downtimeDurationSec": null,
  "rawPayload": { "...": "complete Updown webhook event" },
  "createdAt": "2026-06-05T15:55:16.123Z"
}
```

## Validation Rules

- `platformId` must be resolved before persistence (never store with empty platform)
- `eventType` must be a supported Updown event
- `occurredAt` must be valid ISO8601
- `rawPayload` must contain the unmodified Updown event
- `downtimeDurationSec` required when `downtimeEndedAt` is present

## TypeScript Reference

- Model: `src/shared/models/uptime-event.ts`
- Mapper: `src/shared/services/updown-event-mapper.ts`
- Repository: `src/shared/repositories/uptime-event-repository.ts`

## Relationships

- One Platform → many UptimeEvents
- UptimeEvents correlate with DeploymentEvents (future) for change failure rate
