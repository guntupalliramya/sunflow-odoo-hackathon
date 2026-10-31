# SunFlow AI architecture

SunFlow AI manages a solar installation company's customer-to-service workflow. Preserve the connected domain rules; do not replace this application with a static dashboard.

## Structure

- `src/routes/index.tsx`: mounts the application. `src/routes/__root.tsx`: document shell and share metadata.
- `src/features/app.tsx`: responsive shell, live dashboard, module tables, record details, action forms, authentication, assistant, and overview. Modules navigate through URL hashes on the index route.
- `src/features/config.ts`: declarative field definitions, status choices, technician roster, and module labels.
- `src/features/documents.ts`: client-side PDF documents, printing, and spreadsheet-safe CSV exports.
- `src/styles.css`: sage green, navy, and solar yellow design system; responsive and print styles.
- `shared/domain.ts`: record types, collection identifiers, role visibility, and financial aggregates.
- `shared/seed.ts`: clearly fictional, relationally connected demonstration records. Relative dates keep the demo useful.
- `server/engine.ts`: validation and domain mutations. All changes must pass through this engine or an explicitly authenticated administrative endpoint. Do not move critical validation into the browser.
- `server/store.ts`: server identity resolution and organization-scoped persistence. Each workspace mutation uses a PostgreSQL transaction and advisory lock. Critical workflows are atomic and serialized per organization.
- `server/relations.ts`: maps persisted relational columns to domain IDs.
- `db/schema.ts`: Drizzle schema. Record details use JSONB; ownership and important relationships use indexed UUID columns. `db/index.ts` provides the Netlify Drizzle adapter.
- `netlify/database/migrations`: generated schema plus SQL policies, business-key uniqueness, and stock/payment checks. Always include migrations with schema changes. Custom SQL indexes/policies are intentionally additional to the Drizzle snapshot.
- `netlify/functions/workspace.mts`: GET workspace and POST workflow operations, demo role switching/reset, and live administrator staff-role assignment.
- `netlify/functions/files.mts`: authenticated private image uploads and retrieval using Netlify Blobs. Never expose public storage URLs.
- `netlify/functions/assistant.mts`: read-only AI with role-filtered server data. OpenRouter is optional; Netlify AI Gateway is the default.

## Conventions

Use React/TypeScript, Lucide icons, and existing Radix dialog components. Labels and empty/error/loading states must be real and useful. Use the shared INR formatter. All forms must call the backend and reflect errors; never show a success message before a successful API response. Prefer editing existing modules to adding parallel implementations.

Keep financial revenue separate from cash receipts. Refunds reverse payments, not approved sales values. Material costs are snapshotted at quotation time. The dashboard recognizes dispatched costs; project reports label committed costs and projected margins separately. Subsidy paperwork is informational.

Role selection without authentication is exclusively for isolated demo organizations. Live roles and organization IDs come from server-controlled Identity metadata. Never trust request payloads for roles, organization ownership, stock, totals, warranties, or completion statuses. When adding a collection or action, update both server permissions and UI capability checks. Filter nested sensitive fields as well as top-level fields, and do not return raw mutation objects containing private costs.

Do not store business records in localStorage or Blobs. Use managed PostgreSQL. SessionStorage is only for temporary chat text. Uploaded binary photographs use private Blobs with organization-prefixed random keys. API credentials must remain in the server runtime.

The first live administrator is invited and assigned `admin` through Identity's dashboard. Without an explicit organization assignment their user UUID initializes the live organization; all other live roles require the organization's ID. The in-app administrator form assigns existing invited users, never silently grants roles to signups. Demo reset must remain unavailable in live organizations.

Demo BOMs are illustrative configuration, not technical recommendations. Warranty lengths belong to products; do not hardcode universal manufacturer coverage. Replacements retain original expiry unless explicitly corrected with audit history.

## Development and verification

Install using pnpm. Run `netlify dev --port 8889` for an integrated development runtime when the environment permits. Schema generation uses `pnpm exec drizzle-kit generate --name descriptive_name`. Production builds and migrations are managed by Netlify. Follow run-specific restrictions on local commands. No local builds, tests, typechecks, or browser executions were permitted during initial implementation; do not infer tested status from source review. Use `DEMO_CHECKLIST.md` after a deployed runtime is available.
