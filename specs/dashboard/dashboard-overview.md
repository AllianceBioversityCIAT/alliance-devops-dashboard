# Dashboard Overview Specification

> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2026-06-05

## Overview

Defines the Alliance DevOps Dashboard layout, widgets, data sources, and user experience requirements.

## Purpose

Provide a centralized view of DevOps operational metrics, delivery insights, reliability indicators, and technical improvements across Alliance digital products.

## Target Users

| Persona | Primary Use |
|---------|-------------|
| Engineering Manager | Delivery metrics, team performance |
| Platform Engineer | Integration health, ingestion status |
| Product Owner | Release activity, improvements |
| Leadership | SLA compliance, reliability trends |

## Dashboard Sections

### 1. Executive Summary

| Widget | Data Source | Metrics Spec |
|--------|-------------|--------------|
| Platform Health Score | Composite | All metrics |
| Active Incidents | Updown | [incidents.md](../metrics/incidents.md) |
| Deployment Success Rate | Jenkins | [deployments.md](../metrics/deployments.md) |
| 30-Day Uptime | Updown | [uptime.md](../metrics/uptime.md) |

### 2. Delivery Insights

| Widget | Data Source | Metrics Spec |
|--------|-------------|--------------|
| Deployment Frequency | Jenkins | [deployments.md](../metrics/deployments.md) |
| Recent Deployments | Jenkins | Raw events |
| Build Duration Trend | Jenkins | [deployments.md](../metrics/deployments.md) |
| Release Timeline | Release Notes | [technical-improvements.md](../metrics/technical-improvements.md) |

### 3. Reliability

| Widget | Data Source | Metrics Spec |
|--------|-------------|--------------|
| Uptime Gauge (per platform) | Updown | [uptime.md](../metrics/uptime.md) |
| Downtime Timeline | Updown | Raw events |
| Incident Count by Severity | Updown | [incidents.md](../metrics/incidents.md) |
| MTTR Trend | Updown | [incidents.md](../metrics/incidents.md) |

### 4. Technical Improvements

| Widget | Data Source | Metrics Spec |
|--------|-------------|--------------|
| Improvements by Category | Release Notes | [technical-improvements.md](../metrics/technical-improvements.md) |
| Security Improvements Trend | Release Notes | [technical-improvements.md](../metrics/technical-improvements.md) |
| Bug Fixes vs Enhancements | Release Notes | [technical-improvements.md](../metrics/technical-improvements.md) |

## Filters (Global)

- **Platform:** Multi-select from registered platforms
- **Environment:** `dev`, `staging`, `production`, `all`
- **Time Range:** `24h`, `7d`, `30d`, `90d`, `custom`

## API Requirements (Future)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/platforms` | GET | List platforms |
| `/api/v1/metrics/deployments` | GET | Deployment metrics |
| `/api/v1/metrics/uptime` | GET | Uptime metrics |
| `/api/v1/metrics/incidents` | GET | Incident metrics |
| `/api/v1/metrics/improvements` | GET | Improvement metrics |
| `/api/v1/events/deployments` | GET | Recent deployment events |
| `/api/v1/events/uptime` | GET | Recent uptime events |

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load time | < 3 seconds |
| Data freshness | < 5 minutes for polled sources |
| Availability | 99.9% |
| Authentication | SSO (future) |

## Technology Stack (Future Frontend)

- React or Next.js (TBD)
- API Gateway + Lambda for backend API
- CloudFront for static hosting
- Amazon Cognito for authentication (future)

## Implementation Phases

| Phase | Scope |
|-------|-------|
| Phase 1 | Data ingestion (current repository scope) |
| Phase 2 | Metrics aggregation layer |
| Phase 3 | Dashboard API |
| Phase 4 | Frontend UI |
| Phase 5 | Additional integrations (Jira, GitHub, SonarCloud) |

## Acceptance Criteria

- [ ] All widgets mapped to metrics specs
- [ ] Global filters documented
- [ ] API endpoints defined for Phase 3
- [ ] NFR targets documented
