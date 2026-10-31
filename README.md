# SunFlow AI – Solar Installation Management System

SunFlow AI is a connected operations workspace for SunPower Solutions: enquiries, surveys, configured solar quotations, orders, payments, stock and serials, installations, warranties, service, and project profitability.

## Technology

React 19 and TypeScript, TanStack Start on Vite, Tailwind CSS, Lucide icons, Recharts, and jsPDF. Server APIs use Netlify Functions. Persistent records use managed Netlify PostgreSQL with Drizzle schema definitions and versioned SQL migrations. Identity handles live accounts; private photographs use Netlify Blobs. This deployment uses the platform's database, authentication, and storage rather than Supabase. Demo business data also persists in PostgreSQL; it does not rely on localStorage.

## Local development

Use Node 22.23+ or Node 24 and pnpm. Install dependencies with `pnpm install`. Link the Netlify project with `netlify link`, then start the integrated runtime with:

```bash
netlify dev --port 8889
```

Open http://localhost:8889. Use the integrated runtime so database, Identity, private uploads, and functions are available. The production build is handled by the deployment pipeline. Database migrations under `netlify/database/migrations` apply automatically on deployment. Schema changes require updating `db/schema.ts` and running `pnpm exec drizzle-kit generate --name describe_change`.

## Demonstration access

The landing page automatically opens a clearly labeled, isolated demo workspace with fictional data: 10 customers, 5 quotations, 5 orders, 10 products, 5 installations, and 5 tickets. It includes ten package templates; only the illustrative 3 kW On-Grid template has a sample BOM. Configure other BOMs in Inventory → Solar packages before quoting. Sample quantities are not engineering recommendations.

Open the account avatar or Settings to select any of the six roles. No shared credentials are needed for demo access. Demo permissions are enforced on the backend. A random HttpOnly cookie identifies the workspace, with a 30-day browser lifetime. Refreshes preserve records; clearing cookies loses browser access to that workspace. Reset Demo Data requires confirmation and affects only the current demo. Business records are never kept in browser storage. Chat text is stored only in sessionStorage for the current tab and is cleared on role changes.

See the in-app Project Overview and [DEMO_CHECKLIST.md](./DEMO_CHECKLIST.md) for a guided workflow.

## Live account setup

1. After deployment, open the project's Identity panel in the Netlify dashboard. Invite the first administrator and set their server-controlled role to `admin` or `Admin / Director` in their user details. Identity has been enabled for this project.
2. The invite link opens the app's password-setup dialog. Set a password, then sign in through the account menu → Live account. The first administrator's Identity UUID becomes the live organization ID unless a server-managed `app_metadata.organization_id` already exists. A fresh live organization starts empty, without demo records.
3. Open Settings and configure organization details, minimum advance, default tax, and the approved service knowledge base.
4. Invite additional staff through Identity. Copy their user ID from their account details, then use SunFlow Settings → Assign team access. The administrator selects one of the six roles; the backend sets the user's organization and role. The staff member must sign out and sign in after access changes. Cross-organization reassignment and self-demotion are rejected.
5. Add suppliers, products, product-specific warranty durations, engineer-approved package BOMs, and stock receipts. Serial-tracked products require one unique serial per received unit.

Open registration alone does not grant access to a live organization. Neither user-editable profile metadata nor demo role selection grants production privileges. Role metadata is controlled through Identity administrative operations. All data APIs are server-only, scoped to the authenticated organization, and filter returned collections by role. Mutations verify origin and role. PostgreSQL policies isolate organization rows, with additional organization predicates on every query.

## AI configuration

No frontend secret is required. By default, the secure assistant function uses Netlify AI Gateway with the supported `gpt-5.2` model. The gateway becomes available after the first production deployment and uses account credits.

To explicitly use OpenRouter, set these runtime environment variables in the project's environment settings:

- `OPENROUTER_API_KEY`: your server-only OpenRouter credential.
- `OPENROUTER_MODEL`: optional model identifier; defaults to `openrouter/free`.

Redeploy after changing runtime configuration. Never prefix these names with `VITE_`. Database, storage, and Identity configuration are supplied by the Netlify runtime; no Supabase variables are needed. AI errors show a clear unavailable message while module searches and manual workflows remain usable. The assistant is deliberately read-only and cannot approve or modify records.

