# Release Notes Integration Specification

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05  
> **Owner:** Platform Engineering

## Overview

This specification defines how the Alliance DevOps Dashboard ingests release notes containing technical improvements, enhancements, and bug fixes from Alliance product teams.

## Purpose

- Capture structured release documentation
- Track technical improvements over time
- Enable visibility into product evolution and quality trends
- Support changelog and improvement reporting on the dashboard

## Data Source

| Property | Value |
|----------|-------|
| Source System | Internal Release Notes API / Manual Upload |
| Integration Type | REST API + S3 Event (file upload) |
| Authentication | IAM / API Key |
| Trigger | EventBridge Schedule + S3 PutObject event |

## Inbound Payload

### Release Note Document

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `releaseId` | string | Yes | Unique release identifier |
| `platformId` | string | Yes | Alliance platform identifier |
| `version` | string | Yes | Semantic version (e.g., `2.4.1`) |
| `releaseDate` | ISO8601 | Yes | Release date |
| `title` | string | Yes | Release title |
| `summary` | string | No | High-level summary |
| `improvements` | array | No | List of technical improvements |
| `enhancements` | array | No | List of feature enhancements |
| `bugFixes` | array | No | List of bug fixes |
| `author` | string | No | Release author or team |

### Improvement Item

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique improvement identifier |
| `category` | enum | Yes | `TECHNICAL`, `PERFORMANCE`, `SECURITY`, `REFACTOR`, `INFRASTRUCTURE` |
| `title` | string | Yes | Short description |
| `description` | string | No | Detailed description |
| `impact` | enum | No | `LOW`, `MEDIUM`, `HIGH` |

## Processing Pipeline

```
Release Notes API / S3 Upload
        │
        ▼
  release-notes-ingestion Lambda
        │
        ├── Parse and validate document
        ├── Extract individual improvements
        ├── Normalize to ReleaseNote + TechnicalImprovement models
        └── Persist via DynamoDB repository
```

## Storage Mapping

| Source Entity | Target Model | DynamoDB Table |
|---------------|--------------|----------------|
| Release Note | `ReleaseNote` | `devops-dashboard-{env}-releases` |
| Improvement Item | `TechnicalImprovement` | `devops-dashboard-{env}-improvements` |

## Metrics Derived

See [technical-improvements.md](../metrics/technical-improvements.md).

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid JSON/Markdown | Return 400, store raw file in S3 quarantine bucket |
| Duplicate release ID | Upsert (idempotent by releaseId) |
| Missing platform | Reject with 422 |

## Security

- S3 bucket with encryption at rest (SSE-S3 or KMS)
- Pre-signed URLs for manual uploads
- No secrets in release note content

## Extension Points

- Parse Confluence or Notion export formats
- Auto-link improvements to Jira tickets (future)
- GitHub Release API integration

## Implementation Reference

- Lambda: `src/lambdas/release-notes-ingestion/`
- Models: `src/shared/models/release-note.ts`, `technical-improvement.ts`

## Acceptance Criteria

- [ ] Release notes parsed and stored with nested improvements
- [ ] Individual improvements queryable by category and platform
- [ ] S3 upload triggers ingestion automatically
- [ ] Duplicate releases handled idempotently
