# Architecture Decision Records (ADRs)

> Alliance DevOps Dashboard — Key architectural decisions and rationale.

## ADR-001: Spec-Driven Development

**Status:** Accepted  
**Date:** 2026-06-05

### Context

The platform must serve multiple teams and evolve over time with new integrations and metrics. Without a single source of truth, implementations drift from requirements.

### Decision

All features are specified in `specs/` before implementation. Specs define integrations, data models, metrics, and dashboard requirements. Code must align with specs; spec changes precede code changes.

### Consequences

- ✅ Clear contract between spec authors and implementers
- ✅ Onboarding documentation built-in
- ⚠️ Requires discipline to update specs before code

---

## ADR-002: Serverless-First on AWS

**Status:** Accepted  
**Date:** 2026-06-05

### Context

The workload is event-driven (webhooks, scheduled polls) with variable traffic. Operational overhead should be minimal.

### Decision

Use AWS Lambda, API Gateway, DynamoDB, EventBridge, and Secrets Manager. Infrastructure defined via AWS SAM.

### Consequences

- ✅ Pay-per-use, no server management
- ✅ Auto-scaling ingestion endpoints
- ⚠️ Cold start latency (mitigated with arm64 + provisioned concurrency if needed)
- ⚠️ Vendor lock-in to AWS (acceptable for Alliance infrastructure)

---

## ADR-003: TypeScript with Node.js 22

**Status:** Accepted  
**Date:** 2026-06-05

### Context

Team expertise is primarily JavaScript/TypeScript. Strong typing reduces errors in data transformation pipelines.

### Decision

All application code in TypeScript with strict mode. Target Node.js 22 LTS for Lambda runtime.

### Consequences

- ✅ Type safety across models and repositories
- ✅ Shared types between Lambdas
- ⚠️ Build step required before deployment

---

## ADR-004: DynamoDB Single-Table-Inspired Design

**Status:** Accepted  
**Date:** 2026-06-05

### Context

Multiple entity types (deployments, uptime, releases, improvements) need efficient querying by platform and time range.

### Decision

Use PK/SK patterns with entity type prefixes. GSI1 for cross-entity time-range queries. Separate tables for events, releases, improvements, and platforms to simplify IAM and lifecycle management.

### Consequences

- ✅ Efficient platform-scoped queries
- ✅ Clear table boundaries for access control
- ⚠️ Not a true single-table design (trade-off for simplicity)

---

## ADR-005: Repository Pattern for Data Access

**Status:** Accepted  
**Date:** 2026-06-05

### Context

Lambda handlers should focus on business logic, not DynamoDB SDK details.

### Decision

Abstract DynamoDB operations behind repository classes extending `BaseDynamoDbRepository`. Model mappers handle entity ↔ DynamoDB item conversion.

### Consequences

- ✅ Testable data layer (mock repositories)
- ✅ Consistent CRUD operations
- ✅ Easy to swap storage backend if needed

---

## ADR-006: Structured JSON Logging

**Status:** Accepted  
**Date:** 2026-06-05

### Context

Distributed serverless functions require searchable, structured logs for debugging and observability.

### Decision

Shared logger outputs JSON with timestamp, level, message, service name, and contextual fields. CloudWatch Logs Insights for querying.

### Consequences

- ✅ Machine-parseable logs
- ✅ Consistent format across Lambdas
- ✅ X-Ray trace correlation via requestId

---

## ADR-007: No Real Integrations in Skeleton

**Status:** Accepted  
**Date:** 2026-06-05

### Context

Initial repository delivery is a production-ready skeleton, not a working integration.

### Decision

External API clients (`JenkinsClient`, `UpdownClient`) are placeholders that throw `not implemented` errors. Lambda handlers accept and validate payloads but do not call external APIs.

### Consequences

- ✅ Clear extension points documented in specs
- ✅ Handlers testable with mock payloads
- ⚠️ Phase 2 required for live data

---

## ADR-008: Updown Alert Ingestion Design

**Status:** Accepted  
**Date:** 2026-06-05

### Context

First operational component ingests Updown webhook alerts. Updown stores rich metrics (APDEX, latency by location, history) but webhooks only send alert events. Alliance products use internal `platformId` identifiers not present in Updown payloads.

### Decision

- Component: `updown-alert-ingestion`
- Endpoint: `POST /api/webhooks/updown/alerts`
- Dedicated DynamoDB table: `alliance-devops-uptime-events-{environment}`
- Checks registry table: `alliance-devops-updown-checks-{environment}`
- Environments: `dev`, `staging`, `production`
- Auth: `x-webhook-secret` header vs `UPDOWN_WEBHOOK_SECRET`
- Check registry: auto-register on first webhook; `platformId` slug from `check.alias`
- Initial platform: `bi-prms-front` derived from alias "BI PRMS Front" (token `maoy`)
- Store `rawPayload` with every event; normalize key fields for dashboard queries
- Do not replicate Updown dashboard metrics in Phase 1; API poll in Phase 2

### Consequences

- ✅ Scales to 30+ applications without secret/env map maintenance
- ✅ New Updown checks work automatically on first webhook
- ⚠️ `platformId` derived from alias — review auto-registered checks periodically
- ⚠️ Secret contains only `UPDOWN_WEBHOOK_SECRET`

---

## Template for New ADRs

```markdown
## ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated  
**Date:** YYYY-MM-DD

### Context
Why is this decision needed?

### Decision
What was decided?

### Consequences
What are the trade-offs?
```