## Workflow rules

- Only approved surveys and packages with configured BOMs can produce quotations. Prices and material costs are snapshotted into quotation items.
- Sending a quotation updates the lead; accepting a sent, valid quotation creates exactly one order.
- Positive payment amounts and unique references are required. Overpayments and refunds beyond received funds are rejected. Refunds are administrator-only payment reversals.
- Reservation checks unreserved stock. Dispatch requires the configured advance and every reserved serial exactly once. Stock cannot go negative.
- Installation scheduling prevents two active assignments to the same crew lead on the same calendar day. Installation starts only after dispatch. Completion requires all mandatory checks, power-generation results, a private photograph, and typed customer acceptance.
- Completion activates configured product warranties. Non-serialized components receive internal installed-asset tags; these are clearly internal identifiers rather than claimed manufacturer serials. Warranty date corrections require an administrator and audit reason.
- Tickets validate installed equipment ownership. Active warranties initially zero parts and labour charges; an administrator may record an audited exception. Equipment replacement consumes available stock, preserves the original warranty expiry, and records the old serial's service history. Customer confirmation is required to close a resolved ticket.
- Revenue uses order value once, not accumulated payment receipts. The dashboard recognizes dispatched material costs plus recorded expenses. Project reports separately show committed material cost plus project expenses and label the result as projected profit. Subsidy information and paperwork remain separate from sales value. Supplier settlements reduce payables without duplicating material expenses.

## Scope and verification

This is a hackathon-oriented implementation, not a certified accounting, engineering, or electronic-signature product. Live users are staff accounts; customer complaints and customer acceptance are recorded by staff, rather than through a separate customer portal. A typed customer name records acceptance; it is not a biometric signature. Technician conflict prevention is by crew lead and day, not a multi-person hourly resource planner. Service invoices are downloadable documents; service collections require manual financial reconciliation. Notification cards are derived from low stock and open tickets, with no SMS or email delivery.

Tables use organization-scoped relational IDs, UUID primary keys, indexed foreign keys, timestamps, and JSONB record details. Package components and quotation lines are stored as structured arrays inside their parent records rather than separate line-item tables. Production scale beyond the demonstration should introduce pagination, finer-grained SQL queries, normalized line items, retention policies for abandoned demos/files, and staff assignment-level access rules if required.

Source files and workflow branches were reviewed during implementation. The environment disallowed running a local server, build, typecheck, or tests, so no executed end-to-end, browser, or live database verification is claimed. The deployment pipeline must apply migrations and validate the build; use the demonstration checklist to verify runtime behavior after deployment.

### Account entry and registration

The existing Netlify Identity integration now provides the full login, registration,
email confirmation, invitation acceptance, recovery, and logout flow. This deployment
uses Netlify Identity rather than Supabase; no Supabase credentials are read or needed.
Identity owns password hashes and sessions. The PostgreSQL `profiles` table synchronizes
name, company, email, and phone on authenticated workspace requests, including requests
from accounts awaiting access. Unconfirmed accounts remain in Identity until confirmation.
No registration metadata grants roles or chooses an organization.

Enable public signups in the site's Identity settings to allow registration. Configure
the Identity site URL and confirmation, invitation, and recovery email links to return
to this site's root URL; preserve their callback fragments. Verify production email
delivery, or configure Identity's email provider. The first administrator still needs
an explicit `admin` role assigned through the Identity dashboard. Existing administrators
assign verified user IDs and one of the six supported roles in Settings. A company name
entered at registration is contact information, not authorization to join that company.

Remember me keeps sign-in across browser restarts for up to 30 days; unchecked sign-in
uses a browser-session preference cookie. The Identity SDK manages credentials and token
refresh. Browser session restoration settings may retain session cookies. Logging out
clears the SDK session and current workspace. Try Demo requires no credentials or signup
and uses the existing isolated PostgreSQL demo workspace. Exiting a demo removes its
browser access cookie without deleting its database records or changing live records.

Authentication component and server boundary tests cover login success/failure,
registration metadata and validation, recovery, explicit demo entry, anonymous request
rejection, and rejection of self-assigned roles. Live email delivery, browser restart,
cross-tab logout, and role assignment require deployment acceptance checks.
