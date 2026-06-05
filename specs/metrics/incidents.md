# Incidents Metrics Specification

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Defines incident and reliability metrics for the Alliance DevOps Dashboard. Initially derived from Updown downtime events; extensible for PagerDuty and Jira integrations.

## Source Data

| Phase | Source |
|-------|--------|
| Current | [Updown Integration](../integrations/updown.md) — downtime events |
| Future | PagerDuty, Jira Service Management |

## Metrics

### Incident Volume

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `incidents.count` | Total incidents | Count of downtime events with duration > 5 min |
| `incidents.count.severity_high` | High-severity incidents | Downtime > 30 min (placeholder severity rules) |

### Incident Duration

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `incidents.duration.total` | Total incident time | Sum of incident durations |
| `incidents.duration.avg` | Average incident duration | Mean duration |
| `incidents.mttr` | Mean time to recovery | Same as uptime MTTR |

### Change Failure Rate (Placeholder)

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `incidents.change_failure_rate` | Deployments causing incidents | Requires deployment-incident correlation (future) |

## Severity Classification (Initial)

| Severity | Condition |
|----------|-----------|
| `LOW` | Downtime < 5 minutes |
| `MEDIUM` | Downtime 5–30 minutes |
| `HIGH` | Downtime > 30 minutes |
| `CRITICAL` | Production + downtime > 60 minutes |

## Dimensions

- `platformId`
- `severity`
- `timeRange`

## Dashboard Widgets

| Widget | Metrics Used |
|--------|--------------|
| Incident Timeline | Enriched downtime events |
| MTTR Trend | `incidents.mttr` |
| Severity Breakdown | `incidents.count` by severity |

## Future Integrations

- PagerDuty incident webhook ingestion
- Jira incident ticket linkage
- Automated deployment-incident correlation

## Acceptance Criteria

- [ ] Incident severity rules documented
- [ ] Metrics derivable from uptime events
- [ ] Extension points for external incident systems defined
