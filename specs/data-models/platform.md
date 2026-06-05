# Platform Data Model

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Represents an Alliance digital product or platform tracked by the DevOps Dashboard.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique platform identifier (PK) |
| `name` | string | Yes | Display name |
| `slug` | string | Yes | URL-safe identifier |
| `description` | string | No | Platform description |
| `team` | string | No | Owning team name |
| `environments` | string[] | No | Supported environments |
| `jenkinsJobPrefix` | string | No | Jenkins job name prefix for mapping |
| `updownCheckIds` | string[] | No | Associated Updown check IDs |
| `metadata` | Record<string, string> | No | Extensible key-value metadata |
| `createdAt` | ISO8601 | Yes | Record creation timestamp |
| `updatedAt` | ISO8601 | Yes | Last update timestamp |

## DynamoDB Mapping

| Attribute | Key Type | Pattern |
|-----------|----------|---------|
| `PK` | Partition Key | `PLATFORM#{id}` |
| `SK` | Sort Key | `METADATA` |
| `entityType` | GSI | `PLATFORM` |

## TypeScript Reference

`src/shared/models/platform.ts`

## Example

```json
{
  "id": "alliance-portal",
  "name": "Alliance Portal",
  "slug": "alliance-portal",
  "team": "Platform Engineering",
  "environments": ["dev", "staging", "production"],
  "jenkinsJobPrefix": "alliance-portal/",
  "updownCheckIds": ["chk_abc123"],
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-06-05T08:00:00.000Z"
}
```

## Validation Rules

- `id` must be lowercase alphanumeric with hyphens
- `slug` must match `id` or be explicitly set
- At least one environment recommended for production platforms

## Relationships

- One Platform → many DeploymentEvents
- One Platform → many UptimeEvents
- One Platform → many ReleaseNotes
