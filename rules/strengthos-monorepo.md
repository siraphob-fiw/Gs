# StrengthOS Monorepo Rules

## Architecture

- Monorepo managed by Turborepo (or Nx)
- All business logic in services, not controllers/handlers
- Shared types/interfaces in `/packages/shared-types` (never import from Prisma directly)
- Shared utilities/helpers in `/packages/shared-utils`
- Auth, RBAC, and guards in `/packages/shared-auth` and `/packages/shared-security`
- Validation in `/packages/shared-validation` (Zod or DTOs)
- UI components in `/packages/shared-ui`
- Storage, notifications, i18n, mocks in their respective packages

## Code Conventions

- TypeScript everywhere
- Use strict typing, enums, and interfaces
- No wildcard exports; name all exports explicitly
- Use camelCase for variables/functions, PascalCase for types/classes
- Use Prettier and ESLint
- No logic duplication—move to shared packages
- Use DTOs for API input/output
- Use environment variables via `/shared-config`

## DevOps

- Lint, build, typecheck, and test all packages/apps in CI
- Use GitHub Actions for CI/CD
- Deploy frontend to Vercel, backend to AWS EC2/RDS
- Use Prisma migrations for DB, but keep data layer abstracted

## Multi-Tenancy & Auth

- Tenant context resolved from subdomain or JWT claim
- RBAC: roles are admin, coach, user, self_coached
- Auth via Clerk.dev or Auth0 (abstracted in `/shared-auth`)

## Validation

- Use Zod or DTOs for all input validation
- Never couple validation to ORM
