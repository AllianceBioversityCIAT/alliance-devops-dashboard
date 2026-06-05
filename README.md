# Alliance DevOps Dashboard

Centralized platform for collecting, processing, storing, and visualizing DevOps operational metrics, delivery insights, reliability indicators, and technical improvements across Alliance digital products.

## Overview

This repository follows **Spec-Driven Development (SDD)** — the `specs/` directory is the source of truth for all features. Implementation code must align with specifications; spec changes precede code changes.

### Current Data Sources

| Source | Data | Status |
|--------|------|--------|
| [Jenkins](specs/integrations/jenkins.md) | Deployments, build status, releases | Skeleton |
| [Updown.io](specs/integrations/updown.md) | Availability, downtime, uptime | Skeleton |
| [Release Notes](specs/integrations/release-notes.md) | Improvements, enhancements, bug fixes | Skeleton |

### Future Integrations

Jira · GitHub · SonarCloud · AWS CloudWatch · Grafana · Loki

## Architecture

Serverless-first, AWS-native architecture:

- **Runtime:** Node.js 22 + TypeScript
- **Compute:** AWS Lambda
- **API:** API Gateway
- **Storage:** DynamoDB
- **IaC:** AWS SAM
- **Observability:** CloudWatch Logs + X-Ray

See [docs/architecture.md](docs/architecture.md) for detailed system design.

## Repository Structure

```
alliance-devops-dashboard/
├── specs/                  # 📋 Source of truth (SDD)
│   ├── integrations/       # External system integration specs
│   ├── metrics/            # Computed metrics definitions
│   ├── data-models/        # Domain entity schemas
│   └── dashboard/          # Dashboard UI requirements
├── src/
│   ├── lambdas/            # Ingestion Lambda handlers
│   └── shared/             # Shared libraries
│       ├── config/         # Environment configuration
│       ├── logger/         # Structured JSON logging
│       ├── models/         # TypeScript domain models
│       ├── repositories/   # DynamoDB abstraction
│       ├── clients/        # External API clients (placeholders)
│       └── utils/          # HTTP helpers, validation
├── infrastructure/
│   ├── sam/                # AWS SAM templates
│   └── environments/       # Per-environment config
├── docs/                   # Architecture, roadmap, ADRs
├── tests/                  # Unit and integration tests
└── .github/workflows/      # CI pipeline
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- AWS SAM CLI (for deployment)
- AWS CLI configured (for deployment)

### Installation

```bash
git clone <repository-url>
cd alliance-devops-dashboard
npm install
cp .env.example .env
```

### Development

```bash
# Type checking
npm run typecheck

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Build
npm run build
```

### Local Lambda Testing

```bash
npm run build
sam build --template-file infrastructure/sam/template.yaml
sam local start-api --template-file infrastructure/sam/template.yaml
```

Example ingestion request:

```bash
curl -X POST http://127.0.0.1:3000/ingest/jenkins \
  -H "Content-Type: application/json" \
  -d '{
    "jobName": "alliance-portal/deploy-production",
    "buildNumber": 142,
    "status": "SUCCESS",
    "environment": "production",
    "platformId": "alliance-portal",
    "timestamp": "2026-06-05T14:30:00.000Z"
  }'
```

### Deployment

```bash
npm run build
sam build --template-file infrastructure/sam/template.yaml
sam deploy --config-env dev
```

## Spec-Driven Development Workflow

1. **Write or update spec** in `specs/` (integration, metric, or data model)
2. **Review spec** with stakeholders
3. **Implement** aligned code in `src/`
4. **Test** against spec acceptance criteria
5. **Deploy** via CI/CD pipeline

```
specs/ (source of truth)
   ↓
src/ (implementation)
   ↓
tests/ (validation)
   ↓
infrastructure/ (deployment)
```

## Key Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design and data flow |
| [Roadmap](docs/roadmap.md) | Phased delivery plan |
| [Decisions](docs/decisions.md) | Architecture Decision Records |
| [Dashboard Spec](specs/dashboard/dashboard-overview.md) | Dashboard requirements |

## Extension Points

### Adding a New Integration

1. Create spec: `specs/integrations/<source>.md`
2. Create data model spec: `specs/data-models/<entity>.md`
3. Add metrics spec: `specs/metrics/<metric>.md`
4. Implement model: `src/shared/models/<entity>.ts`
5. Implement repository: `src/shared/repositories/<entity>-repository.ts`
6. Implement client: `src/shared/clients/<source>-client.ts`
7. Implement Lambda: `src/lambdas/<source>-ingestion/`
8. Add SAM resources: `infrastructure/sam/template.yaml`
9. Add tests: `tests/`

### Adding a New Metric

1. Define in `specs/metrics/<metric>.md`
2. Implement aggregation Lambda (Phase 3)
3. Add dashboard widget mapping in `specs/dashboard/dashboard-overview.md`

## Contributing

1. Follow Spec-Driven Development — update specs before code
2. Maintain TypeScript strict mode compliance
3. Add tests for new functionality
4. Follow existing code conventions and patterns
5. Document architectural decisions in `docs/decisions.md`

## License

Apache License 2.0 — see [LICENSE](LICENSE).
