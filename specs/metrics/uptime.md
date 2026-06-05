# Uptime Metrics Specification

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Defines availability and reliability metrics computed from Updown ingestion data.

## Source Integration

[Updown Integration](../integrations/updown.md)

## Source Model

[Uptime Event](../data-models/uptime-event.md)

## Metrics

### Availability

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `uptime.percentage` | Service uptime percentage | `(total_time - downtime) / total_time` × 100 |
| `uptime.percentage.rolling_30d` | 30-day rolling uptime | Rolling window calculation |

### Downtime

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `downtime.count` | Number of downtime incidents | Count of DOWN → UP transitions |
| `downtime.duration.total` | Total downtime duration | Sum of `durationMs` |
| `downtime.duration.avg` | Average incident duration | Mean of downtime durations |
| `downtime.mttr` | Mean time to recovery | Average time from DOWN to UP |

### Response Time

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `response_time.avg` | Average response time | Mean of `responseTimeMs` |
| `response_time.p95` | 95th percentile response time | P95 of `responseTimeMs` |

## Dimensions

- `platformId`
- `checkId`
- `environment`
- `timeRange`

## SLA Definitions

| Tier | Uptime Target | Measurement Window |
|------|---------------|-------------------|
| Critical (Production) | 99.9% | 30 days |
| Standard (Staging) | 99.0% | 30 days |

## Dashboard Widgets

| Widget | Metrics Used |
|--------|--------------|
| Uptime Gauge | `uptime.percentage.rolling_30d` |
| Downtime Timeline | Raw `UptimeEvent` records |
| Incident Count | `downtime.count` |
| Response Time Chart | `response_time.avg` |

## Acceptance Criteria

- [ ] Uptime calculable from stored events
- [ ] SLA breach detection logic documented
- [ ] Correlation with deployment events specified (future)
