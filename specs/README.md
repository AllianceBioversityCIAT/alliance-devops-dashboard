# Specifications

This directory is the **source of truth** for the Alliance DevOps Dashboard platform.

## Spec-Driven Development

All features, integrations, data models, metrics, and dashboard requirements are defined here **before** implementation. Code in `src/` must align with these specifications.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `integrations/` | External system integration contracts |
| `metrics/` | Computed metrics definitions and formulas |
| `data-models/` | Domain entity schemas and DynamoDB mappings |
| `dashboard/` | Dashboard UI and API requirements |

## Workflow

1. Author or update spec in the appropriate subdirectory
2. Review with stakeholders
3. Implement in `src/` aligned with spec acceptance criteria
4. Validate with tests
5. Update spec status from Draft → Accepted when complete

## Conventions

- Each spec includes: Overview, Schema, Processing Pipeline, Error Handling, Acceptance Criteria
- Spec status: `Draft` → `Review` → `Accepted` → `Deprecated`
- Cross-reference related specs using relative markdown links
- TypeScript model paths documented in each data model spec
