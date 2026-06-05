# Release Note Data Model

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Represents a product release with associated changelog entries.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique release identifier |
| `platformId` | string | Yes | Alliance platform identifier |
| `version` | string | Yes | Semantic version |
| `releaseDate` | ISO8601 | Yes | Release date |
| `title` | string | Yes | Release title |
| `summary` | string | No | Release summary |
| `improvements` | ImprovementItem[] | No | Technical improvements |
| `enhancements` | string[] | No | Feature enhancements |
| `bugFixes` | string[] | No | Bug fix descriptions |
| `author` | string | No | Author or team |
| `source` | enum | Yes | `API`, `S3_UPLOAD`, `MANUAL` |
| `createdAt` | ISO8601 | Yes | Ingestion timestamp |
| `updatedAt` | ISO8601 | Yes | Last update timestamp |

### ImprovementItem (Embedded)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Improvement identifier |
| `category` | enum | Yes | Improvement category |
| `title` | string | Yes | Short title |
| `description` | string | No | Full description |
| `impact` | enum | No | Impact level |

## DynamoDB Mapping

| Attribute | Key Type | Pattern |
|-----------|----------|---------|
| `PK` | Partition Key | `PLATFORM#{platformId}` |
| `SK` | Sort Key | `RELEASE#{releaseDate}#{id}` |
| `entityType` | Attribute | `RELEASE_NOTE` |

## Idempotency Key

`platformId` + `version`

## TypeScript Reference

`src/shared/models/release-note.ts`

## Example

```json
{
  "id": "rel_01HX9K2M3N4P5Q6R7S8T9U0X",
  "platformId": "alliance-portal",
  "version": "2.4.1",
  "releaseDate": "2026-06-01T00:00:00.000Z",
  "title": "June 2026 Release",
  "summary": "Performance improvements and bug fixes",
  "improvements": [
    {
      "id": "imp_001",
      "category": "PERFORMANCE",
      "title": "Optimized database queries",
      "impact": "HIGH"
    }
  ],
  "bugFixes": ["Fixed login redirect loop"],
  "source": "API",
  "createdAt": "2026-06-01T12:00:00.000Z",
  "updatedAt": "2026-06-01T12:00:00.000Z"
}
```
