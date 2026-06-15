## Security overview (Finely Cred)

This repository contains a platform that can handle **sensitive personal information and documents** (credit reports, IDs, evidence, dispute artifacts). Security must be treated as a first-class product requirement.

This document is **not legal advice** and is not a substitute for a professional security assessment. It is a practical engineering blueprint.

### Threat model (high-level)
- **Unauthorized access**: cross-tenant data exposure (agency A sees agency B’s clients) or privilege escalation.
- **Data exfiltration**: leaked storage buckets, long-lived URLs, token/key exposure, malware on user device.
- **Account takeover**: weak passwords, missing MFA, session theft.
- **Supply chain**: unsafe third-party scripts/integrations.
- **Operational mistakes**: misconfigured environments, logging secrets, shipping dev auth to production.

### Security principles
- **Least privilege**: users can only access what they need.
- **Tenant isolation**: every record and file is scoped to a workspace/tenant.
- **Secure by default**: production builds require a secure backend configuration.
- **Minimize PII**: collect only what’s needed; avoid storing unnecessary identifiers.
- **Short-lived access**: use signed URLs for documents; avoid public buckets.
- **Auditability**: log access to sensitive data and document downloads.

### Production guardrail (already enforced)
Production builds require Supabase configuration:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If these are missing, the app displays a configuration-required screen instead of running with local-only storage.

### Recommended architecture (vault-grade)

#### Identity & access
- Supabase Auth (email/password) for all users
- MFA required for admins and strongly recommended for agencies
- Role model (example):
  - `platform_admin`: Finely internal admin
  - `tenant_owner`: agency owner
  - `agent`: agency staff
  - `partner`: end user / client
  - `support`: limited support access (if needed)

#### Multi-tenant data model
All rows include `tenant_id`.
- `tenants` (workspaces)
- `memberships` (user ↔ tenant ↔ role)
- `partners/clients` (records belong to a tenant)
- `cases`, `tasks`, `messages`, `agreements`, etc. (all tenant-scoped)

#### Storage (documents)
- Supabase Storage buckets set to **private**
- Document paths include tenant scoping, for example:
  - `tenant/{tenant_id}/partner/{partner_id}/evidence/{file_id}`
- Downloads use **signed URLs** (short TTL) minted by a server-side endpoint.

#### Database controls (RLS)
- Row Level Security enabled for all sensitive tables.
- Policies enforce:
  - membership in tenant
  - role-based permissions
  - record-level scoping where needed (e.g., `agent` can only access assigned clients)

#### Secrets & integrations
- Never commit secrets (tokens/keys) to the repo.
- If a third-party embed token must be client-visible, treat it as **public** and rotate regularly.
- Prefer server-to-server for webhooks and sensitive API calls.

### Operational controls
- Backups (encrypted) + periodic restore drills
- Key rotation schedule
- Incident response playbook (contacts, triage, containment, notification)
- Security review before enabling:
  - financing webhooks
  - payment methods
  - any “privacy” vendor integrations

