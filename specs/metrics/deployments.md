# Deployments Metrics Specification

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Defines the deployment-related metrics computed from Jenkins ingestion data for the Alliance DevOps Dashboard.

## Source Integration

[Jenkins Integration](../integrations/jenkins.md)

## Source Model

[Deployment Event](../data-models/deployment-event.md)

## Metrics

### Deployment Frequency

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `deployments.count.daily` | Deployments per day | Count of SUCCESS events per platform per day |
| `deployments.count.weekly` | Deployments per week | Rolling 7-day count |
| `deployments.count.monthly` | Deployments per month | Calendar month count |

### Deployment Success Rate

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `deployments.success_rate` | Percentage of successful deployments | `SUCCESS / (SUCCESS + FAILURE + UNSTABLE)` × 100 |
| `deployments.failure_rate` | Percentage of failed deployments | `FAILURE / total` × 100 |

### Lead Time (Placeholder)

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `deployments.lead_time.avg` | Average time from commit to deploy | Requires GitHub integration (future) |

### Build Duration

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `deployments.duration.avg` | Average build duration | Mean of `durationMs` for SUCCESS events |
| `deployments.duration.p95` | 95th percentile build duration | P95 of `durationMs` |

## Dimensions

- `platformId` — Alliance product/platform
- `environment` — `dev`, `staging`, `production`
- `timeRange` — `1d`, `7d`, `30d`, `90d`

## Aggregation Strategy

- **Real-time:** DynamoDB streams → aggregation Lambda (future)
- **Batch:** EventBridge daily schedule → metrics snapshot table (future)
- **Query:** Dashboard API reads pre-aggregated snapshots

## Dashboard Widgets

| Widget | Metrics Used |
|--------|--------------|
| Deployment Frequency Chart | `deployments.count.daily` |
| Success Rate Gauge | `deployments.success_rate` |
| Recent Deployments Table | Raw `DeploymentEvent` records |
| Build Duration Trend | `deployments.duration.avg` |

## SLO Targets (Placeholder)

| Metric | Target |
|--------|--------|
| Deployment success rate | ≥ 95% |
| Production deployment frequency | ≥ 1/week per platform |

## Acceptance Criteria

- [ ] Metrics spec aligned with deployment event schema
- [ ] Aggregation dimensions documented
- [ ] Dashboard widgets mapped to metrics
