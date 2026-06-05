# Updown Check Data Model

> **Status:** Accepted  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05  
> **Component:** `updown-alert-ingestion`  
> **Related Table:** `alliance-devops-updown-checks-{environment}`

## Overview

Registry of Updown monitoring checks mapped to Alliance platform identifiers. Checks are **auto-registered** on first webhook received.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `checkToken` | string | Yes | Updown check token (`check.token`) |
| `platformId` | string | Yes | Alliance platform identifier (slug from alias) |
| `platformName` | string | No | Display name from `check.alias` |
| `endpointUrl` | string | Yes | Monitored URL (`check.url`) |
| `source` | enum | Yes | `UPDOWN` |
| `status` | enum | Yes | `ACTIVE` |
| `autoRegistered` | boolean | Yes | `true` when created from webhook |
| `environment` | string | Yes | `dev`, `staging`, `production` |
| `firstSeenAt` | ISO8601 | Yes | First webhook timestamp |
| `lastSeenAt` | ISO8601 | Yes | Most recent webhook timestamp |
| `createdAt` | ISO8601 | Yes | Record creation timestamp |
| `updatedAt` | ISO8601 | Yes | Last update timestamp |

## DynamoDB Mapping

**Table:** `alliance-devops-updown-checks-{environment}`

| Attribute | Key Type | Pattern |
|-----------|----------|---------|
| `PK` | Partition Key | `CHECK#{checkToken}` |
| `SK` | Sort Key | `METADATA` |
| `GSI1PK` | GSI Partition | `PLATFORM#{platformId}` |
| `GSI1SK` | GSI Sort | `CHECK#{checkToken}` |
| `entityType` | Attribute | `UPDOWN_CHECK` |

## Platform ID Derivation

| Input | Result |
|-------|--------|
| `check.alias = "BI PRMS Front"` | `platformId = bi-prms-front` |
| No alias | `platformId = slug(check.token)` |

## Example — BI PRMS Front

```json
{
  "checkToken": "maoy",
  "platformId": "bi-prms-front",
  "platformName": "BI PRMS Front",
  "endpointUrl": "https://prmsbi.alliance.com.py",
  "source": "UPDOWN",
  "status": "ACTIVE",
  "autoRegistered": true,
  "environment": "dev",
  "firstSeenAt": "2026-06-05T15:55:15.000Z",
  "lastSeenAt": "2026-06-05T15:55:15.000Z",
  "createdAt": "2026-06-05T15:55:15.000Z",
  "updatedAt": "2026-06-05T15:55:15.000Z"
}
```

## TypeScript Reference

- Model: `src/shared/models/updown-check.ts`
- Registry: `src/shared/services/updown-check-registry-service.ts`
- Repository: `src/shared/repositories/updown-check-repository.ts`

## Relationships

- One UpdownCheck → many UptimeEvents
- GSI1 enables listing checks by `platformId`
