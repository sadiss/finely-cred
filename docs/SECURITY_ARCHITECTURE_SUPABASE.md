## Finely Cred — Vault-grade security architecture (Supabase)

### Goals
- Strong **tenant isolation** (agency workspaces)
- Secure document storage and delivery (credit reports, IDs, evidence)
- Clear roles & permissions
- Audit logs and safe defaults

### Core components

#### 1) Auth
- Supabase Auth for users
- Require MFA for privileged roles
- Store `tenant_id` and `role` via membership tables (not via client-side allowlists)

#### 2) Tables (proposed)
- `tenants`
  - `id`, `name`, `status`, `created_at`
- `memberships`
  - `id`, `tenant_id`, `user_id`, `role`, `created_at`
- `partners` (client files)
  - `id`, `tenant_id`, `profile`, `status`, `created_at`
- `cases`, `tasks`, `messages`, `agreements`, `entitlements`, `audit_events`
  - all contain `tenant_id` and foreign keys back to `partner_id` (where applicable)

#### 3) Storage
- Bucket: `vault`
- Private only
- Object key convention:
  - `tenant/{tenant_id}/partner/{partner_id}/{kind}/{object_id}`
  - kinds: `report_html`, `report_pdf`, `evidence`, `letters`, `ids`

#### 4) RLS policies (pattern)
All sensitive tables:
- `SELECT/INSERT/UPDATE/DELETE` only if:
  - user has membership in `tenant_id`
  - role allows the operation

Example checks:
- `platform_admin`: access across all tenants
- `tenant_owner`: full access within tenant
- `agent`: access within tenant; optionally restricted to assigned partners
- `partner`: access only to their own partner record and associated objects

#### 5) Signed URLs (download)
Do not expose public URLs to documents.
- Server-side endpoint mints signed URLs with TTL (e.g., 60 seconds)
- Frontend requests signed URL when user clicks “Download/Open”

#### 6) Audit logging
Write to `audit_events` on:
- partner record view
- document upload
- document download
- permissions/role changes

Each audit row includes:
- `tenant_id`, `actor_user_id`, `partner_id` (optional), `action`, `meta`, `created_at`

### Secure defaults to enforce
- No local-only persistence in production for sensitive artifacts
- No secrets committed to the repo
- Separate dev/staging/prod environments

