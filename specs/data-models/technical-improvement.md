# Technical Improvement Data Model

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Represents an individual technical improvement extracted from release notes or future sources (Jira, GitHub PRs).

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique improvement identifier |
| `platformId` | string | Yes | Alliance platform identifier |
| `releaseId` | string | No | Parent release note ID |
| `category` | enum | Yes | `TECHNICAL`, `PERFORMANCE`, `SECURITY`, `REFACTOR`, `INFRASTRUCTURE` |
| `title` | string | Yes | Short title |
| `description` | string | No | Detailed description |
| `impact` | enum | No | `LOW`, `MEDIUM`, `HIGH` |
| `source` | enum | Yes | `RELEASE_NOTE`, `JIRA`, `GITHUB` (future) |
| `externalRef` | string | No | External system reference ID |
| `completedAt` | ISO8601 | No | Completion date |
| `createdAt` | ISO8601 | Yes | Ingestion timestamp |
| `updatedAt` | ISO8601 | Yes | Last update timestamp |

## DynamoDB Mapping

| Attribute | Key Type | Pattern |
|-----------|----------|---------|
| `PK` | Partition Key | `PLATFORM#{platformId}` |
| `SK` | Sort Key | `IMPROVEMENT#{createdAt}#{id}` |
| `GSI1PK` | GSI Partition | `IMPROVEMENT#{category}` |
| `GSI1SK` | GSI Sort | `{createdAt}` |
| `entityType` | Attribute | `TECHNICAL_IMPROVEMENT` |

## TypeScript Reference

`src/shared/models/technical-improvement.ts`

## Example

```json
{
  "id": "imp_01HX9K2M3N4P5Q6R7S8T9U0Y",
  "platformId": "alliance-portal",
  "releaseId": "rel_01HX9K2M3N4P5Q6R7S8T9U0X",
  "category": "SECURITY",
  "title": "Upgraded authentication library",
  "description": "Migrated to latest OAuth2 library with PKCE support",
  "impact": "HIGH",
  "source": "RELEASE_NOTE",
  "completedAt": "2026-06-01T00:00:00.000Z",
  "createdAt": "2026-06-01T12:00:00.000Z",
  "updatedAt": "2026-06-01T12:00:00.000Z"
}
```

## Relationships

- Many TechnicalImprovements → one ReleaseNote (optional)
- One Platform → many TechnicalImprovements
