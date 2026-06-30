# Uptime Metrics Specification

> **Status:** Accepted  
> **Version:** 2.0.0  
> **Last Updated:** 2026-06-05  
> **Component:** `updown-alert-ingestion`  
> **Related Table:** `alliance-devops-uptime-events-{environment}`

## Overview

Defines availability and reliability metrics computed from Updown alert events stored by `updown-alert-ingestion`.

## Data Sources

| Phase | Source | Data Available |
|-------|--------|----------------|
| **Phase 1** (current) | Updown webhooks → DynamoDB | Alert events: down/up, downtime duration, error messages, uptime snapshot |
| **Phase 2** (future) | Updown REST API poll | APDEX, multi-location latency, response time trends, historical grids |

Updown retains rich monitoring data (APDEX charts, latency by city, daily history). Phase 1 metrics are derived from **stored alert events**; Phase 2 enriches with API data.

## Source Integration

[Updown Integration](../integrations/updown.md)

## Source Model

[Uptime Event](../data-models/uptime-event.md)

## Metrics — Phase 1 (from stored events)

### Availability

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `uptime.snapshot` | Uptime at event time | `uptimeSnapshot` from latest event per platform |
| `uptime.percentage.derived` | Derived uptime from incidents | Based on downtime events in time window (future aggregation) |

### Downtime

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `downtime.count` | Number of downtime incidents | Count of `check.down` events per platform |
| `downtime.duration.total` | Total downtime | Sum of `downtimeDurationSec` from `check.up` events |
| `downtime.duration.avg` | Average incident duration | Mean of completed downtime durations |
| `downtime.mttr` | Mean time to recovery | Average `downtimeDurationSec` |

### Incident Timeline

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `incidents.active` | Currently down platforms | Latest event per platform where `status = DOWN` |
| `incidents.recent` | Recent incidents | `check.down` events in time window |

## Metrics — Phase 2 (from Updown API)

| Metric | Description | Source |
|--------|-------------|--------|
| `uptime.percentage.rolling_30d` | 30-day rolling uptime | Updown API / check stats |
| `response_time.avg` | Average response time | Updown API / metrics endpoint |
| `response_time.p95` | 95th percentile | Updown API |
| `apdex.score` | APDEX score | Updown API |
| `latency.by_location` | Per-city latency | Updown API |

## Dimensions

- `platformId` (e.g., `bi-prms-front`)
- `checkToken`
- `environment` (`dev`, `staging`, `production`)
- `timeRange` (`24h`, `7d`, `30d`, `90d`)

## Initial Platform

| platformId | platformName | Endpoint |
|------------|--------------|----------|
| `bi-prms-front` | BI PRMS Front | `https://prmsbi.alliance.com.py` |

## SLA Definitions

| Tier | Uptime Target | Measurement Window |
|------|---------------|-------------------|
| Critical (Production) | 99.9% | 30 days |
| Standard (Staging) | 99.0% | 30 days |

## Dashboard Widgets

| Widget | Phase | Metrics Used |
|--------|-------|--------------|
| Active Incidents | 1 | `incidents.active` |
| Downtime Timeline | 1 | Raw `UptimeEvent` records |
| Incident Count | 1 | `downtime.count` |
| MTTR Trend | 1 | `downtime.mttr` |
| Uptime Gauge (30d) | 2 | `uptime.percentage.rolling_30d` |
| Response Time Chart | 2 | `response_time.avg` |
| Latency by Location | 2 | `latency.by_location` |

## Acceptance Criteria

- [ ] Downtime incidents derivable from `check.down` / `check.up` event pairs
- [ ] MTTR calculable from `downtimeDurationSec`
- [ ] Metrics scoped by `platformId` (starting with `bi-prms-front`)
- [ ] Phase 2 API metrics documented as future scope
- [ ] SLA breach detection logic specified for aggregation phase
