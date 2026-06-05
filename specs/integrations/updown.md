# Updown Integration Specification

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05  
> **Owner:** Platform Engineering

## Overview

This specification defines how the Alliance DevOps Dashboard ingests availability, downtime, and uptime metrics from the Updown.io monitoring service.

## Purpose

- Track service availability across Alliance digital products
- Record downtime events with duration and root cause context
- Calculate uptime percentages for SLA reporting
- Correlate outages with deployment events

## Data Source

| Property | Value |
|----------|-------|
| Source System | Updown.io |
| Integration Type | Webhook + Scheduled API Poll |
| Authentication | API Key (stored in AWS Secrets Manager) |
| Trigger | EventBridge Schedule (every 5 minutes) + Webhook |

## Inbound Events

### Check Status Event

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `checkId` | string | Yes | Updown check identifier |
| `checkName` | string | Yes | Human-readable check name |
| `url` | string | Yes | Monitored endpoint URL |
| `status` | enum | Yes | `UP`, `DOWN`, `PAUSED` |
| `responseTimeMs` | number | No | Last response time |
| `timestamp` | ISO8601 | Yes | Status change time |
| `platformId` | string | Yes | Alliance platform identifier |

### Downtime Event

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `checkId` | string | Yes | Updown check identifier |
| `startedAt` | ISO8601 | Yes | Downtime start |
| `endedAt` | ISO8601 | No | Downtime end (null if ongoing) |
| `durationMs` | number | No | Total downtime duration |
| `errorMessage` | string | No | Error or timeout message |
| `platformId` | string | Yes | Alliance platform identifier |

## Processing Pipeline

```
Updown Webhook / API Poll
        │
        ▼
  updown-ingestion Lambda
        │
        ├── Validate payload against spec
        ├── Map check → platform via config
        ├── Normalize to UptimeEvent model
        └── Persist via DynamoDB repository
```

## Storage Mapping

| Source Entity | Target Model | DynamoDB Table |
|---------------|--------------|----------------|
| Check Status | `UptimeEvent` | `devops-dashboard-{env}-events` |
| Downtime | `UptimeEvent` | `devops-dashboard-{env}-events` |

## Metrics Derived

See [uptime.md](../metrics/uptime.md).

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Unknown check ID | Log warning, skip event, alert if persistent |
| API rate limit | Respect `Retry-After`, backoff polling |
| Partial downtime data | Store with `endedAt: null`, update on resolution |

## Security

- Updown API key in AWS Secrets Manager
- Webhook signature validation (when available)
- No PII in stored events

## Observability

- Metrics: `UptimeChecksProcessed`, `DowntimeEventsDetected`
- Alert on sustained DOWN status > 15 minutes

## Extension Points

- Multi-region check aggregation
- Integration with PagerDuty for incident correlation
- Custom SLA threshold per platform

## Implementation Reference

- Lambda: `src/lambdas/updown-ingestion/`
- Model: `src/shared/models/uptime-event.ts`
- Spec model: [uptime-event.md](../data-models/uptime-event.md)

## Acceptance Criteria

- [ ] Scheduled poll retrieves all configured checks
- [ ] Downtime events tracked with start/end lifecycle
- [ ] Uptime percentage calculable from stored events
- [ ] Platform mapping configurable per environment
