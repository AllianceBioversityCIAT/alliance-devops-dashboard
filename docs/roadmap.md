# Roadmap

> Alliance DevOps Dashboard — Product & Engineering Roadmap

## Phase 1: Foundation (Current)

**Goal:** Establish repository skeleton, specs, and ingestion pipeline scaffolding.

| Item | Status | Spec Reference |
|------|--------|----------------|
| Repository structure | ✅ Complete | — |
| Spec layer (integrations, metrics, models) | ✅ Complete | `specs/` |
| Shared TypeScript libraries | ✅ Complete | `src/shared/` |
| Example Lambda handlers | ✅ Complete | `src/lambdas/` |
| DynamoDB repository abstraction | ✅ Complete | `src/shared/repositories/` |
| SAM infrastructure template | ✅ Complete | `infrastructure/sam/` |
| CI pipeline | ✅ Complete | `.github/workflows/` |

## Phase 2: Ingestion Implementation

**Goal:** Implement real integrations with Jenkins, Updown, and Release Notes.

| Item | Status | Spec Reference |
|------|--------|----------------|
| Jenkins webhook receiver | 🔲 Planned | `specs/integrations/jenkins.md` |
| Jenkins API polling (fallback) | 🔲 Planned | `specs/integrations/jenkins.md` |
| Updown webhook + scheduled poll | 🔲 Planned | `specs/integrations/updown.md` |
| Release notes API + S3 trigger | 🔲 Planned | `specs/integrations/release-notes.md` |
| Platform registry management | 🔲 Planned | `specs/data-models/platform.md` |
| Idempotency enforcement | 🔲 Planned | Data model specs |
| Dead-letter queue handling | 🔲 Planned | Integration specs |
| Integration tests | 🔲 Planned | — |

## Phase 3: Metrics Aggregation

**Goal:** Compute and store aggregated metrics for dashboard consumption.

| Item | Status | Spec Reference |
|------|--------|----------------|
| Deployment frequency aggregation | 🔲 Planned | `specs/metrics/deployments.md` |
| Uptime percentage calculation | 🔲 Planned | `specs/metrics/uptime.md` |
| Incident severity classification | 🔲 Planned | `specs/metrics/incidents.md` |
| Improvement trend aggregation | 🔲 Planned | `specs/metrics/technical-improvements.md` |
| Metrics snapshot table | 🔲 Planned | — |
| Scheduled aggregation Lambdas | 🔲 Planned | — |

## Phase 4: Dashboard API

**Goal:** Expose read APIs for dashboard frontend.

| Item | Status | Spec Reference |
|------|--------|----------------|
| Platform listing API | 🔲 Planned | `specs/dashboard/dashboard-overview.md` |
| Metrics query API | 🔲 Planned | `specs/dashboard/dashboard-overview.md` |
| Event query API (recent deployments, uptime) | 🔲 Planned | `specs/dashboard/dashboard-overview.md` |
| API authentication (Cognito) | 🔲 Planned | — |
| Rate limiting | 🔲 Planned | — |

## Phase 5: Dashboard Frontend

**Goal:** Build the visualization layer.

| Item | Status | Spec Reference |
|------|--------|----------------|
| Executive summary widgets | 🔲 Planned | `specs/dashboard/dashboard-overview.md` |
| Delivery insights section | 🔲 Planned | `specs/dashboard/dashboard-overview.md` |
| Reliability section | 🔲 Planned | `specs/dashboard/dashboard-overview.md` |
| Technical improvements section | 🔲 Planned | `specs/dashboard/dashboard-overview.md` |
| Global filters (platform, env, time) | 🔲 Planned | `specs/dashboard/dashboard-overview.md` |

## Phase 6: Extended Integrations

**Goal:** Expand data sources for richer insights.

| Integration | Priority | Notes |
|-------------|----------|-------|
| Jira | High | Incident and improvement tracking |
| GitHub | High | DORA metrics (lead time, change failure rate) |
| SonarCloud | Medium | Code quality metrics |
| AWS CloudWatch | Medium | Infrastructure metrics |
| Grafana / Loki | Low | Log correlation |

## Milestones

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M1: Skeleton | Q2 2026 | Repository + specs + CI |
| M2: Ingestion MVP | Q3 2026 | Live data from 3 sources |
| M3: Metrics | Q3 2026 | Aggregated metrics API |
| M4: Dashboard v1 | Q4 2026 | Internal dashboard UI |
| M5: Extended sources | Q1 2027 | Jira + GitHub integrations |
