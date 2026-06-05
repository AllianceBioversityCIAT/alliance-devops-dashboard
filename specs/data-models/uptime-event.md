# Uptime Event Data Model

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Represents an availability check or downtime event from Updown.io.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique event identifier |
| `platformId` | string | Yes | Alliance platform identifier |
| `source` | enum | Yes | `UPDOWN` |
| `checkId` | string | Yes | Updown check identifier |
| `checkName` | string | Yes | Check display name |
| `url` | string | No | Monitored URL |
| `eventType` | enum | Yes | `STATUS_CHANGE`, `DOWNTIME_START`, `DOWNTIME_END` |
| `status` | enum | Yes | `UP`, `DOWN`, `PAUSED` |
| `responseTimeMs` | number | No | Response time |
| `startedAt` | ISO8601 | No | Downtime start (for downtime events) |
| `endedAt` | ISO8601 | No | Downtime end |
| `durationMs` | number | No | Downtime duration |
| `errorMessage` | string | No | Error details |
| `timestamp` | ISO8601 | Yes | Event timestamp |
| `createdAt` | ISO8601 | Yes | Ingestion timestamp |

## DynamoDB Mapping

| Attribute | Key Type | Pattern |
|-----------|----------|---------|
| `PK` | Partition Key | `PLATFORM#{platformId}` |
| `SK` | Sort Key | `UPTIME#{timestamp}#{id}` |
| `GSI1PK` | GSI Partition | `UPTIME#{platformId}` |
| `GSI1SK` | GSI Sort | `{timestamp}` |
| `entityType` | Attribute | `UPTIME_EVENT` |

## TypeScript Reference

`src/shared/models/uptime-event.ts`

## Example

```json
{
  "id": "upt_01HX9K2M3N4P5Q6R7S8T9U0W",
  "platformId": "alliance-portal",
  "source": "UPDOWN",
  "checkId": "chk_abc123",
  "checkName": "Alliance Portal Production",
  "url": "https://portal.alliance.example.com/health",
  "eventType": "DOWNTIME_START",
  "status": "DOWN",
  "startedAt": "2026-06-05T10:15:00.000Z",
  "errorMessage": "Connection timeout",
  "timestamp": "2026-06-05T10:15:00.000Z",
  "createdAt": "2026-06-05T10:15:02.456Z"
}
```

## Validation Rules

- `eventType` must align with `status` (e.g., DOWNTIME_START requires DOWN)
- `durationMs` required when `endedAt` is present
